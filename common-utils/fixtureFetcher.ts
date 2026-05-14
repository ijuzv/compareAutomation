import axios from 'axios';
import { logger } from './logger';

/**
 * One element of the ticker `Fixtures` array. Match id for deep links is the **root** `Id`
 * (e.g. 40266), not `Competition.Id` / series id (e.g. 4589).
 */
export interface Fixture {
  Id: number;
  StartDateTime: string;
  EndDateTime: string;
  IsCompleted: boolean;
  IsLive?: boolean;
}

/** When ticker yields no live and no in-window match, use this root `Id` (see MOBILE_FALLBACK_MATCH_ID). */
const FALLBACK_TICKER_FIXTURE_ID = (() => {
  const n = Number.parseInt(process.env.MOBILE_FALLBACK_MATCH_ID ?? '40266', 10);
  return Number.isNaN(n) ? 40266 : n;
})();

/** Public match ticker used for prod and UAT workers unless overridden per env. */
const DEFAULT_FIXTURES_URL =
  'https://apiv2.cricket.com.au/web/matchticker/fixtures?Region=AU&format=json';

export class FixtureFetcher {
  /**
   * Active match IDs from the default match ticker.
   * **Ticker field:** each object’s root **`Id`** in `Fixtures[]` (match id for `CA:` URLs), not `Competition.Id`.
   */
  static async getActiveMatchIds(): Promise<number[]> {
    return FixtureFetcher.getActiveMatchIdsFromUrl(
      process.env.MOBILE_FIXTURES_URL_PROD ?? DEFAULT_FIXTURES_URL
    );
  }

  /**
   * Active match IDs for prod vs uat workers.
   * **Ticker field:** root **`Id`** on each entry in `response.data.Fixtures[]` (same value as in `…/matches/CA:{Id}`).
   * Override ticker URL with MOBILE_FIXTURES_URL_PROD / MOBILE_FIXTURES_URL_UAT when needed.
   */
  static async getActiveMatchIdsForEnv(env: 'prod' | 'uat'): Promise<number[]> {
    const url =
      env === 'uat'
        ? process.env.MOBILE_FIXTURES_URL_UAT ?? DEFAULT_FIXTURES_URL
        : process.env.MOBILE_FIXTURES_URL_PROD ?? DEFAULT_FIXTURES_URL;
    return FixtureFetcher.getActiveMatchIdsFromUrl(url);
  }

  private static async getActiveMatchIdsFromUrl(url: string): Promise<number[]> {
    try {
      const response = await axios.get(url);
      const fixtures: Fixture[] = response.data?.Fixtures || [];
      const liveOnly = process.env.MOBILE_FIXTURES_LIVE_ONLY === '1';

      const liveIds = fixtures
        .filter((f) => f.IsLive === true && !f.IsCompleted)
        .map((f) => f.Id);
      const uniqueLive = [...new Set(liveIds)];

      if (uniqueLive.length > 0) {
        logger.info(
          `Ticker ${url}: ${uniqueLive.length} id(s) from Fixtures[].Id where IsLive=true (not completed): ${uniqueLive.join(', ')}`
        );
        return uniqueLive;
      }

      if (liveOnly) {
        logger.warn(
          `Ticker ${url}: no IsLive=true rows; MOBILE_FIXTURES_LIVE_ONLY=1. Using fallback Fixtures[].Id=${FALLBACK_TICKER_FIXTURE_ID}.`
        );
        return [FALLBACK_TICKER_FIXTURE_ID];
      }

      const now = new Date();
      const windowIds: number[] = [];

      for (const fixture of fixtures) {
        if (!fixture.IsCompleted) {
          const startTime = new Date(fixture.StartDateTime);
          const endTime = new Date(fixture.EndDateTime);

          if (now >= startTime && now <= endTime) {
            windowIds.push(fixture.Id);
          }
        }
      }

      const unique = [...new Set(windowIds)];
      if (unique.length > 0) {
        logger.info(
          `Ticker ${url}: ${unique.length} id(s) from Fixtures[].Id in current StartDateTime–EndDateTime window (not completed): ${unique.join(', ')}`
        );
        return unique;
      }

      logger.warn(
        `Ticker ${url}: no IsLive rows and no in-window fixture. Using fallback Fixtures[].Id=${FALLBACK_TICKER_FIXTURE_ID} (MOBILE_FALLBACK_MATCH_ID).`
      );
      return [FALLBACK_TICKER_FIXTURE_ID];
    } catch (error) {
      logger.error(`Error fetching fixtures from ${url}: ${error}`);
      logger.warn(
        `Using fallback Fixtures[].Id=${FALLBACK_TICKER_FIXTURE_ID} after ticker error (override: MOBILE_FALLBACK_MATCH_ID).`
      );
      return [FALLBACK_TICKER_FIXTURE_ID];
    }
  }
}
