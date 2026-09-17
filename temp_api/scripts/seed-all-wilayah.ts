#!/usr/bin/env node
/**
 * Seed All Indonesian Provinces, Regencies, Districts, Villages
 *
 * Usage:
 *   npx tsx scripts/seed-all-wilayah.ts --provinces-only  # Just provinces
 *   npx tsx scripts/seed-all-wilayah.ts --full          # Full sync
 *
 * API source: https://github.com/ans-gs/emsifa.github.io (or fallback sources)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_SOURCES = [
  'https://raw.githubusercontent.com/ans-gs/emsifa.github.io/main/api-wilayah',
  'https://cdn.jsdelivr.net/gh/ans-gs/emsifa.github.io@main/api-wilayah',
];

let API_BASE = '';
let source = '';

// Try each source
async function testSource(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/provinces.json`);
    return res.ok;
  } catch { return false; }
}

async function findWorkingSource(): Promise<string> {
  for (const src of API_SOURCES) {
    if (await testSource(src)) return src;
  }
  throw new Error('No API source reachable');
}

interface Province { id: string; name: string; }
interface Regency { id: string; province_id: string; name: string; }
interface District { id: string; regency_id: string; name: string; }
interface Village { id: string; district_id: string; name: string; }

const stats = { provinces: 0, regencies: 0, districts: 0, villages: 0 };

const PROVINCES = [
  { kode: '11', nama: 'Aceh' }, { kode: '12', nama: 'Sumatera Utara' },
  { kode: '13', nama: 'Sumatera Barat' }, { kode: '14', nama: 'Riau' },
  { kode: '15', nama: 'Jambi' }, { kode: '16', nama: 'Sumatera Selatan' },
  { kode: '17', nama: 'Bengkulu' }, { kode: '18', nama: 'Lampung' },
  { kode: '19', nama: 'Bangka Belitung' }, { kode: '21', nama: 'Kepulauan Riau' },
  { kode: '31', nama: 'Dki Jakarta' }, { kode: '32', nama: 'Jawa Barat' },
  { kode: '33', nama: 'Jawa Tengah' }, { kode: '34', nama: 'DI Yogyakarta' },
  { kode: '35', nama: 'Jawa Timur' }, { kode: '36', nama: 'Banten' },
  { kode: '51', nama: 'Bali' }, { kode: '52', nama: 'Nusa Tenggara Barat' },
  { kode: '53', nama: 'Nusa Tenggara Timur' }, { kode: '61', nama: 'Kalimantan Barat' },
  { kode: '62', nama: 'Kalimantan Tengah' }, { kode: '63', nama: 'Kalimantan Selatan' },
  { kode: '64', nama: 'Kalimantan Timur' }, { kode: '65', nama: 'Kalimantan Utara' },
  { kode: '71', nama: 'Sulawesi Utara' }, { kode: '72', nama: 'Sulawesi Tengah' },
  { kode: '73', nama: 'Sulawesi Selatan' }, { kode: '74', nama: 'Sulawesi Tenggara' },
  { kode: '75', nama: 'Gorontalo' }, { kode: '76', nama: 'Sulawesi Barat' },
  { kode: '81', nama: 'Maluku' }, { kode: '82', nama: 'Maluku Utara' },
  { kode: '91', nama: 'Papua Barat' }, { kode: '94', nama: 'Papua' },
];

async function fetchJson<T>(path: string): Promise<T[]> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

async function seedProvinces() {
  console.log('[1/4] Provinces...');
  for (const p of PROVINCES) {
    try {
      await prisma.provinsi.upsert({
        where: { kode: p.kode },
        update: { nama: p.nama },
        create: p,
      });
      stats.provinces++;
    } catch (e) { /* skip duplicates */
    }
  }
  console.log(`  ${stats.provinces} provinces seeded`);
}

async function seedRegencies() {
  console.log('[2/4] Regencies...');
  const provinces = await prisma.provinsi.findMany();
  let total = 0;
  for (const prov of provinces) {
    const data: Regency[] = await fetchJson(`/regencies/${prov.kode}.json`);
    for (const r of data) {
      try {
        await prisma.kabupaten.upsert({
          where: { provinsiId_kode: { provinsiId: prov.id, kode: r.id } },
          update: { nama: r.name },
          create: { provinsiId: prov.id, kode: r.id, nama: r.name },
        });
        total++;
      } catch { /* skip duplicates */
      }
    }
    process.stdout.write(`\r  ${prov.nama}: ${data.length} regencies`);
  }
  stats.regencies = total;
  console.log(`\n  ${total} regencies seeded`);
}

async function seedDistricts() {
  console.log('[3/4] Districts...');
  const regencies = await prisma.kabupaten.findMany();
  let total = 0;
  for (const kab of regencies) {
    const data: District[] = await fetchJson(`/districts/${kab.kode}.json`);
    for (const d of data) {
      try {
        await prisma.kecamatan.upsert({
          where: { kabupatenId_kode: { kabupatenId: kab.id, kode: d.id } },
          update: { nama: d.name },
          create: { kabupatenId: kab.id, kode: d.id, nama: d.name },
        });
        total++;
      } catch { /* skip duplicates */
      }
    }
    if (total % 500 === 0) process.stdout.write(`\r  ${total} districts...`);
  }
  stats.districts = total;
  console.log(`\n  ${total} districts seeded`);
}

async function seedVillages() {
  console.log('[4/4] Villages...');
  const districts = await prisma.kecamatan.findMany();
  let total = 0;
  for (const kec of districts) {
    const data: Village[] = await fetchJson(`/villages/${kec.kode}.json`);
    for (const v of data) {
      try {
        await prisma.desa.upsert({
          where: { kecamatanId_kode: { kecamatanId: kec.id, kode: v.id } },
          update: { nama: v.name },
          create: { kecamatanId: kec.id, kode: v.id, nama: v.name },
        });
        total++;
      } catch { /* skip duplicates */
      }
    }
    if (total % 2000 === 0) process.stdout.write(`\r  ${total} villages...`);
  }
  stats.villages = total;
  console.log(`\n  ${total} villages seeded`);
}

async function main() {
  console.log('Indonesian Wilayah Seeder\n');
  console.log('Looking for working API source...');
  try {
    API_BASE = await findWorkingSource();
    console.log(`  Using: ${API_BASE}\n`);
  } catch {
    console.log('  No API source reachable. Seeding provinces only.\n');
    await seedProvinces();
    console.log('\n  Run again when API is available for full sync.');
    return;
  }

  const mode = process.argv.includes('--full') ? 'full' : 'provinces';
  if (mode === 'provinces') {
    await seedProvinces();
    console.log('\n  Done. Run with --full for all data.');
    return;
  }

  await seedProvinces();
  await seedRegencies();
  await seedDistricts();
  await seedVillages();

  console.log('\n======== SUMMARY ========');
  console.log(`  Provinces:  ${stats.provinces}`);
  console.log(`  Regencies:  ${stats.regencies}`);
  console.log(`  Districts:  ${stats.districts}`);
  console.log(`  Villages:  ${stats.villages}`);
  console.log('========================');
}

main().catch(console.error).finally(() => prisma.$disconnect());
