const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // Assuming I can just do native fetch if Node >= 18
const fs = require('fs');

async function test() {
  const token = jwt.sign(
    { accountId: 1, role: 'admin', permissions: ['penduduk.view'] }, 
    process.env.JWT_SECRET || 'mitradesa_secret_key_2024', 
    { expiresIn: '1h' }
  );

  const res = await fetch('http://localhost:3001/api/penduduk/export?format=xlsx', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    console.error('Error:', await res.text());
    return;
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('test-api.xlsx', Buffer.from(buffer));
  console.log('Saved test-api.xlsx, size:', buffer.byteLength);
  console.log('Hex start:', Buffer.from(buffer).slice(0, 10).toString('hex'));
}
test();
