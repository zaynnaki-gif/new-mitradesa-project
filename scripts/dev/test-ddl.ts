/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDDL() {
  console.log('Menguji proteksi DDL dengan role desaku_app_readwrite (lewat DATABASE_URL)...\n');

  try {
    console.log('Mencoba menjalankan: ALTER TABLE "kategori" ADD COLUMN "test_col" VARCHAR(255);');
    await prisma.$executeRawUnsafe('ALTER TABLE "kategori" ADD COLUMN "test_col" VARCHAR(255);');
    console.log('❌ GAGAL: Perintah DDL berhasil dijalankan, artinya proteksi tidak bekerja!');
  } catch (error: any) {
    console.log('✅ BERHASIL DITOLAK: Perintah DDL gagal dijalankan sebagaimana mestinya.');
    console.log('--- Detail Error ---');
    console.log(error.message);
    console.log('--------------------');
  } finally {
    await prisma.$disconnect();
  }
}

testDDL();
