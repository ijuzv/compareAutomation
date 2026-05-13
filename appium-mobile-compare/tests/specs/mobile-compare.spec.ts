import { FixtureFetcher } from '../../../common-utils/fixtureFetcher';
import { APP_PACKAGE, DEEP_LINK_CONFIG } from '../config/appUnderTest';
import ConfigPage from '../pages/config.page';
import MatchPage from '../pages/match.page';
import {MatchesPage} from '../pages/matches.page';
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
            console.log('No active matches found. Using fallback ID 4589.');
            activeMatchIds = [4589];
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
        await OnboardingPage.completeAfterEnvironment();
        await OnboardingPage.backFromStart();
        await MatchesPage.goToLiveMatches();
    });

    it('should capture tabs for all active matches', async () => {
        if (activeMatchIds.length === 0) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        for (const matchId of activeMatchIds) {
            console.log(`Processing Match ID: ${matchId} on ${envName}`);

            const saveDir = path.resolve(
                __dirname,
                `../../screenshots/${envName}/${matchId}/${timestamp}`
            );
            fs.ensureDirSync(saveDir);

            await MatchPage.openMatchViaDeepLink(matchId);
            await MatchPage.captureTabs(saveDir);
        }
    });
});
