import { chromium, devices } from 'playwright';
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

async function captureScreenshots() {
  // Ensure dir exists
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  // Desktop
  console.log('Capturing Desktop screenshots...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const desktopPage = await desktopContext.newPage();
  
  for (const route of routes) {
    const url = `${BASE_URL}${route}`;
    console.log(`Navigating to ${url} (Desktop)`);
    await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.error(`Error on ${route}:`, e));
    // Small delay for animations
    await desktopPage.waitForTimeout(1000);
    const fileName = route === '/' ? 'home' : route.substring(1).replace(/\//g, '_');
    await desktopPage.screenshot({ 
      path: path.join(ARTIFACT_DIR, `${fileName}_desktop.png`),
      fullPage: true 
    });
    console.log(`Captured ${fileName}_desktop.png`);
  }
  await desktopContext.close();

  // Mobile
  console.log('Capturing Mobile screenshots...');
  const mobileDevice = devices['iPhone 13 mini']; // 375x812
  const mobileContext = await browser.newContext({
    ...mobileDevice
  });
  const mobilePage = await mobileContext.newPage();
  
  for (const route of routes) {
    const url = `${BASE_URL}${route}`;
    console.log(`Navigating to ${url} (Mobile)`);
    await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.error(`Error on ${route}:`, e));
    await mobilePage.waitForTimeout(1000);
    const fileName = route === '/' ? 'home' : route.substring(1).replace(/\//g, '_');
    await mobilePage.screenshot({ 
      path: path.join(ARTIFACT_DIR, `${fileName}_mobile.png`),
      fullPage: true 
    });
    console.log(`Captured ${fileName}_mobile.png`);
  }
  await mobileContext.close();

  await browser.close();
  console.log('Screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
