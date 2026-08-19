import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed initial reference data for Phase 4: Master Reference Tables
 * Run with: npx prisma db seed or npm run db:seed
 *
 * All seeds are IDEMPOTENT using upsert on kode field
 */

async function seedAgama() {
  console.log('Seeding RefAgama...');
  const data = [
    { kode: 'ISLAM', nama: 'Islam' },
    { kode: 'KRISTEN', nama: 'Kristen Protestan' },
    { kode: 'KATOLIK', nama: 'Katolik' },
    { kode: 'HINDU', nama: 'Hindu' },
    { kode: 'BUDDHA', nama: 'Buddha' },
    { kode: 'KONGHUCU', nama: 'Konghucu' },
  ];

  for (const item of data) {
    await prisma.refAgama.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} agama items`);
}

async function seedGolDarah() {
  console.log('Seeding RefGolDarah...');
  const data = [
    { kode: 'A', nama: 'A' },
    { kode: 'B', nama: 'B' },
    { kode: 'AB', nama: 'AB' },
    { kode: 'O', nama: 'O' },
  ];

  for (const item of data) {
    await prisma.refGolonganDarah.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} gol_darah items`);
}

async function seedStatusPerkawinan() {
  console.log('Seeding RefStatusPerkawinan...');
  const data = [
    { kode: 'BK', nama: 'Belum Kawin' },
    { kode: 'K', nama: 'Kawin' },
    { kode: 'CH', nama: 'Cerai Hidup' },
    { kode: 'CM', nama: 'Cerai Mati' },
  ];

  for (const item of data) {
    await prisma.refStatusPerkawinan.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} status_perkawinan items`);
}

async function seedHubunganKeluarga() {
  console.log('Seeding RefHubunganKeluarga...');
  const data = [
    { kode: 'KEPALA_KELUARGA', nama: 'Kepala Keluarga', kategori: 'KEPALA' },
    { kode: 'SUAMI', nama: 'Suami', kategori: 'PASANGAN' },
    { kode: 'ISTRI', nama: 'Istri', kategori: 'PASANGAN' },
    { kode: 'ANAK', nama: 'Anak', kategori: 'ANAK' },
    { kode: 'MENANTU', nama: 'Menantu', kategori: 'FAMILY' },
    { kode: 'CUCU', nama: 'Cucu', kategori: 'FAMILY' },
    { kode: 'ORANG_TUA', nama: 'Orang Tua', kategori: 'ORANG_TUA' },
    { kode: 'MERTUA', nama: 'Mertua', kategori: 'ORANG_TUA' },
    { kode: 'FAMILI', nama: 'Famili Lain', kategori: 'LAINNYA' },
    { kode: 'PEMBANTU', nama: 'Pembantu', kategori: 'LAINNYA' },
    { kode: 'LAINNYA', nama: 'Lainnya', kategori: 'LAINNYA' },
  ];

  for (const item of data) {
    await prisma.refHubunganKeluarga.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} hubungan_keluarga items`);
}

async function seedStatusKependudukan() {
  console.log('Seeding RefStatusKependudukan...');
  const data = [
    { kode: 'HIDIR', nama: 'Hidir' },
    { kode: 'TIDAK_HIDIR', nama: 'Tidak Hidir' },
    { kode: 'MENINGGAL', nama: 'Meninggal' },
    { kode: 'PINDAH', nama: 'Pindah' },
  ];

  for (const item of data) {
    await prisma.refStatusKependudukan.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} status_kependudukan items`);
}

async function seedPendidikan() {
  console.log('Seeding RefPendidikan...');
  const data = [
    { kode: 'TS', nama: 'Tidak Sekolah', jenjang: 0 },
    { kode: 'BS', nama: 'Belum Tamat SD', jenjang: 1 },
    { kode: 'SD', nama: 'Tamat SD/Sederajat', jenjang: 2 },
    { kode: 'SMP', nama: 'SLTP/Sederajat', jenjang: 3 },
    { kode: 'SMA', nama: 'SLTA/Sederajat', jenjang: 4 },
    { kode: 'D1', nama: 'Diploma I', jenjang: 5 },
    { kode: 'D2', nama: 'Diploma II', jenjang: 6 },
    { kode: 'D3', nama: 'Diploma III', jenjang: 7 },
    { kode: 'D4', nama: 'Diploma IV', jenjang: 8 },
    { kode: 'S1', nama: 'Strata I (S1)', jenjang: 9 },
    { kode: 'S2', nama: 'Strata II (S2)', jenjang: 10 },
    { kode: 'S3', nama: 'Strata III (S3)', jenjang: 11 },
  ];

  for (const item of data) {
    await prisma.refPendidikan.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} pendidikan items`);
}

