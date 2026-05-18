import type { ActiveMatch } from '../../../common-utils/fixtureFetcher';
import { FixtureFetcher } from '../../../common-utils/fixtureFetcher';
import { APP_PACKAGE, DEEP_LINK_CONFIG } from '../config/appUnderTest';
import ConfigPage from '../pages/config.page';
import MatchPage from '../pages/match.page';
import { OnboardingPage } from '../pages/onboarding.page';
import * as path from 'path';
import * as fs from 'fs-extra';
import { driver } from '@wdio/globals';
import { getSessionDeviceSerial, getSessionEnvName } from '../helpers/session';
import { versionPrefixForMobileEnv } from '../../../common-utils/matchScreenshotPaths';

describe('Appium Mobile API Compare', () => {
    let activeMatches: ActiveMatch[] = [];
    let deviceSerial = '';
    let envName: 'prod' | 'uat' = 'prod';

    before(async () => {
        deviceSerial = getSessionDeviceSerial();
        envName = getSessionEnvName();

        console.log(`Session device serial: ${deviceSerial}, env: ${envName}, app: ${APP_PACKAGE}`);

        activeMatches = await FixtureFetcher.getActiveMatchesForEnv(envName);

        if (activeMatches.length === 0) {
            console.log(
                'No matches from FixtureFetcher (should not happen: server uses fallback). Using single fallback id.'
            );
            const fbId = Number.parseInt(process.env.MOBILE_FALLBACK_MATCH_ID ?? '40266', 10);
            const id = Number.isNaN(fbId) ? 40266 : fbId;
            activeMatches = [{ id, folderSlug: await FixtureFetcher.resolveFolderSlug(id) }];
        }

        if (process.env.MOBILE_USE_LEGACY_CONFIG === '1') {
            await driver.execute('mobile: deepLink', {
                url: DEEP_LINK_CONFIG,
                package: APP_PACKAGE,
            });
            await ConfigPage.selectApi(deviceSerial === 'emulator-5554' ? 'v1' : 'v2');
            return;
        }

        await OnboardingPage.dismissOptionalDialogs();
        await ConfigPage.selectEnvironmentByDevice(deviceSerial);
        await OnboardingPage.completeAfterEnvironment(activeMatches.map((m) => m.id));
    });

    it('should capture tabs for all active matches', async () => {
        if (activeMatches.length === 0) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const versionPrefix = versionPrefixForMobileEnv(envName);

        for (let i = 0; i < activeMatches.length; i++) {
            const match = activeMatches[i];
            console.log(`Processing ${match.folderSlug} (id ${match.id}) on ${envName}`);

            const baseRunDir = path.resolve(__dirname, '../../screenshots', match.folderSlug, timestamp);
            fs.ensureDirSync(baseRunDir);

            if (i === 0) {
                await MatchPage.waitForSummaryReadyAfterAdb();
            } else {
                await MatchPage.openMatchViaDeepLink(match.id);
            }
            await MatchPage.captureTabs(baseRunDir, versionPrefix);
        }
    });
});
