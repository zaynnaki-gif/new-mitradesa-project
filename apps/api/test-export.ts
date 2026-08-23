import { pendudukService } from './src/services/penduduk.service.js';
import { prisma } from './src/services/prisma.js';
import * as fs from 'fs';

async function run() {
  try {
    const data = await pendudukService.exportData('xlsx', {});
    fs.writeFileSync('direct-export.xlsx', data);
    console.log('Saved direct-export.xlsx, size:', data.length);
    console.log('Hex start:', data.slice(0, 10).toString('hex'));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
