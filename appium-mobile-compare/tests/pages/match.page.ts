import * as path from 'path';
import * as fs from 'fs-extra';
import { driver, $ } from '@wdio/globals';
import { logger } from '../../../common-utils/logger';
import { buildMatchDeepLink } from '../config/appUnderTest';
import { openMatchOnDevicesViaAdbView } from '../helpers/adbOpenViewMatch';
import { dismissAndroidSystemSheets } from '../helpers/ui';

function tabByTextMatches(pattern: string) {
    return $(`android=new UiSelector().textMatches("${pattern}")`);
}

export class MatchPage {
    summaryTab() {
        return tabByTextMatches('(?i)^summary$');
    }
    scorecardTab() {
        return tabByTextMatches('(?i)^scorecard$');
    }
    videoTab() {
        return tabByTextMatches('(?i)^video$');
    }
    commentaryTab() {
        return tabByTextMatches('(?i)^commentary$');
    }
    newsTab() {
        return tabByTextMatches('(?i)^news$');
    }

    /**
     * After onboarding adb open: wait for Summary on this session’s device.
     */
    async waitForSummaryReadyAfterAdb(): Promise<void> {
        await dismissAndroidSystemSheets(10);
        await driver.pause(1500);
        await this.summaryTab().waitForDisplayed({ timeout: 30000 });
    }

    /**
     * Opens match on all configured devices via `adb shell am start … VIEW … -d <url>` (no Appium deepLink).
     */
    async openMatchViaDeepLink(matchId: number) {
        await dismissAndroidSystemSheets(10);
        const url = buildMatchDeepLink(matchId);
        logger.info(`[MatchPage] adb VIEW matchId=${matchId} url=${url}`);
        openMatchOnDevicesViaAdbView(matchId);
        await dismissAndroidSystemSheets(10);
        await driver.pause(2000);
        await this.summaryTab().waitForDisplayed({ timeout: 30000 });
        logger.info(`[MatchPage] matchId=${matchId} Summary visible after adb am start`);
    }

    /**
     * Screens per tab under `baseRunDir/tabs/{summary|scorecard|...}.png`.
     * @param baseRunDir — e.g. `screenshots/{env}/{udid}/{matchId}/{timestamp}` (parent folder; `tabs/` is created here)
     */
    async captureTabs(baseRunDir: string) {
        const tabsDir = path.join(baseRunDir, 'tabs');
        fs.ensureDirSync(tabsDir);

        const tabs = [
            { name: 'summary', locator: () => this.summaryTab() },
            { name: 'scorecard', locator: () => this.scorecardTab() },
            { name: 'video', locator: () => this.videoTab() },
            { name: 'commentary', locator: () => this.commentaryTab() },
            { name: 'news', locator: () => this.newsTab() },
        ];

        logger.info(`[MatchPage] capturing tabs under ${tabsDir}`);

        for (const tab of tabs) {
            try {
                const el = tab.locator();
                await el.waitForDisplayed({ timeout: 15000 });
                await el.click();
                await driver.pause(1500);
                const filePath = path.join(tabsDir, `${tab.name}.png`);
                await driver.saveScreenshot(filePath);
            } catch (err) {
                console.error(`Could not capture tab ${tab.name}`, err);
            }
        }
    }
}

export default new MatchPage();
