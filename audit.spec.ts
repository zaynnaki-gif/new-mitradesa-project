import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/ASUS/.gemini/antigravity-ide/brain/7abec0d0-38e2-4bad-92ac-f01afadc1e59/scratch/screenshots';
const BASE_URL = 'http://localhost:3000';

const routes = [
  '/',
  '/profil',
  '/pemerintahan',
  '/kependudukan',
  '/kontak',
  '/galeri',
  '/layanan',
  '/berita',
  '/umkm',
  '/potensi',
  '/transparansi',
  '/agenda',
  '/login'
];

test.describe('Visual Audit', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(ARTIFACT_DIR)) {
      fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    }
  });

  test('Capture Desktop', async ({ browser }) => {
    test.setTimeout(120000);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const fileName = route === '/' ? 'home' : route.substring(1).replace(/\//g, '_');
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, `${fileName}_desktop.png`),
        fullPage: true 
      });
    }
    await context.close();
  });

  test('Capture Mobile', async ({ browser }) => {
    test.setTimeout(120000);
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    
    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const fileName = route === '/' ? 'home' : route.substring(1).replace(/\//g, '_');
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, `${fileName}_mobile.png`),
        fullPage: true 
      });
    }
    await context.close();
  });
});
