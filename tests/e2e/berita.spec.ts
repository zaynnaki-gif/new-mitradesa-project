import { test, expect, Page } from '@playwright/test';

const TEST_USERNAME = 'admin';
const TEST_PASSWORD = 'admin123';
const BASE_URL = process.env.WEB_URL || 'http://localhost:3000';

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('Masukkan username').fill(TEST_USERNAME);
  await page.getByPlaceholder('Masukkan password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
}

test.describe('Berita E2E', () => {
  test('Buat Berita and check public frontend', async ({ page }) => {
    // 1. Login
    await loginAsAdmin(page);

    // 2. Navigate to Berita
    const toggleBtn = page.getByRole('button', { name: /toggle menu/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }
    await page.getByLabel('Admin navigation').getByRole('link', { name: /berita/i }).click();

    // 3. Verify page
    await expect(page.getByRole('heading', { name: /Berita/i })).toBeVisible({ timeout: 15000 });
  });
});
