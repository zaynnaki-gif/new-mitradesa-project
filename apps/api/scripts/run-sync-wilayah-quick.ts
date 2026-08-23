/**
 * Script untuk sync wilayah (tanpa Desa - lebih cepat)
 * Run: npx tsx scripts/run-sync-wilayah-quick.ts
 */

import { prisma } from '../src/services/prisma.js';

const EXTERNAL_API_BASE = 'https://emsifa.github.io/api-wilayah';

async function fetchJson<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  console.log('🚀 Quick Sync Wilayah (Provinsi, Kabupaten, Kecamatan)\n');

  // Sync Provinsi
  console.log('📍 Sync Provinsi...');
  const provinces = await fetchJson<{ id: string; name: string }>(`${EXTERNAL_API_BASE}/provinces.json`);
  for (const p of provinces) {
    await prisma.provinsi.upsert({
      where: { kode: p.id },
      update: { nama: p.name },
      create: { kode: p.id, nama: p.name },
    });
  }
  console.log(`   ✅ ${provinces.length} provinsi\n`);

  // Sync Kabupaten
  console.log('📍 Sync Kabupaten...');
  const allProvinces = await prisma.provinsi.findMany();
  let kabCount = 0;
  for (const prov of allProvinces) {
    const kabupatens = await fetchJson<{ id: string; province_id: string; name: string }>(
      `${EXTERNAL_API_BASE}/regencies/${prov.kode}.json`
    );
    for (const k of kabupatens) {
      await prisma.kabupaten.upsert({
        where: { provinsiId_kode: { provinsiId: prov.id, kode: k.id } },
        update: { nama: k.name },
        create: { provinsiId: prov.id, kode: k.id, nama: k.name },
      });
      kabCount++;
    }
  }
  console.log(`   ✅ ${kabCount} kabupaten\n`);

  // Sync Kecamatan
  console.log('📍 Sync Kecamatan...');
  const allKabupaten = await prisma.kabupaten.findMany();
  let kecCount = 0;
  for (const kab of allKabupaten) {
    const kecamatans = await fetchJson<{ id: string; regency_id: string; name: string }>(
      `${EXTERNAL_API_BASE}/districts/${kab.kode}.json`
    );
    for (const k of kecamatans) {
      await prisma.kecamatan.upsert({
        where: { kabupatenId_kode: { kabupatenId: kab.id, kode: k.id } },
        update: { nama: k.name },
        create: { kabupatenId: kab.id, kode: k.id, nama: k.name },
      });
      kecCount++;
    }
    console.log(`   ${kab.nama}: ${kecamatans.length} kecamatan`);
  }
  console.log(`   ✅ ${kecCount} kecamatan\n`);

  console.log('✅ Sync selesai!');

  const stats = await Promise.all([
    prisma.provinsi.count(),
    prisma.kabupaten.count(),
    prisma.kecamatan.count(),
    prisma.desa.count(),
  ]);

  console.log('\n📊 Database sekarang:');
  console.log(`   Provinsi:  ${stats[0]}`);
  console.log(`   Kabupaten: ${stats[1]}`);
  console.log(`   Kecamatan: ${stats[2]}`);
  console.log(`   Desa:     ${stats[3]}`);

  await prisma.$disconnect();
}

main().catch(console.error);
