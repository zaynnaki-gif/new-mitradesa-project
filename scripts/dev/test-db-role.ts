/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDomains() {
  console.log('Memulai pengujian role desaku_app_readwrite...\n');

  try {
    // Test 1: Domain CMS (Kategori)
    console.log('--- TEST 1: DOMAIN CMS (Kategori) ---');
    const newKategori = await prisma.kategori.create({
      data: {
        nama: 'Kategori Test Role',
        slug: 'kategori-test-role-' + Date.now(),
        deskripsi: 'Testing create with readwrite role'
      }
    });
    console.log('[CREATE] Success:', newKategori.nama);
    
    const getKategori = await prisma.kategori.findUnique({
      where: { id: newKategori.id }
    });
    console.log('[GET] Success:', getKategori?.nama);

    // Test 2: Domain Profil (Lembaga)
    console.log('\n--- TEST 2: DOMAIN PROFIL (Lembaga) ---');
    const newLembaga = await prisma.lembaga.create({
      data: {
        jenis: 'TEST',
        nama: 'Lembaga Test Role ' + Date.now(),
        deskripsi: 'Testing create with readwrite role'
      }
    });
    console.log('[CREATE] Success:', newLembaga.nama);
    
    const getLembaga = await prisma.lembaga.findUnique({
      where: { id: newLembaga.id }
    });
    console.log('[GET] Success:', getLembaga?.nama);

    // Test 3: Domain Wilayah (Gubug)
    console.log('\n--- TEST 3: DOMAIN WILAYAH (Gubug) ---');
    const newGubug = await prisma.gubug.create({
      data: {
        kode: 'GBG-' + Date.now().toString().slice(-4),
        nama: 'Gubug Test Role'
      }
    });
    console.log('[CREATE] Success:', newGubug.nama);
    
    const getGubug = await prisma.gubug.findUnique({
      where: { id: newGubug.id }
    });
    console.log('[GET] Success:', getGubug?.nama);

    console.log('\n✅ Semua pengujian DML CREATE dan GET berhasil. Role berfungsi normal.');
  } catch (error) {
    console.error('\n❌ Pengujian gagal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDomains();
