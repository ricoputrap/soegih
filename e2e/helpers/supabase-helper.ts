import { Page } from '@playwright/test';

export class SupabaseHelper {
  constructor(private page: Page) {}

  async getAuthToken(): Promise<string> {
    await this.page.goto('/');
    const storageState = await this.page.context().storageState();
    const localStorage = storageState.origins?.[0]?.localStorage ?? [];
    const tokenObj = localStorage.find((item) => item.name === 'sb-auth-token');
    if (!tokenObj) {
      throw new Error('No auth token found in storageState');
    }
    return tokenObj.value;
  }
}
