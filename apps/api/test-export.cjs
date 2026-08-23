const fs = require('fs');
const token = 'placeholder'; // Not using real token, but the DB should have user or I can connect directly
// I'll directly call the service function since I'm in apps/api
const { pendudukService } = require('./src/services/penduduk.service.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const data = await pendudukService.exportData('xlsx', {});
    fs.writeFileSync('direct-export.xlsx', data);
    console.log('Saved direct-export.xlsx, size:', data.length);
    console.log('Hex dump:', data.slice(0, 10).toString('hex'));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
