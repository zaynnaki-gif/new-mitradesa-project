import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  try {
    let layanan = await prisma.layanan.findFirst({ where: { kode: 'LYN-001' }});
    if (!layanan) {
      layanan = await prisma.layanan.create({
        data: {
          nama: 'Pelayanan Umum',
          kode: 'LYN-001',
          deskripsi: 'Layanan administrasi umum desa',
          slug: 'pelayanan-umum',
          desa: { connect: { id: (await prisma.identitasDesa.findFirst()).id } }
        }
      });
      console.log('Created Layanan:', layanan.nama);
    }

    let doc = await prisma.dokumenDefinition.findFirst({ where: { kode: 'DOC-001' }});
    if (!doc) {
      doc = await prisma.dokumenDefinition.create({
        data: {
          nama: 'Surat Keterangan Test',
          kode: 'DOC-001',
          deskripsi: 'Dokumen untuk test',
          layananId: layanan.id,
          slug: 'surat-keterangan-test'
        }
      });
      console.log('Created DokumenDefinition:', doc.nama);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
