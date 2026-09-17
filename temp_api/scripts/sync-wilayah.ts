#!/usr/bin/env node
/**
 * CLI Script: Sync Wilayah Data dari API Eksternal
 *
 * Usage:
 *   npx tsx scripts/sync-wilayah.ts
 *
 * API Sources:
 *   1. https://cdn.jsdelivr.net/npm/regions-indonesia-data
 *   2. https://irvanfarih.my.id/api
 *   3. https://your-json-bin.url (custom)
 */

// @ts-ignore
const https = require('https');
// @ts-ignore
const http = require('http');
// @ts-ignore
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// API endpoints (multiple sources for fallback)
const API_SOURCES = [
  {
    name: 'CDN jsdelivr regions-indonesia-data',
    getProvinces: () => fetchJson('https://cdn.jsdelivr.net/npm/regions-indonesia-data@1.0.0/provinces.json'),
    getRegencies: (provinceId: string) => fetchJson(`https://cdn.jsdelivr.net/npm/regions-indonesia-data@1.0.0/regencies/${provinceId}.json`),
    getDistricts: (regencyId: string) => fetchJson(`https://cdn.jsdelivr.net/npm/regions-indonesia-data@1.0.0/districts/${regencyId}.json`),
    getVillages: (districtId: string) => fetchJson(`https://cdn.jsdelivr.net/npm/regions-indonesia-data@1.0.0/villages/${districtId}.json`),
  },
];

// Helper to fetch JSON via https
function fetchJson(url: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    console.log(`  Fetching: ${url}`);
    https.get(url, (res: any) => {
      if (res.statusCode === 404) {
        console.log(`  Not found: ${url}`);
        resolve([]);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(Array.isArray(json) ? json : []);
        } catch (e) {
          console.error(`  Parse error for ${url}:`, e.message);
          resolve([]);
        }
      });
    }).on('error', (e: Error) => {
      console.error(`  Network error for ${url}:`, e.message);
      resolve([]);
    });
  });
}

interface SyncStats {
  provinces: number;
  regencies: number;
  districts: number;
  villages: number;
}

const stats: SyncStats = { provinces: 0, regencies: 0, districts: 0, villages: 0 };

async function syncProvinces(): Promise<void> {
  console.log('[1/4] Provinces...');

  // Fetch from source
  const provinces = await API_SOURCES[0].getProvinces();
  console.log(`  Found ${provinces.length} provinces`);

  for (const prov of provinces) {
    try {
      await prisma.provinsi.upsert({
        where: { kode: prov.id },
        update: { nama: prov.name },
        create: { kode: prov.id, nama: prov.name },
      });
      stats.provinces++;
    } catch (e) {
      console.error(`  Error:`, e);
    }
  }
  console.log(`  Synced ${stats.provinces} provinces`);
}

async function syncRegencies(): Promise<void> {
  console.log('[2/4] Regencies...');

  const provinces = await prisma.provinsi.findMany();
  let synced = 0;

  for (const prov of provinces) {
    try {
      const regencies = await API_SOURCES[0].getRegencies(prov.kode);
      for (const kab of regencies) {
        try {
          await prisma.kabupaten.upsert({
            where: { provinsiId_kode: { provinsiId: prov.id, kode: kab.id } },
            update: { nama: kab.name },
            create: { provinsiId: prov.id, kode: kab.id, nama: kab.name },
          });
          synced++;
        } catch (e) {
          console.error(`    Error:`, e.message);
        }
      }
      console.log(`  ${prov.nama}: ${regencies.length} regencies`);
    } catch (e) {
      console.error(`  Error fetching regencies:`, e.message);
    }
  }

  stats.regencies = synced;
  console.log(`  Synced ${synced} regencies`);
}

async function syncDistricts(): Promise<void> {
  console.log('[3/4] Districts...');

  const regencies = await prisma.kabupaten.findMany();
  let synced = 0;

  for (const kab of regencies) {
    try {
      const districts = await API_SOURCES[0].getDistricts(kab.kode);
      for (const kec of districts) {
        try {
          await prisma.kecamatan.upsert({
            where: { kabupatenId_kode: { kabupatenId: kab.id, kode: kec.id } },
            update: { nama: kec.name },
            create: { kabupatenId: kab.id, kode: kec.id, nama: kec.name },
          });
          synced++;
        } catch (e) {
          console.error(`    Error:`, e.message);
        }
      }
      if (synced % 500 === 0) console.log(`  Progress: ${synced} districts...`);
    } catch (e) {
      console.error(`  Error fetching districts:`, e.message);
    }
  }

  stats.districts = synced;
  console.log(`  Synced ${synced} districts`);
}

async function syncVillages(): Promise<void> {
  console.log('[4/4] Villages...');

  const districts = await prisma.kecamatan.findMany();
  let synced = 0;

  for (const kec of districts) {
    try {
      const villages = await API_SOURCES[0].getVillages(kec.kode);
      for (const des of villages) {
        try {
          await prisma.desa.upsert({
            where: { kecamatanId_kode: { kecamatanId: kec.id, kode: des.id } },
            update: { nama: des.name },
            create: { kecamatanId: kec.id, kode: des.id, nama: des.name },
          });
          synced++;
        } catch (e) {
          // Skip duplicates silently
        }
      }
      if (synced % 1000 === 0) console.log(`  Progress: ${synced} villages...`);
    } catch (e) {
      console.error(`  Error fetching villages:`, e.message);
    }
  }

  stats.villages = synced;
  console.log(`  Synced ${synced} villages`);
}

async function main() {
  console.log('===========================================');
  console.log('WILAYAH SYNC - Indonesian Region Data');
  console.log('===========================================');
  console.log('');

  const confirm = process.argv.includes('--yes') || process.argv.includes('-y');
  if (!confirm) {
    console.log('WARNING: This will sync ALL Indonesian regions');
    console.log('Use --yes to skip confirmation');
    console.log('');
    process.stdout.write('Continue? (y/N): ');
    const readline = await new Promise(resolve => {
      process.stdin.once('data', d => resolve(d.toString().trim()));
    });
    if (readline.toLowerCase() !== 'y') {
      console.log('Aborted.');
      return;
    }
  }

  console.log('');

  try {
    await syncProvinces();
    console.log('');
    await syncRegencies();
    console.log('');
    await syncDistricts();
    console.log('');
    await syncVillages();
    console.log('');

    console.log('===========================================');
    console.log('SYNC COMPLETE');
    console.log('===========================================');
    console.log(`  Provinces:   ${stats.provinces}`);
    console.log(`  Regencies:    ${stats.regencies}`);
    console.log(`  Districts:    ${stats.districts}`);
    console.log(`  Villages:     ${stats.villages}`);
    console.log('===========================================');
  } catch (e) {
    console.error('Sync failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
