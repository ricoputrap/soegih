import { test as base, Page } from '@playwright/test';
import { ApiHelper } from '../helpers/api-helper';
import { SupabaseHelper } from '../helpers/supabase-helper';

export const test = base.extend<{
  apiHelper: ApiHelper;
  supabaseHelper: SupabaseHelper;
  page: Page;
}>({
  apiHelper: async ({ page }, use) => {
    const supabaseHelper = new SupabaseHelper(page);
    const token = await supabaseHelper.getAuthToken();
    const apiHelper = new ApiHelper(token);
    await use(apiHelper);
  },
  supabaseHelper: async ({ page }, use) => {
    const supabaseHelper = new SupabaseHelper(page);
    await use(supabaseHelper);
  },
});

export { expect } from '@playwright/test';
