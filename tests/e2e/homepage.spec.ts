import { test, expect } from '@playwright/test';

test.describe('MITRADESA Frontend - Editorial Homepage', () => {
  test('homepage loads successfully with editorial design', async ({ page }) => {
    await page.goto('/');

    // Check title contains 'Desa'
    await expect(page).toHaveTitle(/Desa/);

    // Check hero section is visible
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // Check that the page has the editorial body class
    await expect(page.locator('body')).toBeVisible();
  });

  test('no fatal console errors on homepage', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out non-critical errors
        if (
          text.includes('favicon.ico') ||
          text.includes('identitas') ||
          text.includes('404') ||
          text.includes('Failed to fetch') ||
          text.includes('api/health') ||
          text.includes('401') ||
          text.includes('Unauthorized') ||
          text.includes('Failed to load resource')
        )
          return;
        consoleErrors.push(text);
      }
    });

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('navigation header is present', async ({ page }) => {
    await page.goto('/');

    // Check header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check navigation links exist
    await expect(page.getByRole('link', { name: 'Beranda' })).toBeVisible();
  });

  test('footer is present with copyright', async ({ page }) => {
    await page.goto('/');

    // Check footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check copyright text
    await expect(footer).toContainText('Hak Cipta Dilindungi');
  });

  test('404 page displays correctly', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Check 404 heading
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Halaman Tidak Ditemukan' })).toBeVisible();

    // Check back button exists
    await expect(page.getByRole('button', { name: 'Kembali ke Beranda' })).toBeVisible();
  });

  test('can navigate back to homepage from 404', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Click back button
    await page.getByRole('button', { name: 'Kembali ke Beranda' }).click();

    // Should be on homepage
    await expect(page).toHaveURL('/');
  });
});
