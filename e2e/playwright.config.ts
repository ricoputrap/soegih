import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: '.auth/user.json',
  },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /\/(auth|wallets)\.spec\.ts/,
    },
  ],
});
