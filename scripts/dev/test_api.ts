async function testApi() {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log('0. Logging in...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: process.env.TEST_PASSWORD || 'password123' }) // commonly used default
  });
  
  if (!loginRes.ok) {
    const errorText = await loginRes.text();
    console.log('Login failed with status', loginRes.status, 'message:', errorText);
    
    // Attempt fallback to typical defaults if the password was different
    const loginRes2 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: process.env.TEST_PASSWORD || 'password' })
    });
    if (!loginRes2.ok) {
        console.error('Second login attempt failed too. Check credentials.');
        return;
    }
    var tokenData = await loginRes2.json();
  } else {
    var tokenData = await loginRes.json();
  }

  const token = tokenData.data?.token || tokenData.token;
  if (!token) {
    console.error('No token received:', tokenData);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const get = async (path: string) => {
    const res = await fetch(`${baseUrl}${path}`, { headers });
    const data = await res.json();
    return { status: res.status, data };
  };

  try {
    console.log('1. Testing GET /penduduk');
    const pendudukList = await get('/penduduk');
    console.log('Status:', pendudukList.status);
    console.log('Response summary:', { 
      success: pendudukList.data.success, 
      count: pendudukList.data.data?.length 
    });

    let pendudukId = pendudukList.data.data?.[0]?.id;
    let createdPenduduk = false;

    if (!pendudukId) {
      console.log('\n-> No penduduk found. Creating one...');
      const createPenduduk = await fetch(`${baseUrl}/penduduk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nik: '1234567890123456',
          namaLengkap: 'Test Penduduk',
          tempatLahir: 'Jakarta',
          tanggalLahir: '1990-01-01',
          jenisKelamin: 'L',
          statusPerkawinan: 'BELUM KAWIN',
          agama: 'ISLAM',
          wargaNegara: 'WNI',
          isAktif: true
        })
      });
      const createRes = await createPenduduk.json();
      console.log('Create Penduduk Status:', createPenduduk.status);
      pendudukId = createRes.data?.id;
      createdPenduduk = true;
    }

    if (pendudukId) {
      console.log('\n2. Testing GET /penduduk/:id');
      const pendudukDetail = await get(`/penduduk/${pendudukId}`);
      console.log('Status:', pendudukDetail.status, 'Success:', pendudukDetail.data.success);
    }

    console.log('\n3. Testing GET /bansos');
    const bansosList = await get('/pemerintahan/bansos');
    console.log('Status:', bansosList.status, 'Count:', bansosList.data.data?.length);

    console.log('\n4. Testing GET /bumil');
    const bumilList = await get('/kesehatan/bumil');
    console.log('Status:', bumilList.status, 'Count:', bumilList.data.data?.length);

    console.log('\n5. Testing GET /posyandu');
    const posyanduList = await get('/kesehatan/posyandu');
    console.log('Status:', posyanduList.status, 'Count:', posyanduList.data.data?.length);

    if (pendudukId) {
      console.log('\n6. Testing POST /kesehatan/bumil');
      const createBumil = await fetch(`${baseUrl}/kesehatan/bumil`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pendudukId: pendudukId.toString(),
          namaLengkap: 'Bumil Test',
          nik: '1234567890123456',
          trimester: 1
        })
      });
      console.log('Status:', createBumil.status);
      const bumilData = await createBumil.json();
      console.log(bumilData);

      console.log('\n7. Testing POST /kesehatan/posyandu');
      const createPosyandu = await fetch(`${baseUrl}/kesehatan/posyandu`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pendudukId: pendudukId.toString(),
          tanggalKunjungan: '2024-05-01',
          kategori: 'IBU_HAMIL'
        })
      });
      console.log('Status:', createPosyandu.status);
      const posyanduData = await createPosyandu.json();
      console.log(posyanduData);
    }

  } catch (err) {
    console.error('Error during testing:', err);
  }
}

testApi();
