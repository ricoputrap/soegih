import { APIRequestContext, request } from '@playwright/test';

export class ApiHelper {
  private requestContext: APIRequestContext | null = null;

  constructor(private token: string) {}

  private async getContext(): Promise<APIRequestContext> {
    if (!this.requestContext) {
      this.requestContext = await request.newContext({
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
        extraHTTPHeaders: {
          Authorization: `Bearer ${this.token}`,
        },
      });
    }
    return this.requestContext;
  }

  async createWallet(name: string, type: string = 'bank') {
    const context = await this.getContext();
    return context.post('/api/v1/wallets', {
      data: { name: `[E2E] ${name}`, type },
    });
  }

  async createCategory(name: string, type: string) {
    const context = await this.getContext();
    return context.post('/api/v1/categories', {
      data: { name: `[E2E] ${name}`, type },
    });
  }

  async deleteAllTestData() {
    const context = await this.getContext();
    // Implementation: fetch and delete all [E2E]-prefixed wallets/categories/transactions
  }

  async cleanup() {
    if (this.requestContext) {
      await this.requestContext.dispose();
    }
  }
}
