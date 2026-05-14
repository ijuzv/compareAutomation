import * as fs from 'fs-extra';
import * as path from 'path';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test.fixture';
import type { ActiveMatch } from '~common-utils/fixtureFetcher';
import { FixtureFetcher } from '~common-utils/fixtureFetcher';
import { logger } from '~common-utils/logger';
import { versionPrefixForWebSide } from '~common-utils/matchScreenshotPaths';
import { ENV } from '../../configs/env';
import {
  DEFAULT_MATCH_TABS,
  matchPathForTickerId,
  matchUrlWithTab,
  settlePage,
  showMatchTab,
  tabStripOffersTab,
} from '../helpers/matchWebCapture';

test.describe('UAT and production match pages', () => {
  let activeMatches: ActiveMatch[] = [];

  test.beforeAll(async () => {
    activeMatches = await FixtureFetcher.getActiveMatches();
  });

  test('open CA match URLs, tabs when available, save screenshots', async ({ uatPage, prodPage }) => {
    expect(activeMatches.length, 'FixtureFetcher should return at least one match').toBeGreaterThan(0);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotsDir = path.resolve(__dirname, '../../screenshots');
    const prefix = ENV.WEB.MATCH_PATH_PREFIX;

    for (const match of activeMatches) {
      const matchPath = matchPathForTickerId(prefix, match.id);
      logger.info(`Capturing UAT + prod for ${match.folderSlug} (${matchPath}, id ${match.id})`);

      const runDir = path.join(screenshotsDir, match.folderSlug, timestamp);
      await fs.ensureDir(runDir);

      const runSide = async (page: Page, side: 'uat' | 'prod') => {
        const label = versionPrefixForWebSide(side);
        await page.goto(matchUrlWithTab(matchPath, 'summary'), {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });
        await settlePage(page);

        for (const tab of DEFAULT_MATCH_TABS) {
          const offered = await tabStripOffersTab(page, tab);
          if (!offered) {
            logger.info(`Skip ${side} / ${tab.name}: tab not offered on this build (optional).`);
            continue;
          }
          try {
            await showMatchTab(page, matchPath, tab);
            const file = path.join(runDir, `${label}-${tab.name}.png`);
            await page.screenshot({ path: file, fullPage: true });
            logger.info(`Saved ${side} ${tab.name} → ${file}`);
          } catch (e) {
            logger.warn(`Skip ${side} / ${tab.name} after error (optional): ${String(e)}`);
          }
        }
      };

      await Promise.all([runSide(uatPage, 'uat'), runSide(prodPage, 'prod')]);
    }
  });
});
