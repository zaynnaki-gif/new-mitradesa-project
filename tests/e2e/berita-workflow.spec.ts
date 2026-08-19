import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Berita Workflow Phase 2', () => {
  test('Akses detail berita dengan 404', async ({ page }) => {
    // 1. Visit an invalid slug
    await page.goto(`${BASE_URL}/berita/invalid-berita-12345`);

    // 2. Should see 404 UI
    await expect(page.getByRole('heading', { name: 'Berita Tidak Ditemukan' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Maaf, berita yang Anda cari tidak tersedia atau mungkin sudah dihapus.')).toBeVisible();
    
    // 3. Should have back to list CTA
    const backBtn = page.getByRole('link', { name: 'Kembali ke Daftar Berita' });
    await expect(backBtn).toBeVisible();
    
    // 4. Click back to list
    await backBtn.click();
    await expect(page).toHaveURL(/\/berita$/);
  });
});
