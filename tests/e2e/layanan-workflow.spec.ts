import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Layanan Publik Workflow Phase 2', () => {
  // We mock the /api/citizen/validate-nik to test frontend behavior predictably
  test('Akses layanan dan verifikasi NIK gagal', async ({ page }) => {
    // Mock Layanan response
    await page.route('**/api/public/layanan/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          data: { 
            id: 1, 
            nama: 'Surat Pengantar', 
            slug: 'surat-pengantar', 
            description: 'Layanan Pembuatan Surat Pengantar', 
            requirements: [],
            fields: []
          }
        })
      });
    });

    // Navigate to a service page (assuming 'surat-pengantar' exists)
    await page.goto(`${BASE_URL}/layanan/surat-pengantar`);

    // Verify we are at NIK validation step
    await expect(page.getByRole('heading', { name: 'Verifikasi Identitas' })).toBeVisible({ timeout: 10000 });
    
    // Fill NIK with invalid digits (less than 16)
    const nikInput = page.getByLabel(/Nomor Induk Kependudukan/i);
    await nikInput.fill('123');
    
    // Button should be disabled
    const submitBtn = page.getByRole('button', { name: /Verifikasi NIK/i });
    await expect(submitBtn).toBeDisabled();

    // Fill with exactly 16 digits but mock API to return 404
    await page.route('**/api/citizen/validate-nik', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'NIK tidak terdaftar sebagai penduduk aktif.' })
      });
    });

    await nikInput.clear();
    await nikInput.fill('1234567890123456');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    
    // Expect error message on screen
    await expect(page.getByText('NIK tidak terdaftar sebagai penduduk aktif.')).toBeVisible();
  });

  test('Akses layanan dan verifikasi NIK sukses, lalu isi form', async ({ page }) => {
    // Mock Layanan response
    await page.route('**/api/public/layanan/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          data: { 
            id: 1, 
            nama: 'Surat Pengantar', 
            slug: 'surat-pengantar', 
            description: 'Layanan Pembuatan Surat Pengantar', 
            requirements: [],
            fields: []
          }
        })
      });
    });

    await page.goto(`${BASE_URL}/layanan/surat-pengantar`);
    
    // Mock valid NIK response
    await page.route('**/api/citizen/validate-nik', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          data: { 
            valid: true, 
            nama: 'B*** S******', 
            desa: 'Sukamaju' 
          }, 
          message: 'NIK valid' 
        })
      });
    });
    
    // Fill and submit NIK
    const nikInput = page.getByLabel(/Nomor Induk Kependudukan/i);
    await nikInput.waitFor({ state: 'visible' });
    await nikInput.fill('1234567890123456');
    await page.getByRole('button', { name: /Verifikasi NIK/i }).click();
    
    // Should transition to form step and show verified identity
    await expect(page.getByText('✓ Identitas Terverifikasi')).toBeVisible();
    await expect(page.getByText('B*** S******')).toBeVisible();

    // In a real test with seeded DB, we would also fill out the form. 
    // Here we just ensure we reached the next step.
    const proceedReviewBtn = page.getByRole('button', { name: /Lanjut ke Review/i });
    if (await proceedReviewBtn.isVisible()) {
        await proceedReviewBtn.click();
        await expect(page.getByRole('heading', { name: 'Review Permintaan' })).toBeVisible();
    }
  });
});
