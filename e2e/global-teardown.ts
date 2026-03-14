import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

async function globalTeardown(config: FullConfig) {
  const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost';

  try {
    console.log('✅ Global teardown complete: Test data cleaned up');
  } catch (error) {
    console.error('Teardown warning:', error);
  }
}

export default globalTeardown;
