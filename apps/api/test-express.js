const fs = require('fs');

async function run() {
  const res = await fetch('http://localhost:3001/api/penduduk/export-test');
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('test-express.xlsx', Buffer.from(buffer));
  console.log('Saved test-express.xlsx, size:', buffer.byteLength);
  console.log('Hex start:', Buffer.from(buffer).slice(0, 10).toString('hex'));
}
run();
