import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByPlaceholder('Masukkan username')).toBeVisible();
    await expect(page.getByPlaceholder('Masukkan password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    // Note: May trigger rate limiting if run frequently
    await page.goto('/login');

    await page.getByPlaceholder('Masukkan username').fill('invalid');
    await page.getByPlaceholder('Masukkan password').fill('wrong');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page.getByText(/invalid|credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('logout redirects to login', async ({ page }) => {
    // First login with valid credentials
    await page.goto('/login');

    await page.getByPlaceholder('Masukkan username').fill('admin');
    await page.getByPlaceholder('Masukkan password').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 5000 });

    // Click logout
    await page.getByRole('button', { name: /keluar/i }).first().click();

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});

test.describe('Citizen Verification', () => {
  test('verification page loads correctly', async ({ page }) => {
    await page.goto('/verifikasi');

    await expect(page.getByRole('heading', { name: 'Verifikasi Warga' })).toBeVisible();
    await expect(page.getByText('Masukkan NIK Anda untuk verifikasi')).toBeVisible();
  });

  test('shows error for invalid NIK format', async ({ page }) => {
    await page.goto('/verifikasi');

    await page.getByPlaceholder('Masukkan 16 digit NIK').fill('123');
    await page.getByRole('button', { name: 'Kirim OTP' }).click();

    await expect(page.getByText(/16 digit/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Protected Routes', () => {
  test('redirects to login when accessing protected route', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('No Fatal Console Errors', () => {
  test('login page has no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Filter non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('Failed to fetch') &&
        !e.includes('api/auth') &&
        !e.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
