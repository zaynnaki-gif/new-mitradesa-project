const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Penduduk count:', await prisma.penduduk.count());
  console.log('Keluarga count:', await prisma.keluarga.count());
  const p = await prisma.penduduk.findFirst();
  console.dir(p, {depth:null});
}
main().finally(()=>prisma.$disconnect());
