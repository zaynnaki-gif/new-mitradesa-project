const http = require('http');

// Test 1: login
const body = JSON.stringify({ username: 'admin', password: 'admin123' });
const options = {
  hostname: 'localhost',
  port: 3001, path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('=== LOGIN RESPONSE ===');
    console.log('Status:', res.statusCode);
    try { console.log(JSON.stringify(JSON.parse(data), null, 2)); }
    catch { console.log('Raw body:', data); }
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