async function seedPekerjaan() {
  console.log('Seeding RefPekerjaan...');
  const data = [
    { kode: 'PETANI', nama: 'Petani', kategori: 'PERTANIAN' },
    { kode: 'NELAYAN', nama: 'Nelayan', kategori: 'PERTANIAN' },
    { kode: 'PEDAGANG', nama: 'Pedagang', kategori: 'PERDAGANGAN' },
    { kode: 'PENGRAJIN', nama: 'Pengrajin', kategori: 'INDUSTRI' },
    { kode: 'PNS', nama: 'Pegawai Negeri Sipil', kategori: 'PEMERINTAHAN' },
    { kode: 'TNI', nama: 'TNI/POLRI', kategori: 'PEMERINTAHAN' },
    { kode: 'KARYAWAN', nama: 'Karyawan Swasta', kategori: 'JASA' },
    { kode: 'GURU', nama: 'Guru/Dosen', kategori: 'JASA' },
    { kode: 'DOKTER', nama: 'Dokter', kategori: 'JASA' },
    { kode: 'WIRASWASTA', nama: 'Wiraswasta', kategori: 'USAHA' },
    { kode: 'BURUH', nama: 'Buruh', kategori: 'INDUSTRI' },
    { kode: 'IBU_RUMAH', nama: 'Mengurus Rumah Tangga', kategori: 'LAINNYA' },
    { kode: 'PENSIUNAN', nama: 'Pensiunan', kategori: 'LAINNYA' },
    { kode: 'LAINNYA', nama: 'Lainnya', kategori: 'LAINNYA' },
  ];

  for (const item of data) {
    await prisma.refPekerjaan.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} pekerjaan items`);
}

async function seedJabatanPerangkat() {
  console.log('Seeding RefJabatanPerangkat...');
  const data = [
    { kode: 'KEPALA_DESA', nama: 'Kepala Desa', kategori: 'PEMERINTAHAN', urutan: 1 },
    { kode: 'SEKRETARIS', nama: 'Sekretaris Desa', kategori: 'PEMERINTAHAN', urutan: 2 },
    { kode: 'KAUR_UMUM', nama: 'Kaur Umum / Keuangan', kategori: 'PEMERINTAHAN', urutan: 3 },
    { kode: 'KASI_KESRA', nama: 'Kasi Kesejahteraan Rakyat', kategori: 'PEMERINTAHAN', urutan: 4 },
    { kode: 'KASI_PEM', nama: 'Kasi Pemerintahan', kategori: 'PEMERINTAHAN', urutan: 5 },
    { kode: 'KASI_EKONOMI', nama: 'Kasi Ekonomi & Pembangunan', kategori: 'PEMERINTAHAN', urutan: 6 },
    { kode: 'RT', nama: 'Ketua RT', kategori: 'RT_RW', urutan: 20 },
    { kode: 'RW', nama: 'Ketua RW', kategori: 'RT_RW', urutan: 21 },
    { kode: 'BPD_KETUA', nama: 'Ketua BPD', kategori: 'BPD', urutan: 50 },
    { kode: 'BPD_WAKIL', nama: 'Wakil Ketua BPD', kategori: 'BPD', urutan: 51 },
    { kode: 'BPD_SEKRETARIS', nama: 'Sekretaris BPD', kategori: 'BPD', urutan: 52 },
    { kode: 'BPD_ANGGOTA', nama: 'Anggota BPD', kategori: 'BPD', urutan: 99 },
  ];

  for (const item of data) {
    await prisma.refJabatanPerangkat.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} jabatan_perangkat items`);
}

async function seedStatusPerangkat() {
  console.log('Seeding RefStatusPerangkat...');
  const data = [
    { kode: 'AKTIF', nama: 'Aktif' },
    { kode: 'NONAKTIF', nama: 'Non-Aktif' },
    { kode: 'BERHENTI', nama: 'Berhenti' },
    { kode: 'MENINGGAL', nama: 'Meninggal' },
    { kode: 'MUTASI', nama: 'Mutasi' },
  ];

  for (const item of data) {
    await prisma.refStatusPerangkat.upsert({
      where: { kode: item.kode },
      update: {},
      create: item,
    });
    console.log(`  Created: ${item.nama}`);
  }
  console.log(`Seeded ${data.length} status_perangkat items`);
}

async function main() {
  console.log('==========================================');
  console.log('Phase 4: Seed Reference Data');
  console.log('==========================================\n');

  try {
    await seedAgama();
    await seedGolDarah();
    await seedStatusPerkawinan();
    await seedHubunganKeluarga();
    await seedStatusKependudukan();
    await seedPendidikan();
    await seedPekerjaan();
    await seedJabatanPerangkat();
    await seedStatusPerangkat();

    console.log('\n==========================================');
    console.log('All reference data seeded successfully!');
    console.log('==========================================');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
