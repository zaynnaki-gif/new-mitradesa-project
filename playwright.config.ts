import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.WEB_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:api',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres.psxppjmldyhwrqqyqegg:Serunimumbul-88@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
        TEST_DATABASE_URL: 'postgresql://postgres.psxppjmldyhwrqqyqegg:Serunimumbul-88@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
        JWT_SECRET: 'test-secret-key-must-be-at-least-64-characters-long-for-testing-purposes'
      }
    },
    {
      command: 'npm run dev:web',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test'
      }
    }
  ],
});
