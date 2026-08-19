import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests', () => {
  test('Frontend should load successfully', async ({ page }) => {
    // Navigate to frontend URL using Playwright baseURL
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();

    // The page title should contain MITRADESA (or wait for the app to render)
    await expect(page).toHaveTitle(/MITRADESA|Desa/i);
    
    // Check if the page has essential elements
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('Backend API should return healthy status', async ({ request }) => {
    // Navigate to API health endpoint
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    
    const response = await request.get(`${apiUrl}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(['ok', 'healthy']).toContain(json.data.status);
  });

  test('Citizen Service Request endpoint should rate limit or validate properly', async ({ request }) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    
    // Send invalid NIK to trigger validation failure
    const response = await request.post(`${apiUrl}/api/citizen/validate-nik`, {
      data: { nik: '123' } // Invalid 3 digits
    });
    
    // Should be a Bad Request (400) because of validation, or 429 if rate limited
    expect([400, 429]).toContain(response.status());
    if (response.status() === 400) {
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(['VALIDATION_ERROR', 'BAD_REQUEST']).toContain(json.error.code);
    }
  });
});
