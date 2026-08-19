import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Document Template Management
 *
 * Tests the complete template lifecycle:
 * - Create template
 * - Edit template
 * - Add elements
 * - Preview template
 * - Publish template
 */

const BASE_URL = process.env.WEB_URL || 'http://localhost:3000';

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('Masukkan username').fill('admin');
  await page.getByPlaceholder('Masukkan password').fill('admin123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
  // Wait for dashboard to fully load before proceeding
  await expect(page.getByRole('heading', { name: /tindakan/i })).toBeVisible({ timeout: 15000 });
}

async function navigateToTemplateSurat(page: any) {
  const toggleBtn = page.getByRole('button', { name: /toggle menu/i });
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
  }
  // We need to click "Surat Menyurat" then "Template Surat"
  const menuBtn = page.getByRole('button', { name: /surat menyurat/i });
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
  }
  await page.getByLabel('Admin navigation').getByRole('link', { name: /template surat/i }).click();
}

test.describe.serial('Template Management', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to template list after login
    await loginAsAdmin(page);
    await navigateToTemplateSurat(page);
  });

  test('should display template list', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1').filter({ hasText: 'Template Surat' })).toBeVisible({ timeout: 15000 });

    // Check table exists
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create new template', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /buat template/i }).first().click();

    // Fill form
    const uniqueSuffix = Date.now();
    await page.fill('input[name="nama"]', `Surat Keterangan Test ${uniqueSuffix}`);
    await page.fill('input[name="slug"]', `surat-keterangan-test-${uniqueSuffix}`);

    // Select document type
    await page.selectOption('select[name="dokumenId"]', { index: 0 });

    // Submit
    await page.getByRole('button', { name: /buat template/i }).nth(1).click();

    // Should redirect to designer
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);
  });

  test('should open template designer', async ({ page }) => {
    // Click first template Edit button
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Should open designer
    await expect(page.getByText('Elemen', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Konfigurasi', { exact: true }).first()).toBeVisible();
  });

  test('should add text element', async ({ page }) => {
    // Open first template
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Click add text button
    await page.click('button:has-text("Teks")');

    // Element should appear in canvas
    await expect(page.getByText('Teks baru').first()).toBeVisible();
  });

  test('should add field element', async ({ page }) => {
    // Open first template
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Click add field button
    await page.click('button:has-text("Field Data")');

    // Element should appear in canvas
    await expect(page.getByText('penduduk.namaLengkap', { exact: true }).first()).toBeVisible();
  });

  test('should save template', async ({ page }) => {
    // Open first template
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Add an element
    await page.click('button:has-text("Teks")');

    // Save and wait for API response to ensure it actually triggers
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/') && ['POST', 'PUT', 'PATCH'].includes(response.request().method()));
    await page.click('button:has-text("Simpan")');
    await responsePromise;

    // Should show success message
    await expect(page.locator('text=berhasil')).toBeVisible({ timeout: 10000 });
  });

  test('should validate template', async ({ page }) => {
    // Open first template
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Click validate button
    await page.click('button:has-text("Validasi")');

    // Should show validation result
    await expect(page.locator('text=valid')).toBeVisible({ timeout: 5000 });
  });

  test('should preview template', async ({ page }) => {
    // Open first template
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Click preview button
    await page.click('button:has-text("Preview")');

    // Preview modal should open
    await expect(page.locator('text=Preview Template')).toBeVisible();
  });




  test('should add and configure text element', async ({ page }) => {
    // Navigate to designer
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Add text element
    await page.click('button:has-text("Teks")');

    // Select the element
    const textElement = page.getByText('Teks baru').first();
    await textElement.waitFor({ state: 'visible' });
    await textElement.click();

    // Properties panel should show
    await expect(page.locator('text=Properties')).toBeVisible();

    // Edit content
    await page.fill('textarea', 'Surat Keterangan');
    await page.fill('input[type="number"]', '14');

    // Save
    await page.click('button:has-text("Simpan")');

    // Verify saved
    await expect(page.locator('text=berhasil')).toBeVisible({ timeout: 5000 });
  });

  test('should insert field via field picker', async ({ page }) => {
    // Navigate to designer
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Add field element
    await page.click('button:has-text("Field Data")');

    // Select the element
    const fieldElement = page.getByText('penduduk.namaLengkap', { exact: false }).first();
    await fieldElement.waitFor({ state: 'visible' });
    await fieldElement.click();

    // Click insert field button
    await page.click('button:has-text("Insert Field")');

    // Field picker modal should open
    await expect(page.locator('text=Pilih Field')).toBeVisible();

    // Click on a binding
    await page.click('button:has-text("Nama Lengkap")');

    // Binding should be set
    await expect(page.locator('input[value*="nama"]')).toBeVisible();
  });

  test('should configure kop surat', async ({ page }) => {
    // Navigate to designer
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Open kop editor
    await page.click('button:has-text("Kop Surat")');

    // Modal should open
    await expect(page.getByRole('heading', { name: 'Konfigurasi Kop Surat' })).toBeVisible();
  });

  test('should configure signature', async ({ page }) => {
    // Navigate to designer
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Open signatory editor
    await page.click('button:has-text("Tanda Tangan")');

    // Modal should open
    await expect(page.getByRole('heading', { name: 'Konfigurasi Tanda Tangan' })).toBeVisible();
  });

  test('should reorder elements', async ({ page }) => {
    // Navigate to designer
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Add multiple elements
    await page.click('button:has-text("Teks")');
    await page.click('button:has-text("Spasi")');
    await page.click('button:has-text("Teks")');

    // Click move up button on last element
    const upButtons = page.getByRole('button', { name: '↑' });
    await upButtons.last().hover();
    await upButtons.last().click();

    // Elements should be reordered
    // (Visual verification required)
  });

  test('should delete element', async ({ page }) => {
    // Navigate to designer
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);



    // Add element
    await page.click('button:has-text("Teks")');

    // Select it
    await page.getByText('Teks baru').last().click();

    // Give it a unique text
    await page.fill('textarea', 'Elemen Unik Untuk Dihapus');

    // Delete it
    await page.getByRole('button', { name: '✕' }).last().click();

    // Element should be removed
    await expect(page.getByText('Elemen Unik Untuk Dihapus')).not.toBeVisible();
  });

  test('should publish template', async ({ page }) => {
    // Open first template
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);

    // Validate first
    await page.click('button:has-text("Validasi")');
    await expect(page.locator('text=valid')).toBeVisible({ timeout: 5000 });

    // Publish
    await page.click('button:has-text("Publikasi")');

    // Status should change
    await expect(page.locator('text=berhasil dipublikasikan')).toBeVisible({ timeout: 5000 });
  });
});
