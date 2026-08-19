import { test, expect } from '@playwright/test';

test.describe('Public Workflow', () => {
  test('Layanan Catalog Page loads successfully', async ({ page }) => {
    await page.goto('/layanan');
    await expect(page).toHaveTitle(/Layanan/);
    await expect(page.getByRole('heading', { name: 'Layanan Desa' })).toBeVisible();
    await expect(page.getByText(/Informasi layanan administrasi/)).toBeVisible();
  });

  test('Berita List Page loads successfully', async ({ page }) => {
    await page.goto('/berita');
    await expect(page).toHaveTitle(/Berita/);
    await expect(page.getByRole('heading', { name: 'Berita & Informasi' })).toBeVisible();
  });

  test('UMKM Page loads and allows filtering', async ({ page }) => {
    await page.goto('/umkm');
    await expect(page).toHaveTitle(/Potensi UMKM/);
    await expect(page.getByRole('heading', { name: 'Potensi UMKM Desa' })).toBeVisible();
    
    // Check categories exist
    await expect(page.getByRole('button', { name: 'Semua' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MAKANAN' })).toBeVisible();
    
    // Search input should exist
    const searchInput = page.getByPlaceholder('Cari nama usaha, pemilik, atau produk...');
    await expect(searchInput).toBeVisible();
    
    // Try to type in search
    await searchInput.fill('Keripik');
    await expect(searchInput).toHaveValue('Keripik');
  });

  test('Transparansi Page loads successfully', async ({ page }) => {
    await page.goto('/transparansi');
    await expect(page).toHaveTitle(/Transparansi/);
    await expect(page.getByRole('heading', { name: 'Transparansi APBDes' })).toBeVisible();
  });

  test('Profil Desa Page loads successfully', async ({ page }) => {
    await page.goto('/profil');
    await expect(page).toHaveTitle(/Profil/);
    await expect(page.getByRole('heading', { name: 'Profil Desa' })).toBeVisible();
  });
});
