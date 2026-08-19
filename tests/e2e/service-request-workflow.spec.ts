import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('E2E Service Request Lifecycle & Tracking Phase 3', () => {

  test('Warga can search for their request and view tracking details', async ({ page }) => {
    // 1. Mock the tracking API endpoint
    await page.route('**/api/citizen/request/REQ-12345', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'req_1',
            nomorPermintaan: 'REQ-12345',
            status: 'PROCESSING',
            layanan: { nama: 'Surat Keterangan Usaha', kode: 'SKU' },
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            completedAt: null,
            catatan: null,
            dokumen: []
          }
        })
      });
    });

    // 2. Navigate to tracking page without ID
    await page.goto(`${BASE_URL}/layanan/tracking`);

    // Verify search input is present
    await expect(page.getByPlaceholder('Masukkan nomor permintaan...')).toBeVisible();

    // 3. Perform search
    await page.fill('input[name="nomor"]', 'REQ-12345');
    
    const responsePromise1 = page.waitForResponse('**/api/citizen/request/REQ-12345');
    await page.click('button[type="submit"]');
    await responsePromise1;

    // 4. Verify tracking details are displayed
    await expect(page.getByText('REQ-12345')).toBeVisible();
    await expect(page.getByText('Surat Keterangan Usaha')).toBeVisible();
    await expect(page.getByText('Diproses', { exact: true }).first()).toBeVisible();
  });

  test('Warga sees error when request is not found', async ({ page }) => {
    // Mock the tracking API endpoint for not found
    await page.route('**/api/citizen/request/REQ-UNKNOWN', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Permintaan tidak ditemukan'
        })
      });
    });

    // Navigate to tracking page with unknown ID
    const responsePromise2 = page.waitForResponse('**/api/citizen/request/REQ-UNKNOWN');
    await page.goto(`${BASE_URL}/layanan/tracking?nomor=REQ-UNKNOWN`);
    await responsePromise2;

    // Verify error message
    await expect(page.getByText('Permintaan tidak ditemukan')).toBeVisible();
  });

  test('Warga sees rejection reason when request is rejected', async ({ page }) => {
    // Mock the tracking API endpoint
    await page.route('**/api/citizen/request/REQ-REJECTED', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'req_2',
            nomorPermintaan: 'REQ-REJECTED',
            status: 'REJECTED',
            layanan: { nama: 'Surat Keterangan Usaha', kode: 'SKU' },
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
            processedAt: null,
            completedAt: null,
            updatedAt: new Date().toISOString(),
            catatan: 'Dokumen tidak lengkap, mohon lampirkan KTP',
            dokumen: []
          }
        })
      });
    });

    const responsePromise3 = page.waitForResponse('**/api/citizen/request/REQ-REJECTED');
    await page.goto(`${BASE_URL}/layanan/tracking?nomor=REQ-REJECTED`);
    await responsePromise3;

    await expect(page.getByText('REQ-REJECTED')).toBeVisible();
    await expect(page.getByText('Permintaan ditolak')).toBeVisible();
    await expect(page.getByText('Alasan: Dokumen tidak lengkap, mohon lampirkan KTP')).toBeVisible();
  });

  test('Security: Unauthorized admin action returns 401', async ({ request }) => {
    const API_URL = process.env.API_URL || 'http://localhost:3001';
    const res = await request.post(`${API_URL}/api/service-requests/999/verify`, {
      data: { status: 'VERIFICATION' }
    });
    
    expect(res.status()).toBe(401);
  });
});
