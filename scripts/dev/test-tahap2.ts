import fetch from 'node-fetch';

async function main() {
  console.log('Testing Tahap 2 Endpoints...');
  
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: process.env.TEST_PASSWORD || 'password123'
    })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  const headers = { 'Authorization': `Bearer ${token}` };

  const endpoints = [
    '/api/kategori',
    '/api/halaman',
    '/api/umkm',
    '/api/agenda'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:3001${ep}`, { headers });
      if (res.ok) {
        const data = await res.json();
        console.log(`[SUCCESS] GET ${ep}: ${Array.isArray(data.data) ? data.data.length : (data.data?.data?.length || 0)} items retrieved.`);
      } else {
        console.log(`[FAILED] GET ${ep}: ${res.status} - ${await res.text()}`);
      }
    } catch (e: any) {
      console.log(`[ERROR] GET ${ep}: ${e.message}`);
    }
  }
}

main().catch(console.error);
