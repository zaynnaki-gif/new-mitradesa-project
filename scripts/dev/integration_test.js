import fetch from 'node-fetch'; // Might need to just use native fetch if node > 18
// We are on Node >= 18 based on package.json engines, so native fetch is available.

const API_URL = 'http://localhost:3000/api';
const WEB_URL = 'http://localhost:5173';

async function runTests() {
  console.log('--- Starting Integration Tests ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${e.message}`);
      failed++;
    }
  }

  // 1. Test API Server Public Endpoint (Identitas Desa)
  await test('API Public Endpoint (Identitas Desa)', async () => {
    const res = await fetch(`${API_URL}/identitas`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const data = await res.json();
    if (!data.data || !data.data.id) throw new Error('Missing ID in identitas payload');
  });

  // 2. Test API Admin Login (Scenario 2)
  let token = null;
  await test('API Admin Login', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mitradesa.id', password: process.env.TEST_PASSWORD || 'password123' })
    });
    if (res.status === 500) {
      throw new Error(`Server returned 500`);
    }
    const data = await res.json();
    if (res.ok && data.data && data.data.token) {
      token = data.data.token;
    } else {
      console.log(`   (Note: login returned ${res.status}, possibly no admin seeded yet)`);
    }
  });

  // 3. Test API Saran & Aduan (Phase 10)
  await test('API Public Saran & Aduan Submission', async () => {
    const res = await fetch(`${API_URL}/pemerintahan/saran/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judul: 'Test Integration Submission',
        isi: 'This is a test submission from the integration script.',
        kategori: 'SARAN',
        namaPengirim: 'Integration Tester',
        emailPengirim: 'tester@example.com'
      })
    });
    // This endpoint should return 201 Created
    if (res.status !== 201 && res.status !== 200) {
      const txt = await res.text();
      throw new Error(`Expected 200/201, got ${res.status}: ${txt}`);
    }
  });

  console.log(`\n--- Test Summary: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();
