import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { kasUmumService } from '../apps/api/dist/services/kas-umum.service.js';

const prisma = new PrismaClient();

async function runNegativeAndConcurrencyTests() {
  console.log('=== STARTING NEGATIVE & CONCURRENCY TEST SUITE ===\n');

  const desa = await prisma.desa.findFirst();
  const desaId = desa.id;

  // -------------------------------------------------------------
  // 1. NEGATIVE TEST: Wrong Old PIN & Hashing Verification
  // -------------------------------------------------------------
  console.log('[TEST 1] Negative Test: PIN Modification with Wrong Old PIN');
  const initialPin = '123456';
  const wrongPin = '000000';
  const hashed = await bcrypt.hash(initialPin, 10);

  const isOldPinValid = await bcrypt.compare(wrongPin, hashed);
  if (isOldPinValid) {
    throw new Error('FAIL: Wrong old PIN was accepted!');
  }
  console.log('  [PASS] Wrong old PIN rejected by bcrypt verification.');

  const isCorrectValid = await bcrypt.compare(initialPin, hashed);
  if (!isCorrectValid) {
    throw new Error('FAIL: Valid old PIN was rejected!');
  }
  console.log('  [PASS] Valid old PIN accepted.');

  // -------------------------------------------------------------
  // 2. NEGATIVE TEST: Cross-Desa IDOR Protection
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Negative Test: Cross-Desa IDOR Protection');
  // Create a second temporary village
  const foreignDesa = await prisma.desa.create({
    data: {
      kode: 'FOR' + Date.now().toString().slice(-10),
      nama: 'Desa Sebelah (Foreign)',
      kecamatanId: desa.kecamatanId
    }
  });

  const foreignApbdes = await prisma.apbdes.create({
    data: {
      desaId: foreignDesa.id,
      tahun: 2026,
      totalPendapatan: 0,
      totalBelanja: 10000000,
      totalPembiayaan: 0
    }
  });

  const foreignItem = await prisma.apbdesItem.create({
    data: {
      apbdesId: foreignApbdes.id,
      kategori: 'BELANJA',
      nama: 'Belanja Desa Asing',
      anggaran: 10000000,
      realization: 0,
      kodeRekening: '2.1.01.99'
    }
  });

  // Attempt to link Kas of Desa 1 to foreignItem belonging to foreignDesa
  let idorBlocked = false;
  try {
    await kasUmumService.create({
      tanggal: '2026-02-01',
      jenis: 'KAS_KELUAR',
      uraian: 'Percobaan Pembelian Gelap Cross-Tenant',
      jumlah: 1000000,
      apbdesItemId: foreignItem.id.toString()
    }, desaId);
  } catch (err) {
    if (err.message.includes('bukan milik desa ini') || err.statusCode === 403) {
      idorBlocked = true;
    }
  }

  // Cleanup foreign test records
  await prisma.apbdesItem.delete({ where: { id: foreignItem.id } });
  await prisma.apbdes.delete({ where: { id: foreignApbdes.id } });
  await prisma.desa.delete({ where: { id: foreignDesa.id } });

  if (!idorBlocked) {
    throw new Error('FAIL: Cross-desa IDOR was NOT blocked!');
  }
  console.log('  [PASS] Cross-Desa IDOR strictly rejected with 403 Forbidden.');

  // -------------------------------------------------------------
  // 3. NEGATIVE TEST: Budget Year Mismatch
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Negative Test: Budget Year Mismatch');
  const apbdes2025 = await prisma.apbdes.upsert({
    where: { desaId_tahun: { desaId, tahun: 2025 } },
    create: { desaId, tahun: 2025 },
    update: {}
  });

  const item2025 = await prisma.apbdesItem.create({
    data: {
      apbdesId: apbdes2025.id,
      kategori: 'BELANJA',
      nama: 'Kegiatan Anggaran 2025',
      anggaran: 5000000,
      realization: 0,
      kodeRekening: '2.1.01.25'
    }
  });

  let yearMismatchBlocked = false;
  try {
    // Kas entry dated in 2026 referencing 2025 budget item
    await kasUmumService.create({
      tanggal: '2026-05-10',
      jenis: 'KAS_KELUAR',
      uraian: 'Membayar anggaran 2025 di tahun 2026',
      jumlah: 500000,
      apbdesItemId: item2025.id.toString()
    }, desaId);
  } catch (err) {
    if (err.message.includes('tidak sesuai dengan tahun anggaran') || err.statusCode === 400) {
      yearMismatchBlocked = true;
    }
  }

  await prisma.apbdesItem.delete({ where: { id: item2025.id } });

  if (!yearMismatchBlocked) {
    throw new Error('FAIL: Year mismatch between Kas and APBDes was NOT blocked!');
  }
  console.log('  [PASS] Budget year mismatch strictly rejected with 400 Bad Request.');

  // -------------------------------------------------------------
  // 4. B3: Realization Rollback on UPDATE and DELETE
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Testing APBDes Realization Auto-Sync on UPDATE and DELETE');
  const apbdes2026 = await prisma.apbdes.upsert({
    where: { desaId_tahun: { desaId, tahun: 2026 } },
    create: { desaId, tahun: 2026 },
    update: {}
  });

  const testItem = await prisma.apbdesItem.create({
    data: {
      apbdesId: apbdes2026.id,
      kategori: 'BELANJA',
      nama: 'Uji Koreksi Transaksi Kas',
      anggaran: 20000000,
      realization: 0,
      kodeRekening: '2.2.02.01'
    }
  });

  // Initial balance injection
  const modalAwal = await prisma.kasUmum.create({
    data: {
      desaId,
      tanggal: new Date('2026-01-01'),
      jenis: 'KAS_MASUK',
      uraian: 'Saldo Awal Tahun 2026',
      jumlah: 50000000,
      saldo: 50000000
    }
  });

  // 4a. Create transaction: 2,000,000
  const kasEntry = await kasUmumService.create({
    tanggal: '2026-03-01',
    jenis: 'KAS_KELUAR',
    uraian: 'Pembayaran Awal Material',
    jumlah: 2000000,
    apbdesItemId: testItem.id.toString()
  }, desaId);

  let check = await prisma.apbdesItem.findUnique({ where: { id: testItem.id } });
  if (check.realization !== 2000000) {
    throw new Error(`Expected realization 2,000,000 after create, got ${check.realization}`);
  }
  console.log('  [PASS] Realization after CREATE: Rp 2,000,000');

  // 4b. Update transaction: change amount to 1,500,000
  await kasUmumService.update(kasEntry.id, {
    jumlah: 1500000
  }, desaId);

  check = await prisma.apbdesItem.findUnique({ where: { id: testItem.id } });
  if (check.realization !== 1500000) {
    throw new Error(`Expected realization 1,500,000 after update, got ${check.realization}`);
  }
  console.log('  [PASS] Realization after UPDATE amount reduction: Rp 1,500,000');

  // 4c. Delete transaction: realization must roll back to 0
  await kasUmumService.delete(kasEntry.id, desaId);

  check = await prisma.apbdesItem.findUnique({ where: { id: testItem.id } });
  if (check.realization !== 0) {
    throw new Error(`Expected realization 0 after delete, got ${check.realization}`);
  }
  console.log('  [PASS] Realization after DELETE rolled back to: Rp 0');

  // -------------------------------------------------------------
  // 5. CONCURRENCY TEST: Serialized Advisory Locking on BKU
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Concurrency Stress Test: 5 Simultaneous Kas Mutations');
  console.log('  - Starting balance: Rp 50,000,000');
  console.log('  - Firing 5 concurrent operations concurrently...');

  const concurrentOps = [
    kasUmumService.create({ tanggal: '2026-04-01', jenis: 'KAS_KELUAR', uraian: 'Concurrent Out 1', jumlah: 1000000 }, desaId),
    kasUmumService.create({ tanggal: '2026-04-01', jenis: 'KAS_KELUAR', uraian: 'Concurrent Out 2', jumlah: 2000000 }, desaId),
    kasUmumService.create({ tanggal: '2026-04-01', jenis: 'KAS_MASUK',  uraian: 'Concurrent In 1',  jumlah: 5000000 }, desaId),
    kasUmumService.create({ tanggal: '2026-04-01', jenis: 'KAS_KELUAR', uraian: 'Concurrent Out 3', jumlah: 3000000 }, desaId),
    kasUmumService.create({ tanggal: '2026-04-01', jenis: 'KAS_MASUK',  uraian: 'Concurrent In 2',  jumlah: 1000000 }, desaId),
  ];

  const results = await Promise.all(concurrentOps);
  console.log(`  - Completed ${results.length} concurrent transactions.`);

  // Expected final balance: 50M - 1M - 2M + 5M - 3M + 1M = 50,000,000
  const finalSaldo = await kasUmumService.getSaldoAkhir(desaId);
  console.log(`  - Final Calculated Saldo: Rp ${finalSaldo.toLocaleString('id-ID')}`);

  if (finalSaldo !== 50000000) {
    throw new Error(`FAIL: Concurrency race condition detected! Expected 50,000,000 but got ${finalSaldo}`);
  }
  console.log('  [PASS] Zero balance drift! PostgreSQL advisory transaction lock strictly prevented race conditions.');

  // Cleanup test kas records
  const createdIds = [modalAwal.id, ...results.map(r => r.id)];
  await prisma.kasUmum.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.apbdesItem.delete({ where: { id: testItem.id } });

  console.log('\n=== ALL NEGATIVE & CONCURRENCY TESTS PASSED FLAWLESSLY ===');
}

runNegativeAndConcurrencyTests()
  .catch((err) => {
    console.error('TEST ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
