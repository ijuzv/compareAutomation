import { driver, $ } from '@wdio/globals';
import { dismissAndroidSystemSheets } from '../helpers/ui';

/** First row in apiAzureEndPoints spinner (prod). Override with MOBILE_CONFIG_PROD_HOST_TEXT. */
const PROD_SPINNER_HOST_TEXT =
    process.env.MOBILE_CONFIG_PROD_HOST_TEXT ?? 'apiv2.cricket.com.au/mobile';

/**
 * UAT spinner: last list entry (stats / fans-uat). Truncated labels in UI — use substring.
 * Override with MOBILE_CONFIG_UAT_HOST_SUBSTRING.
 */
const UAT_SPINNER_HOST_SUBSTRING =
    process.env.MOBILE_CONFIG_UAT_HOST_SUBSTRING ?? 'fans-uat-api.cadigitaltechnology.com';

export class ConfigPage {
    /** Legacy test-id based flow (content-desc). Opt in with MOBILE_USE_LEGACY_CONFIG=1 */
    get apiDropdown() {
        return $('~api_version_dropdown');
    }
    get apiV1Option() {
        return $('~api_v1_option');
    }
    get apiV2Option() {
        return $('~api_v2_option');
    }
    get saveButton() {
        return $('~save_config_btn');
    }

    async selectApi(version: 'v1' | 'v2') {
        await this.apiDropdown.waitForDisplayed();
        await this.apiDropdown.click();

        if (version === 'v1') {
            await this.apiV1Option.click();
        } else {
            await this.apiV2Option.click();
        }

        await this.saveButton.click();
    }

    /**
     * Spinner (apiAzureEndPoints): prod emulator = first option (apiv2…),
     * UAT emulator (emulator-5556) = last option (stats-consumption…fans-uat…).
     */
    async selectEnvironmentByDevice(deviceSerial: string): Promise<void> {
        await dismissAndroidSystemSheets(10);
        const isUatDevice = deviceSerial === 'emulator-5556';

        const dropdown = await $('android.widget.Spinner');
        await dropdown.waitForDisplayed({ timeout: 30000 });
        await dropdown.click();
        await driver.pause(800);

        if (isUatDevice) {
            const option = await $(
                `android=new UiSelector().textContains("${UAT_SPINNER_HOST_SUBSTRING.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`
            );
            await option.waitForDisplayed({ timeout: 10000 });
            await option.click();
        } else {
            const escaped = PROD_SPINNER_HOST_TEXT.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const exact = await $(`android=new UiSelector().text("${escaped}")`);
            try {
                await exact.waitForDisplayed({ timeout: 5000 });
                await exact.click();
            } catch {
                const fallback = await $(
                    `android=new UiSelector().textContains("apiv2.cricket.com.au").instance(0)`
                );
                await fallback.waitForDisplayed({ timeout: 10000 });
                await fallback.click();
            }
        }

        const updateBtn = await $('android=new UiSelector().text("UPDATE")');
        await updateBtn.waitForDisplayed({ timeout: 10000 });
        await updateBtn.click();
    }
}

export default new ConfigPage();
