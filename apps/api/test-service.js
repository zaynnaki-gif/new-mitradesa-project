require('ts-node').register();
const { pendudukService } = require('./src/services/penduduk.service.ts');

async function test() {
  const data = await pendudukService.exportData('xlsx', {});
  console.log('type of data:', data.constructor.name);
  console.log('isBuffer:', Buffer.isBuffer(data));
  console.log('size:', data.length);
}
test().catch(console.error);
