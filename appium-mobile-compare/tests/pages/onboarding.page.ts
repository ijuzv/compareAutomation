import { driver, $ } from '@wdio/globals';
import { logger } from '../../../common-utils/logger';
import { buildMatchDeepLink } from '../config/appUnderTest';
import { openMatchOnDevicesViaAdbView } from '../helpers/adbOpenViewMatch';
import { getSessionDeviceSerial } from '../helpers/session';
import { clickIfDisplayed, dismissAndroidSystemSheets, tryClickWithFallbacks } from '../helpers/ui';

const uiSelectorText = (text: string) =>
    $(`android=new UiSelector().text("${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`);

function firstMatchIdForAdOpen(matchIdsForLog?: number[]): number {
    const fromList = matchIdsForLog?.find((id) => Number.isFinite(id) && id > 0);
    if (fromList != null) {
        return fromList;
    }
    const fromEnv = Number.parseInt(process.env.MOBILE_FALLBACK_MATCH_ID ?? '40266', 10);
    return Number.isNaN(fromEnv) ? 40266 : fromEnv;
}

/**
 * After config: DONE → Enter (landing) → on START screen press Android back (no START tap).
 * Logs Enter + emulator udid + planned match deep links to `logs/combined.log`.
 */
async function tapDoneEnterThenBackFromStartScreen(matchIdsForLog?: number[]): Promise<void> {
    const doneLocators = [uiSelectorText('DONE'), $(`android=new UiSelector().textMatches("(?i)^done$")`)];
    for (const done of doneLocators) {
        if (await clickIfDisplayed(done, { timeoutMs: 12000, label: 'DONE' })) {
            break;
        }
    }

    await driver.pause(2600);

    const enterLocators = [
        $('//android.widget.TextView[@text="Enter"]'),
        $('//android.widget.TextView[@text="Enter"]/..'),
        $('//*[@clickable="true" and (@text="Enter" or @text="ENTER")]'),
        $('//*[contains(@content-desc, "Enter") or contains(@content-desc, "enter")]'),
        $(`android=new UiSelector().textContains("Enter")`),
        uiSelectorText('Enter'),
        $(`android=new UiSelector().textMatches("(?i)^\\s*enter\\s*$")`),
        uiSelectorText('ENTER'),
    ];

    let enterOk = false;
    for (const enter of enterLocators) {
        if (await tryClickWithFallbacks(enter, { timeoutMs: 9000, label: 'Enter' })) {
            enterOk = true;
            break;
        }
    }

    if (!enterOk) {
        throw new Error(
            '[onboarding] Could not tap Enter after DONE. Inspect toolbar text/content-desc in UiAutomator.'
        );
    }

    const udid = getSessionDeviceSerial();
    logger.info(
        `[Onboarding] Enter tapped udid=${udid}` +
            (matchIdsForLog?.length ? `; ticker fixture id(s) for this run: ${matchIdsForLog.join(', ')}` : '')
    );
    if (matchIdsForLog?.length) {
        const urls = matchIdsForLog.map((id) => buildMatchDeepLink(id)).join(' | ');
        logger.info(`[Onboarding] Match deep link URL(s) after Enter (same as MatchPage will use): ${urls}`);
    }

    await dismissAndroidSystemSheets(10);

    const startLocators = [
        uiSelectorText('START'),
        $(`android=new UiSelector().textMatches("(?i)^start$")`),
        $(`android=new UiSelector().text("Start")`),
    ];

    let startSeen = false;
    for (const start of startLocators) {
        try {
            await start.waitForDisplayed({ timeout: 15000 });
            startSeen = true;
            break;
        } catch {
            // try next locator
        }
    }

    if (!startSeen) {
        throw new Error('[onboarding] START not visible after Enter; cannot run back on that screen.');
    }

    await driver.pause(500);
    await driver.back();

    const matchIdForOpen = firstMatchIdForAdOpen(matchIdsForLog);
    logger.info(`[Onboarding] after START back: adb VIEW open matchId=${matchIdForOpen} on all default emulators`);
    openMatchOnDevicesViaAdbView(matchIdForOpen);
}

export const OnboardingPage = {
    /** Compatibility + notification sheets (Don't show again / Don't allow). */
    async dismissOptionalDialogs(): Promise<void> {
        await dismissAndroidSystemSheets(14);
    },

    /**
     * @param matchIdsForLog — fixture root ids from ticker; logged to combined.log with full deep link URLs after Enter.
     */
    async completeAfterEnvironment(matchIdsForLog?: number[]): Promise<void> {
        await tapDoneEnterThenBackFromStartScreen(matchIdsForLog);
    },
};
