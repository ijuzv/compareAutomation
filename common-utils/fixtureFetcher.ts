import axios from 'axios';
import { logger } from './logger';

export interface Fixture {
  Id: number;
  StartDateTime: string;
  EndDateTime: string;
  IsCompleted: boolean;
}

const DEFAULT_PROD_FIXTURES_URL =
  'https://apiv2.cricket.com.au/web/matchticker/fixtures?Region=AU&format=json';

export class FixtureFetcher {
  /**
   * Active match IDs from the default prod match ticker.
   */
  static async getActiveMatchIds(): Promise<number[]> {
    return FixtureFetcher.getActiveMatchIdsFromUrl(
      process.env.MOBILE_FIXTURES_URL_PROD ?? DEFAULT_PROD_FIXTURES_URL
    );
  }

  /**
   * Active match IDs for prod vs uat workers.
   * UAT defaults to the same ticker URL unless MOBILE_FIXTURES_URL_UAT is set (or same IDs, different app backend).
   */
  static async getActiveMatchIdsForEnv(env: 'prod' | 'uat'): Promise<number[]> {
    const url =
      env === 'uat'
        ? process.env.MOBILE_FIXTURES_URL_UAT ??
          process.env.MOBILE_FIXTURES_URL_PROD ??
          DEFAULT_PROD_FIXTURES_URL
        : process.env.MOBILE_FIXTURES_URL_PROD ?? DEFAULT_PROD_FIXTURES_URL;
    return FixtureFetcher.getActiveMatchIdsFromUrl(url);
  }

  private static async getActiveMatchIdsFromUrl(url: string): Promise<number[]> {
    try {
      const response = await axios.get(url);
      const fixtures: Fixture[] = response.data?.Fixtures || [];

      const now = new Date();
      const activeIds: number[] = [];

      for (const fixture of fixtures) {
        if (!fixture.IsCompleted) {
          const startTime = new Date(fixture.StartDateTime);
          const endTime = new Date(fixture.EndDateTime);

          if (now >= startTime && now <= endTime) {
            activeIds.push(fixture.Id);
          }
        }
      }

      logger.info(`Found ${activeIds.length} active matches from ${url}: ${activeIds.join(', ')}`);
      return activeIds;
    } catch (error) {
      logger.error(`Error fetching fixtures from ${url}: ${error}`);
      return [];
    }
  }
}
