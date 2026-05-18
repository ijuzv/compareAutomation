import type { ChainablePromiseElement } from 'webdriverio';
import { driver, $ } from '@wdio/globals';

/**
 * Click if the element becomes displayed within the timeout; otherwise no-op.
 */
export async function clickIfDisplayed(
    el: ChainablePromiseElement<WebdriverIO.Element>,
    options: { timeoutMs?: number; label?: string } = {}
): Promise<boolean> {
    const timeout = options.timeoutMs ?? 3500;
    try {
        await el.waitForDisplayed({ timeout });
        if (await el.isDisplayed()) {
            await el.click();
            if (options.label) {
                console.log(`[ui] tapped ${options.label}`);
            }
            return true;
        }
    } catch {
        // not shown — warm session / different build
    }
    return false;
}

/**
 * Like clickIfDisplayed but waits for clickability (Material buttons after transitions).
 */
export async function clickIfClickableWhenShown(
    el: ChainablePromiseElement<WebdriverIO.Element>,
    options: { timeoutMs?: number; label?: string } = {}
): Promise<boolean> {
    const timeout = options.timeoutMs ?? 8000;
    try {
        await el.waitForDisplayed({ timeout });
        await el.waitForClickable({ timeout: Math.min(timeout, 10000) });
        await el.click();
        if (options.label) {
            console.log(`[ui] tapped ${options.label}`);
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Material / splash screens: try clickable wait, then plain display+click, then force (bypasses strict clickability).
 */
export async function tryClickWithFallbacks(
    el: ChainablePromiseElement<WebdriverIO.Element>,
    options: { timeoutMs?: number; label?: string } = {}
): Promise<boolean> {
    const timeout = options.timeoutMs ?? 10000;
    const label = options.label ?? 'element';
    if (await clickIfClickableWhenShown(el, { timeoutMs: timeout, label })) {
        return true;
    }
    if (await clickIfDisplayed(el, { timeoutMs: Math.min(5000, timeout), label: `${label} (display)` })) {
        return true;
    }
    try {
        await el.waitForExist({ timeout: Math.min(5000, timeout) });
        const node = await el;
        const loc = await node.getLocation();
        const size = await node.getSize();
        const x = Math.round(loc.x + size.width / 2);
        const y = Math.round(loc.y + size.height / 2);
        await driver.execute('mobile: clickGesture', { x, y });
        if (label) {
            console.log(`[ui] tapped ${label} (clickGesture @ ${x},${y})`);
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * System / Material dialogs (e.g. "Android App Compatibility") use "Don't Show Again"
 * with varying casing. UiAutomator2 sees these in the active window (app or system UI).
 */
function dontShowAgainLocators(): ChainablePromiseElement<WebdriverIO.Element>[] {
    return [
        $(`android=new UiSelector().textMatches("(?i)don'?t show again")`),
        $(`android=new UiSelector().text("Don't Show Again")`),
        $(`android=new UiSelector().text("Don't show again")`),
        $(`android=new UiSelector().textContains("Show Again").clickable(true)`),
    ];
}

/** POST_NOTIFICATIONS and similar permission sheets (Android). */
function dontAllowLocators(): ChainablePromiseElement<WebdriverIO.Element>[] {
    return [
        $(`android=new UiSelector().textMatches("(?i)don'?t allow")`),
        $(`android=new UiSelector().text("Don't allow")`),
        $(`android=new UiSelector().text("Don\u2019t allow")`),
    ];
}

const SYSTEM_SHEET_PER_LOCATOR_MS = 900;

/** Notification permission — tap at most once per Appium worker/session. */
let dontAllowHandledForSession = false;

/**
 * Tries each locator until one is clicked. Returns true if any tap succeeded.
 */
export async function clickDontShowAgainIfAnyVisible(
    timeoutMsPerCandidate = SYSTEM_SHEET_PER_LOCATOR_MS
): Promise<boolean> {
    for (const el of dontShowAgainLocators()) {
        const ok = await clickIfDisplayed(el, {
            timeoutMs: timeoutMsPerCandidate,
            label: "Don't Show Again",
        });
        if (ok) {
            return true;
        }
    }
    return false;
}

export async function clickDontAllowIfAnyVisible(
    timeoutMsPerCandidate = SYSTEM_SHEET_PER_LOCATOR_MS
): Promise<boolean> {
    for (const el of dontAllowLocators()) {
        const ok = await clickIfDisplayed(el, {
            timeoutMs: timeoutMsPerCandidate,
            label: "Don't allow",
        });
        if (ok) {
            return true;
        }
    }
    return false;
}

/**
 * Repeatedly dismisses stacked "Don't Show Again" sheets (stops when none found).
 */
export async function dismissDontShowAgainWhileVisible(maxPasses = 12): Promise<void> {
    for (let i = 0; i < maxPasses; i++) {
        const hit = await clickDontShowAgainIfAnyVisible(SYSTEM_SHEET_PER_LOCATOR_MS);
        if (!hit) {
            return;
        }
        await driver.pause(450);
    }
}

export async function dismissDontAllowWhileVisible(maxPasses = 12): Promise<void> {
    if (dontAllowHandledForSession) {
        return;
    }
    for (let i = 0; i < maxPasses; i++) {
        const hit = await clickDontAllowIfAnyVisible(SYSTEM_SHEET_PER_LOCATOR_MS);
        if (!hit) {
            return;
        }
        dontAllowHandledForSession = true;
        return;
    }
}

/**
 * Catches system UI that can appear anytime: "Don't Show Again" (e.g. 16 KB compatibility)
 * and "Don't allow" (notification permission, once per session). Stops when neither is found for a pass.
 */
function matchContentProgress() {
    return $('android=new UiSelector().className("android.widget.ProgressBar")');
}

/**
 * After a match tab tap: wait for indeterminate progress to finish, then brief settle (mirrors web `settlePage`).
 */
export async function waitForMatchTabContentReady(options: { timeoutMs?: number } = {}): Promise<void> {
    const timeout = options.timeoutMs ?? 45_000;
    const settleMs = 900;
    const progress = matchContentProgress();

    try {
        await progress.waitForDisplayed({ timeout: 4000 });
        await progress.waitForDisplayed({ timeout, reverse: true });
    } catch {
        // No spinner, or content already loaded.
    }

    await driver.pause(settleMs);
}

export async function dismissAndroidSystemSheets(maxPasses = 14): Promise<void> {
    for (let i = 0; i < maxPasses; i++) {
        const showAgain = await clickDontShowAgainIfAnyVisible(SYSTEM_SHEET_PER_LOCATOR_MS);
        let denyNotif = false;
        if (!dontAllowHandledForSession) {
            denyNotif = await clickDontAllowIfAnyVisible(SYSTEM_SHEET_PER_LOCATOR_MS);
            if (denyNotif) {
                dontAllowHandledForSession = true;
            }
        }
        if (!showAgain && !denyNotif) {
            return;
        }
        await driver.pause(450);
    }
}
