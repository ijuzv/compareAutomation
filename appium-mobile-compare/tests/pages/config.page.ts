import { driver, $ } from '@wdio/globals';

const PROD_HOST_LABEL = 'api-v2.cricket.com.au/mobile';
const UAT_HOST_LABEL = 'uat-api-v2-cdn.ca-digi.com/mobile';

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
     * Spinner + visible API host row, then UPDATE (real CA config UI).
     */
    async selectEnvironmentByDevice(deviceSerial: string): Promise<void> {
        const isUatDevice = deviceSerial === 'emulator-5556';
        const hostLabel = isUatDevice ? UAT_HOST_LABEL : PROD_HOST_LABEL;

        const dropdown = await $('android.widget.Spinner');
        await dropdown.waitForDisplayed({ timeout: 30000 });
        await dropdown.click();
        await driver.pause(800);

        const option = await $(`android=new UiSelector().text("${hostLabel}")`);
        await option.waitForDisplayed({ timeout: 10000 });
        await option.click();

        const updateBtn = await $('android=new UiSelector().text("UPDATE")');
        await updateBtn.waitForDisplayed({ timeout: 10000 });
        await updateBtn.click();
    }
}

export default new ConfigPage();
