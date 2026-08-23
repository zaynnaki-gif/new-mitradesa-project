/**
 * Script untuk sync wilayah dari unpkg/wilayah-indonesia
 * Run: npx tsx scripts/run-sync-wilayah.ts
 */

import { prisma } from '../src/services/prisma.js';

const API_BASE = 'https://unpkg.com/wilayah-indonesia@1.0.2/data';

interface Prov {
  kode: { id_provinsi: number };
  provinsi: string;
}

interface Kota {
  kode: { id_provinsi: number; id_kota: number };
  kota: string;
  provinsi: string;
}

interface Kecamatan {
  kode: { id_provinsi: number; id_kota: number; id_kecamatan: number };
  kecamatan: string;
  kota: string;
  provinsi: string;
}

interface Kelurahan {
  kode: { id_provinsi: number; id_kota: number; id_kecamatan: number; id_kelurahan: number };
  kelurahan: string;
  kode_pos: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
}

async function fetchJson<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

// Helper: format kode with leading zeros
function fmtProv(prov: number) { return prov.toString().padStart(2, '0'); }
function fmtKota(kota: number) { return kota.toString().padStart(2, '0'); }
function fmtKec(kec: number) { return kec.toString().padStart(2, '0'); }
function fmtDes(d: number) { return d.toString().padStart(4, '0'); }

async function main() {
  console.log('🚀 Sync Wilayah Indonesia dari unpkg/wilayah-indonesia\n');

  // ========== SYNC PROVINSI ==========
  console.log('📍 Sync Provinsi...');
  const provData = await fetchJson<Prov>(`${API_BASE}/provinsi.json`);
  console.log(`   Total: ${provData.length} provinsi`);

  // Build maps for fast lookup
  const provMap = new Map<number, { id: bigint; kode: string }>();

  for (const p of provData) {
    const kode = fmtProv(p.kode.id_provinsi);
    const result = await prisma.provinsi.upsert({
      where: { kode },
      update: { nama: p.provinsi },
      create: { kode, nama: p.provinsi },
    });
    provMap.set(p.kode.id_provinsi, { id: result.id, kode });
  }
  console.log(`   ✅ ${provMap.size} provinsi synced\n`);

  // ========== SYNC KOTA/KABUPATEN ==========
  console.log('📍 Sync Kota/Kabupaten...');
  const kotaData = await fetchJson<Kota>(`${API_BASE}/kota.json`);
  console.log(`   Total: ${kotaData.length} kota`);

  const kabMap = new Map<string, { id: bigint; kode: string }>();

  for (const k of kotaData) {
    const kode = `${fmtProv(k.kode.id_provinsi)}.${fmtKota(k.kode.id_kota)}`;
    const prov = provMap.get(k.kode.id_provinsi);
    if (!prov) {
      console.warn(`   ⚠️ Provinsi ${k.kode.id_provinsi} tidak ditemukan`);
      continue;
    }

    const result = await prisma.kabupaten.upsert({
      where: { provinsiId_kode: { provinsiId: prov.id, kode } },
      update: { nama: k.kota },
      create: { provinsiId: prov.id, kode, nama: k.kota },
    });
    kabMap.set(`${k.kode.id_provinsi}.${k.kode.id_kota}`, { id: result.id, kode });
  }
  console.log(`   ✅ ${kabMap.size} kota/kabupaten synced\n`);

  // ========== SYNC KECAMATAN ==========
  console.log('📍 Sync Kecamatan...');
  const kecData = await fetchJson<Kecamatan>(`${API_BASE}/kecamatan.json`);
  console.log(`   Total: ${kecData.length} kecamatan`);

  const kecMap = new Map<string, { id: bigint; kode: string }>();
  let kecCount = 0;

  for (const k of kecData) {
    const kab = kabMap.get(`${k.kode.id_provinsi}.${k.kode.id_kota}`);
    if (!kab) continue;

    const kode = `${kab.kode}.${fmtKec(k.kode.id_kecamatan)}`;
    const result = await prisma.kecamatan.upsert({
      where: { kabupatenId_kode: { kabupatenId: kab.id, kode } },
      update: { nama: k.kecamatan },
      create: { kabupatenId: kab.id, kode, nama: k.kecamatan },
    });
    kecMap.set(`${k.kode.id_provinsi}.${k.kode.id_kota}.${k.kode.id_kecamatan}`, { id: result.id, kode });
    kecCount++;

    if (kecCount % 1000 === 0) {
      console.log(`   Progress: ${kecCount}/${kecData.length}`);
    }
  }
  console.log(`   ✅ ${kecCount} kecamatan synced\n`);

  // ========== SYNC DESA/KELURAHAN ==========
  console.log('📍 Sync Desa/Kelurahan...');
  const desData = await fetchJson<Kelurahan>(`${API_BASE}/kelurahan.json`);
  console.log(`   Total: ${desData.length} kelurahan`);

  let desCount = 0;
  let skipCount = 0;

  for (let i = 0; i < desData.length; i++) {
    const d = desData[i];
    const kec = kecMap.get(`${d.kode.id_provinsi}.${d.kode.id_kota}.${d.kode.id_kecamatan}`);
    if (!kec) {
      skipCount++;
      continue;
    }

    const kode = `${kec.kode}.${fmtDes(d.kode.id_kelurahan)}`;
    await prisma.desa.upsert({
      where: { kecamatanId_kode: { kecamatanId: kec.id, kode } },
      update: { nama: d.kelurahan },
      create: { kecamatanId: kec.id, kode, nama: d.kelurahan },
    });
    desCount++;

    if (desCount % 5000 === 0) {
      console.log(`   Progress: ${desCount}/${desData.length} (${skipCount} skipped)`);
    }
  }
  console.log(`   ✅ ${desCount} desa/kelurahan synced (${skipCount} skipped)\n`);

  // ========== FINAL STATS ==========
  console.log('📊 Database Stats:');
  const stats = await Promise.all([
    prisma.provinsi.count(),
    prisma.kabupaten.count(),
    prisma.kecamatan.count(),
    prisma.desa.count(),
  ]);

  console.log(`   Provinsi:   ${stats[0]}`);
  console.log(`   Kabupaten:  ${stats[1]}`);
  console.log(`   Kecamatan: ${stats[2]}`);
  console.log(`   Desa:      ${stats[3]}`);

  console.log('\n✅ Sync selesai!');
  await prisma.$disconnect();
}

main().catch(console.error);
