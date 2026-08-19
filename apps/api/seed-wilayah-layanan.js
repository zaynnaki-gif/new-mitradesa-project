const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDesaAndLayanan() {
  console.log('Seeding Layanan...');
  let desa = await prisma.desa.findFirst();

  let layanan = await prisma.layanan.findFirst();
  if (!layanan) {
    await prisma.layanan.create({
      data: {
        desaId: desa.id,
        kode: 'SKU',
        nama: 'Surat Keterangan Usaha',
        slug: 'surat-keterangan-usaha',
        deskripsi: 'Layanan SKU',
        isActive: true
      }
    });
    console.log('Layanan created.');
  }

  console.log('Done!');
}

seedDesaAndLayanan().catch(console.error).finally(() => prisma.$disconnect());
