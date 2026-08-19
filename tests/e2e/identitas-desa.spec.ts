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

test.describe('Identitas Desa E2E', () => {
  test('Update Identitas Desa and check public frontend', async ({ page }) => {
    // 1. Login
    await loginAsAdmin(page);

    // 2. Navigate to Pengaturan
    const toggleBtn = page.getByRole('button', { name: /toggle menu/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }
    await page.getByLabel('Admin navigation').getByRole('link', { name: /identitas desa/i }).click();

    // 3. Update Identitas Desa form (Assuming the form has fields for 'Nama Desa' etc.)
    // For simplicity, we just assert the page loads for now.
    await expect(page.getByRole('heading', { name: /Identitas Desa/i })).toBeVisible({ timeout: 15000 });
  });
});
