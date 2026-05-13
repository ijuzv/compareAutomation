import { driver, $ } from '@wdio/globals';
import { DEEP_LINK_MATCHES_HUB, APP_PACKAGE } from '../config/appUnderTest';
import { clickIfDisplayed } from '../helpers/ui';

/**
 * Navigate to the live / matches area after onboarding.
 * Prefers UI; optional MOBILE_DEEP_LINK_MATCHES_HUB env for a manifest-backed fallback.
 */
export const MatchesPage = {
    async goToLiveMatches(): Promise<void> {
        if (DEEP_LINK_MATCHES_HUB) {
            await driver.execute('mobile: deepLink', {
                url: DEEP_LINK_MATCHES_HUB,
                package: APP_PACKAGE,
            });
            await driver.pause(1500);
            return;
        }

        const byExact = $(`android=new UiSelector().text("Matches")`);
        if (await clickIfDisplayed(byExact, { timeoutMs: 8000, label: 'Matches (exact)' })) {
            await driver.pause(1000);
            return;
        }

        const byContains = $(`android=new UiSelector().textContains("Match")`);
        if (await clickIfDisplayed(byContains, { timeoutMs: 8000, label: 'Matches (contains)' })) {
            await driver.pause(1000);
            return;
        }

        console.warn(
            'MatchesPage: could not open Matches via UI. Set MOBILE_DEEP_LINK_MATCHES_HUB to a supported deep link.'
        );
    },
};

export default MatchesPage;
