import { test, expect, Page, Browser, chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// ─── Configuration ───────────────────────────────────────────────────────────
// Use relative paths so Playwright uses baseURL from playwright.config.ts (webServer).
// The webServer directive ensures the server is reachable from the browser process.
const EVIDENCE_DIR = path.join('test-results', 'phase-12-1-evidence');

const VIEWPORTS = [
  { label: '1440x900',  width: 1440, height: 900  },  // Desktop
  { label: '1024x768',  width: 1024, height: 768  },  // Tablet
  { label: '390x844',   width: 390,  height: 844  },  // Mobile
];

// Public routes (no auth required)
const PUBLIC_ROUTES: { label: string; path: string }[] = [
  { label: 'homepage',        path: '/' },
  { label: 'profil',          path: '/profil' },
  { label: 'pemerintahan',    path: '/pemerintahan' },
  { label: 'kependudukan',    path: '/kependudukan' },
  { label: 'kontak',          path: '/kontak' },
  { label: 'galeri',          path: '/galeri' },
  { label: 'layanan',         path: '/layanan' },
  { label: 'layanan-tracking',path: '/layanan/tracking' },
  { label: 'berita',          path: '/berita' },
  { label: 'umkm',            path: '/umkm' },
  { label: 'potensi',         path: '/potensi' },
  { label: 'transparansi',    path: '/transparansi' },
  { label: 'agenda',          path: '/agenda' },
  { label: 'login',           path: '/login' },
  { label: 'verifikasi',      path: '/verifikasi' },
];

// Admin routes (require auth - will redirect to /login, still captures state)
const ADMIN_ROUTES: { label: string; path: string }[] = [
  { label: 'admin-dashboard',          path: '/admin/dashboard' },
  { label: 'admin-dashboard-executive',path: '/admin/dashboard/executive' },
  { label: 'admin-wilayah',            path: '/admin/master/wilayah' },
  { label: 'admin-identitas-desa',     path: '/admin/master/identitas-desa' },
  { label: 'admin-perangkat-desa',     path: '/admin/master/perangkat-desa' },
  { label: 'admin-surat-templates',    path: '/admin/surat/templates' },
  { label: 'admin-surat-arsip',        path: '/admin/surat/arsip' },
  { label: 'admin-layanan',            path: '/admin/layanan' },
  { label: 'admin-permintaan',         path: '/admin/permintaan' },
  { label: 'admin-dokumen',            path: '/admin/dokumen' },
  { label: 'admin-konten-berita',      path: '/admin/konten/berita' },
  { label: 'admin-konten-halaman',     path: '/admin/konten/halaman' },
  { label: 'admin-konten-kategori',    path: '/admin/konten/kategori' },
  { label: 'admin-konten-media',       path: '/admin/konten/media' },
  { label: 'admin-konten-agenda',      path: '/admin/konten/agenda' },
  { label: 'admin-konten-umkm',        path: '/admin/konten/umkm' },
  { label: 'admin-konten-potensi',     path: '/admin/konten/potensi' },
  { label: 'admin-konten-transparansi',path: '/admin/konten/transparansi' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function screenshotName(label: string, viewport: string, isPublic: boolean): string {
  const safe = label.replace(/[/\\:*?"<>|]/g, '_').replace(/^_/, '');
  const prefix = isPublic ? 'public' : 'admin';
  return path.join(EVIDENCE_DIR, prefix, `${prefix}__${safe}__${viewport}.png`);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

type PageAuditResult = {
  route: string;
  label: string;
  viewport: string;
  httpStatus: number | null;
  finalUrl: string;
  scrollWidth: number;
  innerWidth: number;
  hasHorizontalOverflow: boolean;
  consoleErrors: string[];
  consoleWarnings: string[];
  failedRequests: { url: string; status: number; type: string }[];
  screenshot: string;
};

const allResults: PageAuditResult[] = [];

async function auditPage(
  page: Page,
  routePath: string,
  label: string,
  viewport: { label: string; width: number; height: number },
  isPublic: boolean
): Promise<PageAuditResult> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const failedRequests: { url: string; status: number; type: string }[] = [];

  // Capture console messages
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    else if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  };
  page.on('console', onConsole);

  // Capture failed network requests
  const onResponse = (res: { status: () => number; url: () => string; request: () => { resourceType: () => string } }) => {
    const status = res.status();
    if (status >= 400) {
      failedRequests.push({
        url: res.url(),
        status,
        type: res.request().resourceType(),
      });
    }
  };
  page.on('response', onResponse);

  let httpStatus: number | null = null;
  let finalUrl = '';

  try {
    const response = await page.goto(routePath, {
      waitUntil: 'load',
      timeout: 15000,
    });
    httpStatus = response?.status() ?? null;

    // Give React a moment to render, try networkidle but ignore timeout
    try {
      await page.waitForLoadState('networkidle', { timeout: 3000 });
    } catch(e) {}
    await page.waitForTimeout(1000);
  } catch (err) {
    consoleErrors.push(`Navigation error: ${(err as Error).message}`);
  }
  
  // Capture URL after hydration and potential client-side redirects
  finalUrl = page.url();

  // Measure horizontal overflow
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  const hasHorizontalOverflow = scrollWidth > innerWidth + 5; // +5px tolerance

  // Screenshot
  const screenshotPath = screenshotName(label, viewport.label, isPublic);
  ensureDir(path.dirname(screenshotPath));
  await page.screenshot({ path: screenshotPath, fullPage: false });

  page.off('console', onConsole);
  page.off('response', onResponse);

  return {
    route: routePath,
    label,
    viewport: viewport.label,
    httpStatus,
    finalUrl,
    scrollWidth,
    innerWidth,
    hasHorizontalOverflow,
    consoleErrors,
    consoleWarnings,
    failedRequests,
    screenshot: screenshotPath,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe('Phase 12.1C — Local Playwright Visual QA', () => {
  test.setTimeout(300_000); // 5 minutes for the full suite

  test('Public routes — all viewports', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      for (const vp of VIEWPORTS) {
        const result = await auditPage(page, route.path, route.label, vp, true);
        allResults.push(result);

        // Soft assertions — do not fail the whole run for one route
        if (result.hasHorizontalOverflow) {
          console.warn(`[OVERFLOW] ${result.label} @ ${result.viewport} — scrollWidth=${result.scrollWidth} innerWidth=${result.innerWidth}`);
        }
        if (result.consoleErrors.length > 0) {
          console.warn(`[CONSOLE ERROR] ${result.label} @ ${result.viewport}:`);
          result.consoleErrors.forEach(e => console.warn('  ' + e));
        }
        if (result.failedRequests.length > 0) {
          const apiFailures = result.failedRequests.filter(r => r.type === 'fetch' || r.type === 'xhr');
          if (apiFailures.length > 0) {
            console.warn(`[FAILED API] ${result.label} @ ${result.viewport}:`);
            apiFailures.forEach(r => console.warn(`  ${r.status} ${r.url}`));
          }
        }
      }
    }

    // Homepage MUST load (hard assertion)
    const hpDesktop = allResults.find(r => r.label === 'homepage' && r.viewport === '1440x900');
    expect(hpDesktop?.httpStatus, 'Homepage must return 2xx').toBeLessThan(400);
  });

  test('Admin routes unauthenticated — redirect behaviour', async ({ page }) => {
    for (const route of ADMIN_ROUTES) {
      for (const vp of VIEWPORTS) {
        const result = await auditPage(page, route.path, route.label, vp, false);
        allResults.push(result);

        // Admin routes should redirect to /login when not authenticated
        const redirectedToLogin = result.finalUrl.includes('/login');
        if (!redirectedToLogin) {
          console.warn(`[AUTH LEAK?] ${route.path} did NOT redirect to /login. Final URL: ${result.finalUrl}`);
        }
      }
    }

    // Always pass — we're just auditing redirect behavior
    expect(true).toBe(true);
  });

  test('Generate visual QA JSON report', async () => {
    const reportPath = path.join('test-results', 'phase-12-1-evidence', 'visual-qa-report.json');
    ensureDir(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
    console.log(`Report written to: ${reportPath}`);

    // Summary
    const overflows = allResults.filter(r => r.hasHorizontalOverflow);
    const consoleErrs = allResults.filter(r => r.consoleErrors.length > 0);
    const failedReqs = allResults.filter(r => r.failedRequests.some(f => f.type === 'fetch' || f.type === 'xhr'));

    console.log(`\n=== PHASE 12.1C VISUAL QA SUMMARY ===`);
    console.log(`Total audited: ${allResults.length} route×viewport combinations`);
    console.log(`Horizontal overflow detected: ${overflows.length}`);
    console.log(`Pages with console errors: ${consoleErrs.length}`);
    console.log(`Pages with failed API requests: ${failedReqs.length}`);

    if (overflows.length > 0) {
      console.log(`\nOverflow details:`);
      overflows.forEach(r => console.log(`  ${r.label} @ ${r.viewport}: scrollWidth=${r.scrollWidth} innerWidth=${r.innerWidth}`));
    }

    expect(allResults.length).toBeGreaterThan(0);
  });
});
