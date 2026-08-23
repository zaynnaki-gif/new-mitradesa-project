const http = require('http');
const fs = require('fs');

const req = http.request('http://localhost:3001/api/penduduk/export?format=xlsx', { method: 'GET' }, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Total bytes:', buffer.length);
    if (buffer.length > 0) {
      console.log('First 20 bytes:', buffer.subarray(0, 20).toString('hex'));
      fs.writeFileSync('test-http.xlsx', buffer);
    }
  });
});
req.on('error', console.error);
req.end();
