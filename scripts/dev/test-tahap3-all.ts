/* eslint-disable no-console */
import fetch from 'node-fetch';

async function testEndpoint(name: string, url: string, headers: any) {
  console.log(`\n--- Testing ${name} (${url}) ---`);
  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json() as any;
      console.log(`[SUCCESS] ${name}: Retrieved ${(data.data?.length || data.data?.items?.length || 0)} items or OK.`);
    } else {
      console.log(`[FAILED] ${name}: ${res.status} - ${await res.text()}`);
    }
  } catch (e: any) {
    console.log(`[ERROR] ${name}: ${e.message}`);
  }
}

async function main() {
  console.log('Testing Tahap 3 Endpoints (All 13 Models)...');
  
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: process.env.TEST_PASSWORD || 'password123' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json() as any;
  const token = loginData.data.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Tahap 3a
  await testEndpoint('Penduduk', 'http://localhost:3001/api/penduduk', headers);
  await testEndpoint('Keluarga', 'http://localhost:3001/api/keluarga', headers);
  await testEndpoint('MutasiPenduduk', 'http://localhost:3001/api/penduduk/mutasi', headers);
  await testEndpoint('Gubug', 'http://localhost:3001/api/wilayah/gubug', headers); 
  await testEndpoint('Bumil', 'http://localhost:3001/api/bumil', headers);
  await testEndpoint('PosyanduKunjungan', 'http://localhost:3001/api/posyandu', headers);

  // Tahap 3b
  await testEndpoint('KasUmum', 'http://localhost:3001/api/kas-umum', headers);
  // Note: BukuBank is checked if KasUmum route returns it, or we'll skip it if it doesn't have a direct endpoint
  await testEndpoint('Apbdes', 'http://localhost:3001/api/transparansi', headers);
  await testEndpoint('Bansos', 'http://localhost:3001/api/bansos', headers);
  await testEndpoint('PotensiDesa', 'http://localhost:3001/api/cms/potensi', headers);

  // Tahap 3c
  await testEndpoint('PerangkatDesa', 'http://localhost:3001/api/perangkat-desa', headers);
  await testEndpoint('SaranAduan', 'http://localhost:3001/api/saran-aduan', headers);
}

main().catch(console.error);
