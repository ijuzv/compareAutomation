import { BasePage } from './base.page';
import { Locator, Page } from '@playwright/test';

export class AppPage extends BasePage {
  readonly loginButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly dashboardTitle: Locator;
  readonly settingsTab: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = this.getByTestId('login-btn');
    this.usernameInput = this.getByTestId('username-input');
    this.passwordInput = this.getByTestId('password-input');
    this.dashboardTitle = this.getByTestId('dashboard-title');
    this.settingsTab = this.getByTestId('settings-tab');
  }

  async login(user: string, pass: string) {
    await this.fill(this.usernameInput, user);
    await this.fill(this.passwordInput, pass);
    await this.click(this.loginButton);
    await this.waitForNetworkIdle();
  }

  async openSettings() {
    await this.click(this.settingsTab);
    await this.waitForNetworkIdle();
  }
}
