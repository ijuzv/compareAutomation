import { test as base, Browser, Page } from '@playwright/test';
import { ApiInterceptor } from '~common-utils/apiInterceptor';
import { ENV } from '../../configs/env';
import { AppFlow } from '../flows/app.flow';

type CompareFixtures = {
  v1Page: any;
  v2Page: any;
  v1Flow: AppFlow;
  v2Flow: AppFlow;
  v1Interceptor: ApiInterceptor;
  v2Interceptor: ApiInterceptor;
};

export const test = base.extend<CompareFixtures>({
  v1Page: async ({ browser }: { browser: Browser }, use: (r: Page) => Promise<void>) => {
    const context = await browser.newContext({ baseURL: ENV.V1.BASE_URL });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  v2Page: async ({ browser }: { browser: Browser }, use: (r: Page) => Promise<void>) => {
    const context = await browser.newContext({ baseURL: ENV.V2.BASE_URL });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  v1Flow: async ({ v1Page }: { v1Page: Page }, use: (r: AppFlow) => Promise<void>) => {
    await use(new AppFlow(v1Page));
  },
  v2Flow: async ({ v2Page }: { v2Page: Page }, use: (r: AppFlow) => Promise<void>) => {
    await use(new AppFlow(v2Page));
  },
  v1Interceptor: async ({ v1Page }: { v1Page: Page }, use: (r: ApiInterceptor) => Promise<void>) => {
    const interceptor = new ApiInterceptor(v1Page, ENV.V1.API_URL);
    await interceptor.startIntercepting();
    await use(interceptor);
  },
  v2Interceptor: async ({ v2Page }: { v2Page: Page }, use: (r: ApiInterceptor) => Promise<void>) => {
    const interceptor = new ApiInterceptor(v2Page, ENV.V2.API_URL);
    await interceptor.startIntercepting();
    await use(interceptor);
  }
});

export { expect } from '@playwright/test';
