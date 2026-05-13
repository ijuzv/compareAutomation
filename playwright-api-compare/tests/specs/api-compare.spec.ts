import { test, expect } from '../fixtures/test.fixture';
import * as fs from 'fs-extra';
import * as path from 'path';
import { VisualComparator } from '~common-utils/visualComparator';
import { ApiInterceptor } from '~common-utils/apiInterceptor';
import { logger } from '~common-utils/logger';
import { FixtureFetcher } from '~common-utils/fixtureFetcher';

test.describe('API and Visual Comparison Suite', () => {
  let activeMatchIds: number[] = [];

  test.beforeAll(async () => {
    activeMatchIds = await FixtureFetcher.getActiveMatchIds();
    if (activeMatchIds.length === 0) {
      logger.info('No active matches found for Playwright run. Using fallback ID 4589.');
      activeMatchIds = [4589];
    }
  });

  test('Compare active matches across all tabs', async ({ v1Page, v2Page, v1Interceptor, v2Interceptor }) => {
    if (activeMatchIds.length === 0) {
      test.skip();
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = path.resolve(__dirname, '../../screenshots');

    const tabs = [
      { name: 'summary', path: '#summary' },
      { name: 'scorecard', path: '#scorecard' },
      { name: 'video', path: '#video' },
      { name: 'commentary', path: '#commentary' },
      { name: 'news', path: '#news' }
    ];

    for (const matchId of activeMatchIds) {
      logger.info(`Processing Match ID: ${matchId}`);
      
      const v1MatchUrl = `/match/${matchId}`;
      const v2MatchUrl = `/match/${matchId}`;

      // We go to the base match URL first
      await Promise.all([
        v1Page.goto(v1MatchUrl),
        v2Page.goto(v2MatchUrl)
      ]);

      await v1Page.waitForTimeout(2000);
      await v2Page.waitForTimeout(2000);

      // Iterate through each tab
      for (const tab of tabs) {
        logger.info(`Capturing Tab: ${tab.name} for Match: ${matchId}`);
        
        // This is pseudo-code for clicking tabs. 
        // In reality, you'd use a robust locator like: await v1Page.locator(`[data-testid="tab-${tab.name}"]`).click()
        // Or if it's hash-based navigation:
        await Promise.all([
          v1Page.goto(`${v1MatchUrl}${tab.path}`),
          v2Page.goto(`${v2MatchUrl}${tab.path}`)
        ]);

        await v1Page.waitForTimeout(1000);
        await v2Page.waitForTimeout(1000);

        const v1ScreenshotPath = path.join(baseDir, 'v1', matchId.toString(), `${tab.name}-${timestamp}.png`);
        const v2ScreenshotPath = path.join(baseDir, 'v2', matchId.toString(), `${tab.name}-${timestamp}.png`);
        const diffScreenshotPath = path.join(baseDir, 'diff', matchId.toString(), `${tab.name}-${timestamp}.png`);

        await v1Page.screenshot({ path: v1ScreenshotPath, fullPage: true });
        await v2Page.screenshot({ path: v2ScreenshotPath, fullPage: true });

        const { match, diffPixels } = await VisualComparator.compareScreenshots(
          v1ScreenshotPath,
          v2ScreenshotPath,
          diffScreenshotPath
        );

        expect(match, `Visual mismatch detected on ${tab.name} for match ${matchId}: ${diffPixels} pixels differ`).toBe(true);
      }

      // API Comparison happens once per match
      const v1Logs = v1Interceptor.getLogs();
      const v2Logs = v2Interceptor.getLogs();
      const apiMismatches = ApiInterceptor.compareLogs(v1Logs, v2Logs);

      const apiLogsDir = path.resolve(__dirname, '../../logs/api', matchId.toString(), timestamp);
      await v1Interceptor.saveLogs(path.join(apiLogsDir, 'v1.json'));
      await v2Interceptor.saveLogs(path.join(apiLogsDir, 'v2.json'));
      await fs.writeJSON(path.join(apiLogsDir, 'mismatches.json'), apiMismatches, { spaces: 2 });

      expect(apiMismatches.length, `API mismatches detected for match ${matchId}: ${JSON.stringify(apiMismatches)}`).toBe(0);
    }
  });
});
