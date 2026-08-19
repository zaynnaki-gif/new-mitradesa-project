import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// ─── Configuration ────────────────────────────────────────────────────────────
const PHASE_DIR = path.join('test-results', 'phase-12-2', 'admin');

// Credentials reused from existing auth.spec.ts / cms-workflow.spec.ts infrastructure
const TEST_USERNAME = 'admin';
const TEST_PASSWORD = 'admin123';

const VIEWPORTS = [
  { label: '1440x900', width: 1440, height: 900 },  // Desktop
  { label: '1024x768', width: 1024, height: 768 },  // Tablet
  { label: '390x844',  width: 390,  height: 844  },  // Mobile
];

const ADMIN_ROUTES: { label: string; path: string }[] = [
  { label: 'dashboard',            path: '/admin/dashboard' },
  { label: 'dashboard-executive',  path: '/admin/dashboard/executive' },
  { label: 'wilayah',             path: '/admin/master/wilayah' },
  { label: 'identitas-desa',      path: '/admin/master/identitas-desa' },
  { label: 'perangkat-desa',      path: '/admin/master/perangkat-desa' },
  { label: 'surat-templates',     path: '/admin/surat/templates' },
  { label: 'surat-arsip',         path: '/admin/surat/arsip' },
  { label: 'layanan',             path: '/admin/layanan' },
  { label: 'permintaan',          path: '/admin/permintaan' },
  { label: 'dokumen',             path: '/admin/dokumen' },
  { label: 'konten-berita',       path: '/admin/konten/berita' },
  { label: 'konten-halaman',      path: '/admin/konten/halaman' },
  { label: 'konten-kategori',     path: '/admin/konten/kategori' },
  { label: 'konten-media',        path: '/admin/konten/media' },
  { label: 'konten-agenda',       path: '/admin/konten/agenda' },
  { label: 'konten-umkm',         path: '/admin/konten/umkm' },
  { label: 'konten-potensi',      path: '/admin/konten/potensi' },
  { label: 'konten-transparansi', path: '/admin/konten/transparansi' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function ssName(label: string, vp: string): string {
  return path.join(PHASE_DIR, `admin__${label}__${vp}.png`);
}

async function loginAsAdmin(page: Page): Promise<boolean> {
  try {
    await page.goto('/login', { waitUntil: 'load', timeout: 15000 });
    await page.getByPlaceholder('Masukkan username').fill(TEST_USERNAME);
    await page.getByPlaceholder('Masukkan password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
    return true;
  } catch (err) {
    console.error(`[AUTH FAILED] Could not login: ${(err as Error).message}`);
    return false;
  }
}

type AdminAuditResult = {
  route: string;
  label: string;
  viewport: string;
  authOk: boolean;
  finalUrl: string;
  scrollWidth: number;
  innerWidth: number;
  hasHorizontalOverflow: boolean;
  consoleErrors: string[];
  failedRequests: { url: string; status: number; type: string }[];
  screenshot: string;
  renderOk: boolean;
};

const allResults: AdminAuditResult[] = [];

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe('Phase 12.2 — Authenticated Admin Visual QA', () => {
  test.setTimeout(600_000); // 10 minutes

  test('Admin login verification', async ({ page }) => {
    const ok = await loginAsAdmin(page);
    expect(ok, 'Admin login must succeed').toBe(true);

    // Verify we land on the admin dashboard
    const url = page.url();
    expect(url).toMatch(/\/admin\/dashboard/);
    console.log(`[AUTH] Login successful. URL: ${url}`);
  });

  test('Authenticated admin pages — visual audit', async ({ page }) => {
    ensureDir(PHASE_DIR);

    const authOk = await loginAsAdmin(page);
    if (!authOk) {
      console.error('[BLOCKED] Authentication failed — admin visual audit cannot proceed');
      // Mark all as blocked rather than silently skipping
      for (const route of ADMIN_ROUTES) {
        for (const vp of VIEWPORTS) {
          allResults.push({
            route: route.path, label: route.label, viewport: vp.label,
            authOk: false, finalUrl: '', scrollWidth: 0, innerWidth: 0,
            hasHorizontalOverflow: false, consoleErrors: ['AUTH_BLOCKED'],
            failedRequests: [], screenshot: '', renderOk: false,
          });
        }
      }
      expect(authOk, 'Authentication must succeed to run admin visual audit').toBe(true);
      return;
    }

    for (const route of ADMIN_ROUTES) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        const consoleErrors: string[] = [];
        const failedRequests: { url: string; status: number; type: string }[] = [];

        const onConsole = (msg: { type: () => string; text: () => string }) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        };
        const onResponse = (res: { status: () => number; url: () => string; request: () => { resourceType: () => string } }) => {
          const status = res.status();
          // Ignore expected 401 from auth-check on page load
          if (status >= 400 && !(status === 401 && res.url().includes('/api/auth/me'))) {
            failedRequests.push({ url: res.url(), status, type: res.request().resourceType() });
          }
        };

        page.on('console', onConsole);
        page.on('response', onResponse);

        let renderOk = false;
        let finalUrl = '';

        try {
          await page.goto(route.path, { waitUntil: 'load', timeout: 20000 });
          try { await page.waitForLoadState('networkidle', { timeout: 3000 }); } catch (_) {}
          await page.waitForTimeout(800);
          finalUrl = page.url();

          // Check we are NOT on login page (auth guard bypassed successfully)
          renderOk = !finalUrl.includes('/login');
          if (!renderOk) {
            console.warn(`[SESSION EXPIRED?] ${route.path} redirected to login at viewport ${vp.label}`);
            // Re-login and retry once
            const reAuth = await loginAsAdmin(page);
            if (reAuth) {
              await page.goto(route.path, { waitUntil: 'load', timeout: 20000 });
              try { await page.waitForLoadState('networkidle', { timeout: 3000 }); } catch (_) {}
              await page.waitForTimeout(800);
              finalUrl = page.url();
              renderOk = !finalUrl.includes('/login');
            }
          }
        } catch (err) {
          consoleErrors.push(`Navigation error: ${(err as Error).message}`);
        }

        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        const hasHorizontalOverflow = scrollWidth > innerWidth + 5;

        const ssPath = ssName(route.label, vp.label);
        ensureDir(path.dirname(ssPath));
        await page.screenshot({ path: ssPath, fullPage: false });

        page.off('console', onConsole);
        page.off('response', onResponse);

        const result: AdminAuditResult = {
          route: route.path, label: route.label, viewport: vp.label,
          authOk: true, finalUrl, scrollWidth, innerWidth,
          hasHorizontalOverflow, consoleErrors, failedRequests,
          screenshot: ssPath, renderOk,
        };
        allResults.push(result);

        if (hasHorizontalOverflow) {
          console.warn(`[OVERFLOW] ${route.label} @ ${vp.label} — scrollWidth=${scrollWidth} innerWidth=${innerWidth}`);
        }
        if (!renderOk) {
          console.warn(`[RENDER FAIL] ${route.label} @ ${vp.label} — finalUrl=${finalUrl}`);
        }
        if (consoleErrors.length > 0) {
          console.warn(`[CONSOLE ERR] ${route.label} @ ${vp.label}:`);
          consoleErrors.forEach(e => console.warn('  ' + e));
        }
        if (failedRequests.length > 0) {
          console.warn(`[NETWORK FAIL] ${route.label} @ ${vp.label}:`);
          failedRequests.forEach(r => console.warn(`  ${r.status} ${r.type} ${r.url}`));
        }
      }
    }
  });

  test('Keyboard focus — critical admin pages', async ({ page }) => {
    const authOk = await loginAsAdmin(page);
    if (!authOk) {
      console.warn('[BLOCKED] Keyboard test skipped — auth failed');
      return;
    }

    const criticalRoutes = [
      { label: 'dashboard',    path: '/admin/dashboard' },
      { label: 'konten-berita', path: '/admin/konten/berita' },
      { label: 'permintaan',   path: '/admin/permintaan' },
    ];

    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of criticalRoutes) {
      await page.goto(route.path, { waitUntil: 'load', timeout: 20000 });
      try { await page.waitForLoadState('networkidle', { timeout: 3000 }); } catch (_) {}

      if (page.url().includes('/login')) {
        console.warn(`[KEYBOARD] ${route.label} — session expired, skipping`);
        continue;
      }

      // Tab through first 10 focusable elements and check focus is visible
      let focusLost = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName ?? 'NONE');
        if (focused === 'BODY' || focused === 'NONE') {
          focusLost = true;
          console.warn(`[KEYBOARD] ${route.label} — focus lost at Tab press ${i + 1} (landed on ${focused})`);
          break;
        }
      }

      // Test Escape closes any open modal/dialog (if any are open)
      await page.keyboard.press('Escape');

      console.log(`[KEYBOARD] ${route.label} — Tab navigation complete. Focus lost: ${focusLost}`);
    }
  });

  test('Generate Phase 12.2 JSON report', async () => {
    const reportPath = path.join('test-results', 'phase-12-2', 'admin-qa-report.json');
    ensureDir(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));

    const overflows     = allResults.filter(r => r.hasHorizontalOverflow);
    const renderFails   = allResults.filter(r => r.authOk && !r.renderOk);
    const consoleErrs   = allResults.filter(r => r.consoleErrors.length > 0);
    const networkFails  = allResults.filter(r => r.failedRequests.length > 0);
    const authBlocked   = allResults.filter(r => !r.authOk);
    const authenticated = allResults.filter(r => r.authOk && r.renderOk);

    console.log(`\n=== PHASE 12.2 ADMIN VISUAL QA SUMMARY ===`);
    console.log(`Total audited:          ${allResults.length} route×viewport`);
    console.log(`Authenticated renders:  ${authenticated.length}`);
    console.log(`Auth blocked:           ${authBlocked.length}`);
    console.log(`Render failures:        ${renderFails.length}`);
    console.log(`Horizontal overflow:    ${overflows.length}`);
    console.log(`Console errors:         ${consoleErrs.length} pages`);
    console.log(`Network failures:       ${networkFails.length} pages`);

    if (overflows.length > 0) {
      console.log('\nOverflow details:');
      overflows.forEach(r => console.log(`  ${r.label} @ ${r.viewport}: sw=${r.scrollWidth} iw=${r.innerWidth}`));
    }
    if (renderFails.length > 0) {
      console.log('\nRender failures:');
      renderFails.forEach(r => console.log(`  ${r.label} @ ${r.viewport}: finalUrl=${r.finalUrl}`));
    }
    if (networkFails.length > 0) {
      console.log('\nNetwork failures:');
      networkFails.forEach(r => {
        r.failedRequests.forEach(f => console.log(`  ${r.label} @ ${r.viewport}: ${f.status} ${f.type} ${f.url}`));
      });
    }

    expect(allResults.length).toBeGreaterThan(0);
  });
});
