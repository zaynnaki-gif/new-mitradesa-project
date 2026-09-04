import { performance } from 'perf_hooks';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
dotenv.config();

async function runColdStartSmokeTest() {
  console.log('=== PRE-FLIGHT SMOKE TEST: COLD START & MEMORY PROFILE ===\n');

  const memBefore = process.memoryUsage();
  console.log(`[1] Memory Baseline Sebelum Inisialisasi:`);
  console.log(`  - Heap Used : ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - RSS       : ${(memBefore.rss / 1024 / 1024).toFixed(2)} MB`);

  const t0 = performance.now();
  
  // Dynamic import of compiled production entry
  console.log('\n[2] Memuat bundle server produksi (apps/api/dist/app.js)...');
  const appModule = await import('../apps/api/dist/app.js');
  const app = appModule.default || appModule.app || appModule;
  const tAppLoaded = performance.now();
  console.log(`  -> Waktu inisialisasi Express & routing: ${(tAppLoaded - t0).toFixed(2)} ms`);

  // Verify routes are registered
  const routerStack = app._router?.stack || [];
  const routeLayers = routerStack.filter((layer) => layer.route || layer.name === 'router');
  console.log(`  -> Layer router terdaftar: ${routeLayers.length} modul`);

  const memAfter = process.memoryUsage();
  console.log(`\n[3] Memory Profile Setelah Inisialisasi:`);
  console.log(`  - Heap Used : ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB (+${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  - RSS       : ${(memAfter.rss / 1024 / 1024).toFixed(2)} MB`);

  if (memAfter.heapUsed / 1024 / 1024 > 250) {
    throw new Error('Cold start memory melebihi batas toleransi 250MB!');
  }

  // Database Connection Ping
  console.log('\n[4] Menguji Database Health & Ping Latency...');
  const { prisma } = await import('../apps/api/dist/services/prisma.js');
  const tDb0 = performance.now();
  await prisma.$queryRaw`SELECT 1 as live_check`;
  const tDb1 = performance.now();
  console.log(`  -> PostgreSQL roundtrip latency: ${(tDb1 - tDb0).toFixed(2)} ms`);

  await prisma.$disconnect();
  console.log('  -> Pool koneksi database berhasil dilepas secara bersih.');

  console.log('\n=== PRE-FLIGHT SMOKE TEST BERHASIL DENGAN STATUS EXCELLENT ===');
}

runColdStartSmokeTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Smoke test gagal:', err);
    process.exit(1);
  });
