import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai seeding APBDes...');

  // Dapatkan desa pertama
  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.error('Tidak ada data desa. Jalankan seed desa terlebih dahulu.');
    return;
  }

  // Cek apakah data apbdes sudah ada
  const existingApbdes = await prisma.apbdes.count();
  if (existingApbdes > 0) {
    console.log('Data APBDes sudah ada. Menghapus data lama...');
    await prisma.apbdesItem.deleteMany({});
    await prisma.apbdes.deleteMany({});
  }

  const tahunSekarang = new Date().getFullYear();

  const apbdesData = {
    desaId: desa.id,
    tahun: tahunSekarang,
    totalPendapatan: 1540000000,
    totalBelanja: 1615000000,
    totalPembiayaan: 75000000,
    isAktif: true,
  };

  const createdApbdes = await prisma.apbdes.create({
    data: apbdesData,
  });

  const pendapatanItems = [
    { nama: 'Pendapatan Asli Desa (PADes)', anggaran: 85000000, realisasi: 60000000 },
    { nama: 'Dana Desa (DD)', anggaran: 950000000, realisasi: 950000000 },
    { nama: 'Alokasi Dana Desa (ADD)', anggaran: 350000000, realisasi: 350000000 },
    { nama: 'Bantuan Provinsi', anggaran: 130000000, realisasi: 130000000 },
    { nama: 'Pendapatan Lain-lain', anggaran: 25000000, realisasi: 15000000 },
  ];

  const belanjaItems = [
    { nama: 'Penyelenggaraan Pemerintahan Desa', anggaran: 450000000, realisasi: 420000000 },
    { nama: 'Pelaksanaan Pembangunan Desa', anggaran: 750000000, realisasi: 680000000 },
    { nama: 'Pembinaan Kemasyarakatan Desa', anggaran: 185000000, realisasi: 150000000 },
    { nama: 'Pemberdayaan Masyarakat Desa', anggaran: 150000000, realisasi: 110000000 },
    { nama: 'Penanggulangan Bencana, Darurat dan Mendesak', anggaran: 80000000, realisasi: 60000000 },
  ];

  const pembiayaanItems = [
    { nama: 'Penerimaan Pembiayaan', anggaran: 100000000, realisasi: 100000000 },
    { nama: 'Pengeluaran Pembiayaan', anggaran: 25000000, realisasi: 25000000 },
  ];

  // Insert items
  for (const item of pendapatanItems) {
    await prisma.apbdesItem.create({
      data: {
        apbdesId: createdApbdes.id,
        kategori: 'PENDAPATAN',
        nama: item.nama,
        anggaran: item.anggaran,
        realisasi: item.realisasi,
      },
    });
  }

  for (const item of belanjaItems) {
    await prisma.apbdesItem.create({
      data: {
        apbdesId: createdApbdes.id,
        kategori: 'BELANJA',
        nama: item.nama,
        anggaran: item.anggaran,
        realisasi: item.realisasi,
      },
    });
  }

  for (const item of pembiayaanItems) {
    await prisma.apbdesItem.create({
      data: {
        apbdesId: createdApbdes.id,
        kategori: 'PEMBIAYAAN',
        nama: item.nama,
        anggaran: item.anggaran,
        realisasi: item.realisasi,
      },
    });
  }

  console.log(`Seeding APBDes berhasil untuk tahun ${tahunSekarang}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
