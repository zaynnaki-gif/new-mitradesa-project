async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/penduduk/export?format=xlsx', {
      headers: { 'Authorization': 'Bearer test' }
    });
    console.log('status:', res.status);
    const buffer = await res.arrayBuffer();
    console.log('response length:', buffer.byteLength);
    console.log('sample:', Buffer.from(buffer).toString('utf8').substring(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
