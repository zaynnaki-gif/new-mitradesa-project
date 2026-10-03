/* eslint-disable no-console */
import fetch from 'node-fetch';

async function main() {
  console.log('Testing Tahap 1 Endpoints (Penduduk, Posyandu, Bumil) + E-Surat NIK Search + CREATE Penduduk...');
  
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
  
  const loginData = await loginRes.json() as any;
  const token = loginData.data.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1. Test POST /api/penduduk (CREATE)
  const dummyNik = '1876543210987654';
  console.log(`\n--- Testing CREATE Penduduk (POST /api/penduduk) ---`);
  const createPayload = {
    nik: dummyNik,
    namaLengkap: 'Dummy Test CREATE Tahap 1',
    tempatLahir: 'Jakarta',
    tanggalLahir: '1990-01-01T00:00:00.000Z',
    jenisKelamin: 'L',
    statusPerkawinan: 'Belum Kawin'
  };

  let createdId = null;
  try {
    const createRes = await fetch('http://localhost:3001/api/penduduk', {
      method: 'POST',
      headers,
      body: JSON.stringify(createPayload)
    });
    if (createRes.ok) {
      const data = await createRes.json() as any;
      createdId = data.data.id;
      console.log(`[SUCCESS] POST /api/penduduk: Created new penduduk with ID ${createdId} and NIK ${dummyNik}`);
    } else {
      console.log(`[FAILED] POST /api/penduduk: ${createRes.status} - ${await createRes.text()}`);
      // If it already exists (e.g., from previous failed test), we ignore the error
    }
  } catch (e: any) {
    console.log(`[ERROR] POST /api/penduduk: ${e.message}`);
  }

  // 2. Test GET /api/penduduk/nik/:nik (E-Surat Form search equivalent)
  console.log(`\n--- Testing E-Surat NIK Search (GET /api/penduduk/nik/:nik) ---`);
  try {
    const searchRes = await fetch(`http://localhost:3001/api/penduduk/nik/${dummyNik}`, { headers });
    if (searchRes.ok) {
      const data = await searchRes.json() as any;
      console.log(`[SUCCESS] GET /api/penduduk/nik/${dummyNik}: Retrieved ${data.data?.namaLengkap}`);
      if (!createdId && data.data?.id) {
          createdId = data.data.id;
      }
    } else {
      console.log(`[FAILED] GET /api/penduduk/nik/${dummyNik}: ${searchRes.status} - ${await searchRes.text()}`);
    }
  } catch (e: any) {
    console.log(`[ERROR] GET /api/penduduk/nik/${dummyNik}: ${e.message}`);
  }

  // 3. Test DELETE /api/penduduk/:id (Clean up)
  if (createdId) {
    console.log(`\n--- Cleaning up dummy data ---`);
    try {
        const delRes = await fetch(`http://localhost:3001/api/penduduk/${createdId}`, { method: 'DELETE', headers });
        if (delRes.ok) {
            console.log(`[SUCCESS] DELETE /api/penduduk/${createdId}`);
        } else {
            console.log(`[FAILED] DELETE /api/penduduk/${createdId}: ${delRes.status} - ${await delRes.text()}`);
        }
    } catch(e: any) {
        console.log(`[ERROR] DELETE /api/penduduk/${createdId}: ${e.message}`);
    }
  }
}

main().catch(console.error);
