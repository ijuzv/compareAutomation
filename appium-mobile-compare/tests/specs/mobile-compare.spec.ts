import { FixtureFetcher } from '../../../common-utils/fixtureFetcher';
import { APP_PACKAGE, DEEP_LINK_CONFIG } from '../config/appUnderTest';
import ConfigPage from '../pages/config.page';
import MatchPage from '../pages/match.page';
import { OnboardingPage } from '../pages/onboarding.page';
import * as path from 'path';
import * as fs from 'fs-extra';
import { driver } from '@wdio/globals';
import { getSessionDeviceSerial, getSessionEnvName } from '../helpers/session';

describe('Appium Mobile API Compare', () => {
    let activeMatchIds: number[] = [];
    let deviceSerial = '';
    let envName: 'prod' | 'uat' = 'prod';

    before(async () => {
        deviceSerial = getSessionDeviceSerial();
        envName = getSessionEnvName();

        console.log(`Session device serial: ${deviceSerial}, env: ${envName}, app: ${APP_PACKAGE}`);

        activeMatchIds = await FixtureFetcher.getActiveMatchIdsForEnv(envName);

        if (activeMatchIds.length === 0) {
            console.log(
                'No match ids from FixtureFetcher (should not happen: server uses fallback 40266). Using [40266].'
            );
            activeMatchIds = [40266];
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
        await OnboardingPage.completeAfterEnvironment(activeMatchIds);
    });

    it('should capture tabs for all active matches', async () => {
        if (activeMatchIds.length === 0) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        for (let i = 0; i < activeMatchIds.length; i++) {
            const matchId = activeMatchIds[i];
            console.log(`Processing Match ID: ${matchId} on ${envName}`);

            const baseRunDir = path.resolve(
                __dirname,
                '../../screenshots',
                envName,
                deviceSerial,
                String(matchId),
                timestamp
            );
            fs.ensureDirSync(baseRunDir);

            if (i === 0) {
                await MatchPage.waitForSummaryReadyAfterAdb();
            } else {
                await MatchPage.openMatchViaDeepLink(matchId);
            }
            await MatchPage.captureTabs(baseRunDir);
        }
    });
});
