import { execFileSync } from 'child_process';
import { driver, $ } from '@wdio/globals';
import { logger } from '../../../common-utils/logger';
import { APP_PACKAGE, buildMatchDeepLink, MATCH_VIEW_ACTIVITY_COMPONENT } from '../config/appUnderTest';
import { dismissAndroidSystemSheets } from '../helpers/ui';
import { getSessionDeviceSerial } from '../helpers/session';

function tabByTextMatches(pattern: string) {
    return $(`android=new UiSelector().textMatches("${pattern}")`);
}

async function summaryVisible(timeoutMs: number): Promise<boolean> {
    try {
        await tabByTextMatches('(?i)^summary$').waitForDisplayed({ timeout: timeoutMs });
        return true;
    } catch {
        return false;
    }
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
     * Opens match via `mobile: deepLink`; if Summary does not appear, falls back to the same URI with
     * `adb shell am start … -n …SplashActivity -d <url>` (logged to combined.log).
     */
    async openMatchViaDeepLink(matchId: number) {
        await dismissAndroidSystemSheets(10);
        const url = buildMatchDeepLink(matchId);
        const udid = getSessionDeviceSerial();
        logger.info(`[MatchPage] udid=${udid} matchId=${matchId} (ticker Fixtures[].Id) deepLink url=${url}`);

        await driver.execute('mobile: deepLink', {
            url,
            package: APP_PACKAGE,
        });

        if (await summaryVisible(12000)) {
            logger.info(`[MatchPage] udid=${udid} matchId=${matchId} Summary visible after mobile: deepLink`);
            return;
        }

        logger.warn(
            `[MatchPage] udid=${udid} matchId=${matchId} Summary not shown after deepLink; using adb am start VIEW fallback.`
        );

        if (udid === 'unknown') {
            throw new Error(
                '[MatchPage] adb fallback needs appium:udid (got unknown). Set capabilities or MOBILE_FORCE_ENV + udid.'
            );
        }

        const adbArgs = [
            '-s',
            udid,
            'shell',
            'am',
            'start',
            '-a',
            'android.intent.action.VIEW',
            '-c',
            'android.intent.category.BROWSABLE',
            '-n',
            MATCH_VIEW_ACTIVITY_COMPONENT,
            '-d',
            url,
        ];
        const adbOneLine = `adb ${adbArgs.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`;
        logger.info(`[MatchPage] adb fallback: ${adbOneLine}`);

        execFileSync('adb', adbArgs, { encoding: 'utf-8', stdio: 'pipe' });

        await driver.pause(2000);
        await this.summaryTab().waitForDisplayed({ timeout: 30000 });
        logger.info(`[MatchPage] udid=${udid} matchId=${matchId} Summary visible after adb am start`);
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
