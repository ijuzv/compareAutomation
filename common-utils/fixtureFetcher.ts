import axios from 'axios';
import https from 'node:https';
import { logger } from './logger';
import {
  type ActiveMatch,
  type TickerFixtureRow,
  buildMatchFolderSlugFromTickerRow,
  fallbackMatchFolderSlug,
  folderSlugOverrideFromEnv,
} from './matchScreenshotPaths';

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

export type { ActiveMatch } from './matchScreenshotPaths';

/** When ticker yields no live and no in-window match, use this root `Id` (see MOBILE_FALLBACK_MATCH_ID). */
const FALLBACK_TICKER_FIXTURE_ID = (() => {
  const n = Number.parseInt(process.env.MOBILE_FALLBACK_MATCH_ID ?? '40266', 10);
  return Number.isNaN(n) ? 40266 : n;
})();

/** Public match ticker used for prod and UAT workers unless overridden per env. */
const DEFAULT_FIXTURES_URL =
  'https://apiv2.cricket.com.au/web/matchticker/fixtures?Region=AU&format=json';

let prodFixturesSlugCache: TickerFixtureRow[] | null = null;

export class FixtureFetcher {
  /**
   * Active match IDs from the default match ticker.
   * **Ticker field:** each object’s root **`Id`** in `Fixtures[]` (match id for `CA:` URLs), not `Competition.Id`.
   */
  static async getActiveMatchIds(): Promise<number[]> {
    const rows = await FixtureFetcher.getActiveMatches();
    return rows.map((r) => r.id);
  }

  /**
   * Active matches (id + folder slug from HomeTeam/AwayTeam short names) for web screenshots.
   */
  static async getActiveMatches(): Promise<ActiveMatch[]> {
    return FixtureFetcher.getActiveMatchesFromUrl(
      process.env.MOBILE_FIXTURES_URL_PROD ?? DEFAULT_FIXTURES_URL
    );
  }

  /**
   * Active match IDs for prod vs uat workers.
   * **Ticker field:** root **`Id`** on each entry in `response.data.Fixtures[]` (same value as in `…/matches/CA:{Id}`).
   * Override ticker URL with MOBILE_FIXTURES_URL_PROD / MOBILE_FIXTURES_URL_UAT when needed.
   */
  static async getActiveMatchIdsForEnv(env: 'prod' | 'uat'): Promise<number[]> {
    const rows = await FixtureFetcher.getActiveMatchesForEnv(env);
    return rows.map((r) => r.id);
  }

  /**
   * Active matches for mobile (same ticker selection as ids, plus `folderSlug` for screenshot dirs).
   */
  static async getActiveMatchesForEnv(env: 'prod' | 'uat'): Promise<ActiveMatch[]> {
    const url =
      env === 'uat'
        ? process.env.MOBILE_FIXTURES_URL_UAT ?? DEFAULT_FIXTURES_URL
        : process.env.MOBILE_FIXTURES_URL_PROD ?? DEFAULT_FIXTURES_URL;
    return FixtureFetcher.getActiveMatchesFromUrl(url);
  }

  /**
   * Web-style folder slug `{Home}-vs-{Away}_id{id}` even when the env ticker request failed.
   */
  static async resolveFolderSlug(matchId: number, fixtures?: TickerFixtureRow[]): Promise<string> {
    const fromEnv = folderSlugOverrideFromEnv(matchId);
    if (fromEnv) {
      return fromEnv;
    }

    const hit = fixtures?.find((f) => f.Id === matchId);
    if (hit) {
      return buildMatchFolderSlugFromTickerRow(hit);
    }

    const prodFixtures = await FixtureFetcher.loadProdFixturesForSlug();
    const prodHit = prodFixtures.find((f) => f.Id === matchId);
    if (prodHit) {
      return buildMatchFolderSlugFromTickerRow(prodHit);
    }

    return fallbackMatchFolderSlug(matchId);
  }

