import { test as base, Browser, Page } from '@playwright/test';
import { ENV } from '../../configs/env';

type WebCompareFixtures = {
  uatPage: Page;
  prodPage: Page;
};

export const test = base.extend<WebCompareFixtures>({
  uatPage: async ({ browser }: { browser: Browser }, use: (r: Page) => Promise<void>) => {
    const context = await browser.newContext({ baseURL: ENV.WEB.UAT_BASE_URL });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  prodPage: async ({ browser }: { browser: Browser }, use: (r: Page) => Promise<void>) => {
    const context = await browser.newContext({ baseURL: ENV.WEB.PROD_BASE_URL });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
