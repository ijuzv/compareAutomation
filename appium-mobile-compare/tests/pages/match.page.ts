import { driver, $ } from '@wdio/globals';
import { APP_PACKAGE, buildMatchDeepLink } from '../config/appUnderTest';

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

    async openMatchViaDeepLink(matchId: number) {
        await driver.execute('mobile: deepLink', {
            url: buildMatchDeepLink(matchId),
            package: APP_PACKAGE,
        });
        await this.summaryTab().waitForDisplayed({ timeout: 30000 });
    }

    async captureTabs(saveDir: string) {
        const tabs = [
            { name: 'summary', locator: () => this.summaryTab() },
            { name: 'scorecard', locator: () => this.scorecardTab() },
            { name: 'video', locator: () => this.videoTab() },
            { name: 'commentary', locator: () => this.commentaryTab() },
            { name: 'news', locator: () => this.newsTab() },
        ];

        for (const tab of tabs) {
            try {
                const el = tab.locator();
                await el.waitForDisplayed({ timeout: 15000 });
                await el.click();
                await driver.pause(1500);
                await driver.saveScreenshot(`${saveDir}/${tab.name}.png`);
            } catch (err) {
                console.error(`Could not capture tab ${tab.name}`, err);
            }
        }
    }
}

export default new MatchPage();
