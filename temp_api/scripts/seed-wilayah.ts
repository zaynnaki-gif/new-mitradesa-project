#!/usr/bin/env node
/**
 * Seed Provinces and Sync All Wilayah Data
 *
 * Usage:
 *   npx tsx prisma/seed-wilayah.ts
 *
 * Fetches from:
 *   - Local JSON for provinces (provinces.json)
 *   - API for all other data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API = 'https://emsifa.github.io/api-wilayah';
const SEED_FILE = './prisma/seed/provinces.json';

interface Province { id: string; name: string }
interface Regency { id: string; province_id: string; name: string }
interface District { id: string; regency_id: string; name: string }
interface Village { id: string; district_id: string; name: string }

const stats = { provinces: 0, regencies: 0, districts: 0, villages: 0 };

async function fetch<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  HTTP ${res.status} for ${url}`);
      return [];
    }
    return res.json();
  } catch (e) {
    console.log(`  Network error: ${e}`);
    return [];
  }
}

async function seedProvinces(): Promise<void> {
  console.log('[1/4] Provinces...');
  const provinces: Province[] = require(API_FILE);

  for (const p of provinces) {
    await prisma.provinsi.upsert({
      where: { kode: p.id },
      update: { nama: p.name },
      create: { kode: p.id, nama: p.name },
    });
    stats.provinces++;
  }
  console.log(`  ${stats.provinces} provinces`);
}

async function seedRegencies(): Promise<void> {
  console.log('[2/4] Regencies...');
  const provinces = await prisma.provinsi.findMany();
  let done = 0;

  for (const prov of provinces) {
    const data: Regency[] = await fetch(`${API}/regencies/${prov.kode}.json`);
    for (const r of data) {
      await prisma.kabupaten.upsert({
        where: {provinsiId_kode: {provinsiId: prov.id, kode: r.id } },
        update: { nama: r.name },
        create: { provinsiId: prov.id, kode: r.id, nama: r.name },
      });
      done++;
    }
    process.stdout.write(`\r  ${prov.nama}: ${data.length} `);
  }
  stats.regencies = done;
  console.log(`\n  ${done} regencies`);
}

async function seedDistricts(): Promise<void> {
  console.log('[3/4] Districts...');
  const regencies = await prisma.kabupaten.findMany();
  let done = 0;

  for (const kab of regencies) {
    const data: District[] = await fetch(`${API}/districts/${kab.kode}.json`);
    for (const d of data) {
      await prisma.kecamatan.upsert({
        where: {kabupatenId_kode: {kabupatenId: kab.id, kode: d.id } },
        update: { nama: d.name },
        create: { kabupatenId: kab.id, kode: d.id, nama: d.name },
      });
      done++;
    }
    process.stdout.write(`\r  ${kab.nama}: ${data.length} `);
  }
  stats.districts = done;
  console.log(`\n  ${done} districts`);
}

async function seedVillages(): Promise<void> {
  console.log('[4/4] Villages...');
  const districts = await prisma.kecamatan.findMany();
  let done = 0;

  for (const kec of districts) {
    const data: Village[] = await fetch(`${API}/villages/${kec.kode}.json`);
    for (const v of data) {
      await prisma.desa.upsert({
        where: {kecamatanId_kode: {kecamatanId: kec.id, kode: v.id } },
        update: { nama: v.name },
        create: { kecamatanId: kec.id, kode: v.id, nama: v.name },
      });
      done++;
    }
    process.stdout.write(`\r  ${kec.nama}: ${data.length} `);
  }
  stats.villages = done;
  console.log(`\n  ${done} villages`);
}

async function main() {
  console.log('Indonesian Wilayah Seeder');
  console.log('');
  console.log('WARNING: This will sync ALL regions (~80,000 villages)');
  console.log('Expected time: 15-30 minutes depending on network');
  console.log('');

  const PROVINSI_FILE = './prisma/seed/provinces.json';

  try {
    await seedProvinces();
    console.log('');
    await seedRegencies();
    console.log('');
    await seedDistricts();
    console.log('');
    await seedVillages();

    console.log('');
    console.log('Done! Stats:', stats);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
