import { driver, $ } from '@wdio/globals';
import { clickIfDisplayed } from '../helpers/ui';

const uiSelectorText = (text: string) =>
    $(`android=new UiSelector().text("${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`);

/**
 * First-run / system dialogs before environment selection.
 */
async function dismissOptionalOk(): Promise<void> {
    const ok = uiSelectorText('OK');
    await clickIfDisplayed(ok, { timeoutMs: 4000, label: 'OK' });
}

async function dismissOptionalDontAllow(): Promise<void> {
    const dontAllow = $(`android=new UiSelector().text("Don't allow")`);
    await clickIfDisplayed(dontAllow, { timeoutMs: 4000, label: "Don't allow" });
}

/**
 * Steps after environment + UPDATE: DONE, ENTER, optional OK, START.
 */
async function tapDoneEnterOkStart(): Promise<void> {
    const done = uiSelectorText('DONE');
    await clickIfDisplayed(done, { timeoutMs: 15000, label: 'DONE' });

    const enter = uiSelectorText('ENTER');
    await clickIfDisplayed(enter, { timeoutMs: 15000, label: 'ENTER' });

    const ok = uiSelectorText('OK');
    await clickIfDisplayed(ok, { timeoutMs: 4000, label: 'OK (post ENTER)' });

    const start = uiSelectorText('START');
    await clickIfDisplayed(start, { timeoutMs: 15000, label: 'START' });
}

export const OnboardingPage = {
    async dismissOptionalDialogs(): Promise<void> {
        await dismissOptionalOk();
        await dismissOptionalDontAllow();
    },

    async completeAfterEnvironment(): Promise<void> {
        await tapDoneEnterOkStart();
    },

    /** After START: back once then caller navigates to matches. */
    async backFromStart(): Promise<void> {
        await driver.pause(500);
        await driver.back();
    },
};
