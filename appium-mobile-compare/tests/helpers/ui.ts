import type { ChainablePromiseElement } from 'webdriverio';

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