  private static axiosOptions() {
    if (process.env.MOBILE_FIXTURES_TLS_INSECURE === '1') {
      return { httpsAgent: new https.Agent({ rejectUnauthorized: false }) };
    }
    return {};
  }

  private static async fetchFixtures(url: string): Promise<TickerFixtureRow[]> {
    const response = await axios.get(url, FixtureFetcher.axiosOptions());
    return response.data?.Fixtures || [];
  }

  private static async loadProdFixturesForSlug(): Promise<TickerFixtureRow[]> {
    if (prodFixturesSlugCache) {
      return prodFixturesSlugCache;
    }
    const url = process.env.MOBILE_FIXTURES_URL_PROD ?? DEFAULT_FIXTURES_URL;
    try {
      prodFixturesSlugCache = await FixtureFetcher.fetchFixtures(url);
      return prodFixturesSlugCache;
    } catch (error) {
      logger.warn(`Could not load prod ticker for folder slugs (${url}): ${error}`);
      return [];
    }
  }

  private static async fallbackActiveMatch(
    fixtures?: TickerFixtureRow[]
  ): Promise<ActiveMatch[]> {
    const folderSlug = await FixtureFetcher.resolveFolderSlug(
      FALLBACK_TICKER_FIXTURE_ID,
      fixtures
    );
    return [{ id: FALLBACK_TICKER_FIXTURE_ID, folderSlug }];
  }

  private static async getActiveMatchesFromUrl(url: string): Promise<ActiveMatch[]> {
    try {
      const fixtures = await FixtureFetcher.fetchFixtures(url);
      const liveOnly = process.env.MOBILE_FIXTURES_LIVE_ONLY === '1';

      const liveFixtures = fixtures.filter((f) => f.IsLive === true && !f.IsCompleted);
      if (liveFixtures.length > 0) {
        const seen = new Set<number>();
        const out: ActiveMatch[] = [];
        for (const f of liveFixtures) {
          if (seen.has(f.Id)) continue;
          seen.add(f.Id);
          out.push({ id: f.Id, folderSlug: buildMatchFolderSlugFromTickerRow(f) });
        }
        logger.info(
          `Ticker ${url}: ${out.length} live match(es): ${out.map((m) => `${m.folderSlug} (${m.id})`).join('; ')}`
        );
        return out;
      }

      if (liveOnly) {
        logger.warn(
          `Ticker ${url}: no IsLive=true rows; MOBILE_FIXTURES_LIVE_ONLY=1. Using fallback id=${FALLBACK_TICKER_FIXTURE_ID}.`
        );
        return FixtureFetcher.fallbackActiveMatch(fixtures);
      }

      const now = new Date();
      const windowFixtures = fixtures.filter((f) => {
        if (f.IsCompleted) return false;
        const startTime = new Date(f.StartDateTime);
        const endTime = new Date(f.EndDateTime);
        return now >= startTime && now <= endTime;
      });

      if (windowFixtures.length > 0) {
        const seen = new Set<number>();
        const out: ActiveMatch[] = [];
        for (const f of windowFixtures) {
          if (seen.has(f.Id)) continue;
          seen.add(f.Id);
          out.push({ id: f.Id, folderSlug: buildMatchFolderSlugFromTickerRow(f) });
        }
        logger.info(
          `Ticker ${url}: ${out.length} in-window match(es): ${out.map((m) => `${m.folderSlug} (${m.id})`).join('; ')}`
        );
        return out;
      }

      logger.warn(
        `Ticker ${url}: no IsLive rows and no in-window fixture. Using fallback id=${FALLBACK_TICKER_FIXTURE_ID} (MOBILE_FALLBACK_MATCH_ID).`
      );
      return FixtureFetcher.fallbackActiveMatch(fixtures);
    } catch (error) {
      logger.error(`Error fetching fixtures from ${url}: ${error}`);
      logger.warn(
        `Using fallback id=${FALLBACK_TICKER_FIXTURE_ID} after ticker error (override: MOBILE_FALLBACK_MATCH_ID).`
      );
      return FixtureFetcher.fallbackActiveMatch();
    }
  }
}
