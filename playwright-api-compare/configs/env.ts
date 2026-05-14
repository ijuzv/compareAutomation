import * as dotenv from 'dotenv';
import * as path from 'path';

// Repo root .env, then package-local .env (local wins on duplicate keys).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Path segment before the numeric ticker id, e.g. `/matches/CA:` → `/matches/CA:39266`. */
const WEB_MATCH_PATH_PREFIX = process.env.WEB_MATCH_PATH_PREFIX || '/matches/CA:';

export const ENV = {
  V1: {
    BASE_URL: process.env.BASE_URL_V1 || 'http://localhost:3000/v1',
    API_URL: process.env.API_URL_V1 || 'http://localhost:4000/v1',
  },
  V2: {
    BASE_URL: process.env.BASE_URL_V2 || 'http://localhost:3000/v2',
    API_URL: process.env.API_URL_V2 || 'http://localhost:4000/v2',
  },
  /** Cricket web: UAT (e.g. Pulse dev) vs production hosts for `/matches/CA:{tickerId}`. */
  WEB: {
    UAT_BASE_URL: trimTrailingSlashes(
      process.env.WEB_UAT_BASE_URL || 'https://web.cricket-australia.dev.pulselive.com'
    ),
    PROD_BASE_URL: trimTrailingSlashes(process.env.WEB_PROD_BASE_URL || 'https://www.cricket.com.au'),
    MATCH_PATH_PREFIX: WEB_MATCH_PATH_PREFIX.startsWith('/')
      ? WEB_MATCH_PATH_PREFIX
      : `/${WEB_MATCH_PATH_PREFIX}`,
  },
  SCREENSHOT_INTERVAL: parseInt(process.env.SCREENSHOT_INTERVAL || '300000', 10),
  WORKERS: parseInt(process.env.WORKERS || '4', 10),
  HEADLESS: process.env.HEADLESS !== 'false',
  DEVICE: process.env.DEVICE || 'Desktop Chrome',
};
