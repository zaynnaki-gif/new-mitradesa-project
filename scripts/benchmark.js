import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001';
const ITERATIONS = 30;

function calculateMetrics(times) {
  if (times.length === 0) return { min: 0, max: 0, avg: 0, median: 0, p95: 0 };
  times.sort((a, b) => a - b);
  const min = times[0];
  const max = times[times.length - 1];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];

  return { min, max, avg, median, p95 };
}

async function runBenchmark(name, requestFn, iterations) {
  const times = [];
  let lastResponse = null;

  console.log(`\nStarting benchmark: ${name} (${iterations} iterations)`);
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      const res = await requestFn();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const end = performance.now();
      times.push(end - start);
      if (i === 0) lastResponse = data;
    } catch (e) {
      console.error(`Error in ${name} (iter ${i}):`, e.message);
    }
  }

  const metrics = calculateMetrics(times);
  console.log(`Results for ${name}:`);
  console.log(`  Min: ${metrics.min.toFixed(2)} ms`);
  console.log(`  Median: ${metrics.median.toFixed(2)} ms`);
  console.log(`  Average: ${metrics.avg.toFixed(2)} ms`);
  console.log(`  P95: ${metrics.p95.toFixed(2)} ms`);
  console.log(`  Max: ${metrics.max.toFixed(2)} ms`);
  
  return { metrics, sampleResponse: lastResponse };
}

async function main() {
  console.log('--- Phase 9.1 Benchmark Tool ---');
  
  // 1. Authenticate (Find an active session in the database)
  let session = await prisma.internalSession.findFirst({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    include: {
      account: true
    }
  });

  if (!session) {
    console.log('No session found. Creating a dummy account and session for benchmark...');
    const account = await prisma.account.findFirst();
    if (!account) {
      console.error('No accounts in database! Cannot run benchmark. Please seed database.');
      process.exit(1);
    }
    
    session = await prisma.internalSession.create({
      data: {
        accountId: account.id,
        token: 'benchmark-token-' + Date.now(),
        ipAddress: '127.0.0.1',
        userAgent: 'Benchmark',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      include: {
        account: true
      }
    });
  }

  if (!session) {
    console.error('No active session found. Please login via UI first or create a seed script.');
    process.exit(1);
  }

  const token = session.token;
  console.log(`Found active session for account ID: ${session.accountId}`);

  const headers = { Authorization: `Bearer ${token}` };

  // Wait for the API to be up
  try {
    const health = await fetch(`${BASE_URL}/api/health`);
    if (!health.ok) throw new Error('Not ok');
  } catch (e) {
    console.error('API is not running. Start it with "npm run dev" or "npm start".');
    process.exit(1);
  }

  // 1. Dashboard Executive
  await runBenchmark('Dashboard Executive (Promise.all)', () => fetch(`${BASE_URL}/api/dashboard/executive`, { headers }), ITERATIONS);

  // 2. Arsip Surat Masuk (limit=10)
  const resArsipMasuk = await runBenchmark('Arsip Masuk (limit=10)', () => fetch(`${BASE_URL}/api/arsip-surat/masuk?limit=10`, { headers }), ITERATIONS);
  console.log('Arsip Masuk (limit=10) returned rows:', resArsipMasuk.sampleResponse?.data?.length);

  // 3. Arsip Surat Masuk (limit=1000000 - checking for large payload protection)
  const resArsipMasukHuge = await runBenchmark('Arsip Masuk (limit=1000000)', () => fetch(`${BASE_URL}/api/arsip-surat/masuk?limit=1000000`, { headers }), 5);
  console.log('Arsip Masuk (limit=1000000) returned rows:', resArsipMasukHuge.sampleResponse?.data?.length);
  console.log('Arsip Masuk (limit=1000000) Status Code:', resArsipMasukHuge.sampleResponse?.success);

  // 4. Arsip Surat Keluar (limit=10)
  const resArsipKeluar = await runBenchmark('Arsip Keluar (limit=10)', () => fetch(`${BASE_URL}/api/arsip-surat/keluar?limit=10`, { headers }), ITERATIONS);
  console.log('Arsip Keluar (limit=10) returned rows:', resArsipKeluar.sampleResponse?.data?.length);

  // 5. Auth /me
  await runBenchmark('Auth /me', () => fetch(`${BASE_URL}/api/auth/me`, { headers }), ITERATIONS);

  console.log('\n--- Done ---');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
