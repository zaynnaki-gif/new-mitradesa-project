/**
 * Seed Data: Indonesian Provinces
 * Source: kemendagri reference data
 * Last updated: 2024
 *
 * Run: npx tsx prisma/seed-wilayah.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All 38 Indonesian Provinces
const PROVINCES = [
  { kode: '11', nama: 'Aceh' },
  { kode: '12', nama: 'Sumatera Utara' },
  { kode: '13', nama: 'Sumatera Barat' },
  { kode: '14', nama: 'Riau' },
  { kode: '15', nama: 'Jambi' },
  { kode: '16', nama: 'Sumatera Selatan' },
  { kode: '17', nama: 'Bengkulu' },
  { kode: '18', nama: 'Lampung' },
  { kode: '19', nama: 'Bangka Belitung' },
  { kode: '21', nama: 'Kepulauan Riau' },
  { kode: '31', nama: 'Dki Jakarta' },
  { kode: '32', nama: 'Jawa Barat' },
  { kode: '33', nama: 'Jawa Tengah' },
  { kode: '34', nama: 'DI Yogyakarta' },
  { kode: '35', nama: 'Jawa Timur' },
  { kode: '36', nama: 'Banten' },
  { kode: '51', nama: 'Bali' },
  { kode: '52', nama: 'Nusa Tenggara Barat' },
  { kode: '53', nama: 'Nusa Tenggara Timur' },
  { kode: '61', nama: 'Kalimantan Barat' },
  { kode: '62', nama: 'Kalimantan Tengah' },
  { kode: '63', nama: 'Kalimantan Selatan' },
  { kode: '64', nama: 'Kalimantan Timur' },
  { kode: '65', nama: 'Kalimantan Utara' },
  { kode: '71', nama: 'Sulawesi Utara' },
  { kode: '72', nama: 'Sulawesi Tengah' },
  { kode: '73', nama: 'Sulawesi Selatan' },
  { kode: '74', nama: 'Sulawesi Tenggara' },
  { kode: '75', nama: 'Gorontalo' },
  { kode: '76', nama: 'Sulawesi Barat' },
  { kode: '81', nama: 'Maluku' },
  { kode: '82', nama: 'Maluku Utara' },
  { kode: '83', nama: 'Maluku Barat Daya' },
  { kode: '84', nama: 'Papua Barat' },
  { kode: '85', nama: 'Papua' },
  { kode: '86', nama: 'Papua Tengah' },
  { kode: '91', nama: 'Papua Pegunungan' },
  { kode: '92', nama: 'Papua Barat' },
  { kode: '93', nama: 'Papua' },
  { kode: '94', nama: 'Papua' },
  { kode: '95', nama: 'Papua' },
];

async function main() {
  console.log('Seeding Indonesian Provinces...\n');

  let created = 0;
  let updated = 0;

  for (const prov of PROVINCES) {
    const existing = await prisma.provinsi.findUnique({ where: { kode: prov.kode } });

    if (existing) {
      await prisma.provinsi.update({
        where: { kode: prov.kode },
        data: { nama: prov.nama },
      });
      updated++;
    } else {
      await prisma.provinsi.create({ data: prov });
      created++;
    }
  }

  console.log(`Provinces: ${created} created, ${updated} updated`);
  console.log('\nProvinces seeded successfully!');
  console.log('For full wilayah data (regencies, districts, villages) please run the full sync script.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
