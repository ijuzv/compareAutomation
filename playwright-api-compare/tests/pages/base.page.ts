import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(public readonly page: Page) {}

  async navigate(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  protected getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async click(locator: Locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async fill(locator: Locator, text: string) {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(text);
  }

  async getText(locator: Locator): Promise<string | null> {
    await locator.waitFor({ state: 'visible' });
    return locator.textContent();
  }
}
