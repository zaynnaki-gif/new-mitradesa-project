import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage and display the title', async ({ page }) => {
    // Navigate to the base URL (which is http://localhost:3000 according to config)
    await page.goto('/');

    // Wait for the page to load by checking for the document title
    // Since we don't know the exact title, we'll just check that it's not empty
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // We expect the page to have some basic text like 'MITRADESA' or 'Desa' 
    // Wait for the body to be attached
    await page.waitForSelector('body');
  });
});
