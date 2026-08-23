import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe.serial('E2E Full Workflow: Citizen to Admin Document Generation', () => {
  let templateVersionId: string = '';
  let requestNumber: string = '';

  test('Admin creates and publishes a template for Surat Keterangan Usaha', async ({ page }) => {
    // 1. Admin Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('Masukkan username').fill('admin');
    await page.getByPlaceholder('Masukkan password').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });

    // 2. Go to Template Surat
    const toggleBtn = page.getByRole('button', { name: /toggle menu/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }
    const menuBtn = page.getByRole('button', { name: /surat menyurat/i });
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }
    await page.getByRole('link', { name: /template surat/i }).click();
    await expect(page.locator('h1').filter({ hasText: 'Template Surat' })).toBeVisible();

    // 3. Create a Template
    await page.getByRole('button', { name: /buat template/i }).first().click();
    const uniqueSuffix = Date.now();
    await page.fill('input[name="nama"]', `Template SKU ${uniqueSuffix}`);
    await page.fill('input[name="slug"]', `template-sku-${uniqueSuffix}`);
    
    // Select Surat Keterangan Usaha if it exists, otherwise select the first option
    const documentSelect = page.locator('select[name="dokumenId"]');
    await documentSelect.waitFor({ state: 'visible' });
    
    // We will just pick the option that contains 'Usaha', or fallback to index 1
    const options = await documentSelect.locator('option').allTextContents();
    const skuIndex = options.findIndex(opt => opt.toLowerCase().includes('usaha'));
    if (skuIndex > 0) {
        await documentSelect.selectOption({ index: skuIndex });
    } else {
        await documentSelect.selectOption({ index: 1 }); // Fallback
    }

    // Submit Creation
    await page.getByRole('button', { name: /buat template/i }).nth(1).click();

    // 4. In Designer, Publish Template
    await expect(page).toHaveURL(/\/admin\/surat\/designer\/\d+/);
    
    // Add a text element just to make sure it's valid
    await page.click('button:has-text("Teks")');
    await expect(page.getByText('Teks baru').first()).toBeVisible();
    
    // Click Publish
    await page.click('button:has-text("Publikasi")');
    await expect(page.locator('text=berhasil dipublikasikan')).toBeVisible({ timeout: 5000 });
  });

  test('Citizen submits a request for Surat Keterangan Usaha', async ({ page }) => {
    // 1. Citizen goes to public Layanan page
    await page.goto(`${BASE_URL}/layanan`);
    
    // Wait for services to load, click on "Surat Keterangan Usaha" (or fallback to the first one)
    const serviceCard = page.locator('text=Surat Keterangan Usaha');
    if (await serviceCard.count() > 0) {
        await serviceCard.first().click();
    } else {
        await page.locator('.service-card, button:has-text("Ajukan")').first().click();
    }

    // Verify NIK Step
    await expect(page.getByRole('heading', { name: 'Verifikasi Identitas' })).toBeVisible();
    await page.getByLabel(/Nomor Induk Kependudukan/i).fill('1234567890123456');
    
    // Mock NIK validation
    await page.route('**/api/citizen/validate-nik', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { valid: true, nama: 'Budi Santoso E2E' } })
      });
    });

    await page.getByRole('button', { name: /Verifikasi NIK/i }).click();
    await expect(page.getByText('Identitas Terverifikasi')).toBeVisible();

    // Fill Dynamic Fields
    const inputs = page.locator('input[type="text"]:not([readonly])');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
        await inputs.nth(i).fill('Data Usaha E2E');
    }

    const textareas = page.locator('textarea:not([readonly])');
    const taCount = await textareas.count();
    for (let i = 0; i < taCount; i++) {
        await textareas.nth(i).fill('Keterangan Usaha E2E');
    }

    // Proceed & Submit
    const proceedReviewBtn = page.getByRole('button', { name: /Lanjut ke Review/i });
    if (await proceedReviewBtn.isVisible()) {
        await proceedReviewBtn.click();
    }

    const submitBtn = page.getByRole('button', { name: /Kirim Permintaan/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify Success
    await expect(page.getByText('Permintaan Berhasil Dikirim')).toBeVisible();
  });

  test('Admin verifies, approves, and generates document', async ({ page }) => {
    // 1. Admin Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('Masukkan username').fill('admin');
    await page.getByPlaceholder('Masukkan password').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });

    // 2. Go to Permintaan
    await page.goto(`${BASE_URL}/admin/permintaan`);
    await expect(page.getByRole('heading', { name: 'Permintaan Layanan' })).toBeVisible();

    // 3. Find the request and click Detail
    // We look for 'Budi Santoso E2E'
    const tableRow = page.locator('tr', { hasText: 'Budi Santoso E2E' }).first();
    await expect(tableRow).toBeVisible();
    await tableRow.getByRole('link', { name: 'Detail' }).click();

    // 4. Workflow: VERIFY -> PROCESS -> APPROVE
    // Current status is SUBMITTED, allowed action: Verify
    const verifyBtn = page.getByRole('button', { name: 'Verifikasi' });
    if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
        await expect(verifyBtn).not.toBeVisible();
    }
    
    // Status is VERIFICATION, allowed action: Process
    const processBtn = page.getByRole('button', { name: 'Proses' });
    if (await processBtn.isVisible()) {
        await processBtn.click();
        await expect(processBtn).not.toBeVisible();
    }

    // Status is PROCESSING, allowed action: Setujui (which makes it APPROVED)
    const setujuiBtn = page.getByRole('button', { name: 'Setujui' });
    if (await setujuiBtn.isVisible()) {
        await setujuiBtn.click();
        await expect(page.getByText('berhasil disetujui')).toBeVisible({ timeout: 5000 });
    }

    // Now, let's say the status is APPROVED, we should be able to Generate Dokumen
    // Wait for the button
    const generateBtn = page.getByRole('button', { name: 'Generate Dokumen' });
    
    // Check if the Generate btn is there
    if (await generateBtn.isVisible()) {
        await generateBtn.click();
        // A modal opens
        await expect(page.getByText('Pilih Template')).toBeVisible();

        // Select the template we just created
        const templateSelect = page.locator('select');
        await templateSelect.selectOption({ index: 1 }); // select first valid template

        await page.getByRole('button', { name: 'Generate', exact: true }).click();
        await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 10000 });
    }

    // Verify the document section appears
    await expect(page.getByText('Dokumen yang Dibuat')).toBeVisible();
    
    // Check that we have a document link (Download / Copy Link)
    await expect(page.getByRole('link', { name: 'Download' }).first()).toBeVisible();
  });
});
