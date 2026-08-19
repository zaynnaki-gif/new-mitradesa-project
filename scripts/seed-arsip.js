import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 5000 Arsip Surat Masuk...');
  
  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.error('No Desa found.');
    process.exit(1);
  }

  const batch = [];
  for (let i = 0; i < 5000; i++) {
    batch.push({
      desaId: desa.id,
      nomorSurat: `SM-${i}-${Date.now()}`,
      tanggalSurat: new Date(),
      tanggalDiterima: new Date(),
      pengirim: `Pengirim ${i}`,
      perihal: `Perihal dummy surat masuk ke-${i}`,
      status: 'DITERIMA'
    });
  }

  await prisma.suratMasuk.createMany({
    data: batch
  });
  
  console.log('Seeding complete.');
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
