import { Page } from '@playwright/test';
import { AppPage } from '../pages/app.page';

export class AppFlow {
  private appPage: AppPage;

  constructor(public readonly page: Page) {
    this.appPage = new AppPage(page);
  }

  async executeLoginFlow(username: string, pass: string) {
    await this.appPage.navigate('/');
    await this.appPage.login(username, pass);
  }

  async executeSettingsFlow() {
    await this.appPage.openSettings();
  }
}
