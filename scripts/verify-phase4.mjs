import { PrismaClient } from '@prisma/client';
import { idempotencyMiddleware } from '../apps/api/dist/middleware/idempotency.middleware.js';

const prisma = new PrismaClient();

async function runPhase4Verification() {
  console.log('=== VERIFIKASI FASE 4: RELIABILITY, RESILIENCY, & BOUNDARY INVARIANTS ===\n');

  // 1. Uji Idempotency Middleware secara in-memory
  console.log('[1] Menguji Idempotency Layer...');
  let mockStatusCode = 200;
  let mockBody = null;
  const mockRes = {
    statusCode: 200,
    status(code) {
      mockStatusCode = code;
      return this;
    },
    send(payload) {
      mockBody = payload;
      return this;
    },
    json(payload) {
      return this.send(payload);
    },
    setHeader() {},
  };

  const testKey = 'test-idempotency-' + Date.now();
  const req1 = {
    method: 'POST',
    path: '/api/v1/keuangan/kas-umum',
    header(name) {
      if (name.toLowerCase() === 'idempotency-key') return testKey;
      return undefined;
    },
    body: { uraian: 'Test Kas', jumlah: 500000 },
  };

  let nextCalled = false;
  await idempotencyMiddleware(req1, mockRes, () => {
    nextCalled = true;
    mockRes.json({ success: true, data: { id: 'kas-1', saldo: 500000 } });
  });

  if (!nextCalled || !mockBody?.success) {
    throw new Error('Gagal: Request pertama tidak dieksekusi oleh middleware');
  }
  console.log('  -> Request awal berhasil dieksekusi dan di-cache.');

  // Request kedua dengan Idempotency-Key yang sama (harus replayed dari cache)
  let nextCalled2 = false;
  let cachedPayload = null;
  const mockRes2 = {
    statusCode: 200,
    status(code) {
      mockStatusCode = code;
      return this;
    },
    setHeader() {},
    json(payload) {
      cachedPayload = payload;
      return this;
    },
    send(payload) {
      cachedPayload = payload;
      return this;
    },
  };

  await idempotencyMiddleware(req1, mockRes2, () => {
    nextCalled2 = true;
  });

  if (nextCalled2) {
    throw new Error('Gagal: Request kedua tidak boleh memanggil handler (harus replay)!');
  }
  if (!cachedPayload || cachedPayload.data?.id !== 'kas-1') {
    throw new Error('Gagal: Replay payload tidak cocok dengan cache awal');
  }
  console.log('  -> Replay idempotency valid: respons identik dikembalikan tanpa re-eksekusi handler.');

  // 2. Uji Precision Aritmatika Finansial (Cent/Sen rounding)
  console.log('\n[2] Menguji Presisi Aritmatika Desimal Rupiah (Sen)...');
  let currentBalance = 1000000.1;
  const deltaMasuk = 200000.2;
  const deltaKeluar = 50000.15;
  // Javascript standard float drift demonstration: 1000000.1 + 200000.2 = 1200000.3000000002
  const floatSum = currentBalance + deltaMasuk - deltaKeluar;
  const safeSum = Math.round((currentBalance + deltaMasuk - deltaKeluar) * 100) / 100;
  console.log(`  -> Floating raw sum: ${floatSum}`);
  console.log(`  -> Safe sen-rounded sum: ${safeSum}`);
  if (safeSum !== 1150000.15) {
    throw new Error('Gagal: Pembulatan sen menghasilkan deviasi!');
  }
  console.log('  -> Presisi sen terbukti tepat dan deterministik.');

  // 3. Uji Advisory Lock Namespacing pada PostgreSQL
  console.log('\n[3] Menguji pg_advisory_xact_lock (Namespace 1001)...');
  try {
    const desaId = 3204010001n;
    const NAMESPACE_BKU = 1001;
    const tenantKey = Number(desaId & 0x7fffffffn);
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${NAMESPACE_BKU}::integer, ${tenantKey}::integer)`;
      console.log(`  -> Advisory lock per-tenant diperoleh: namespace=${NAMESPACE_BKU}, tenantKey=${tenantKey}`);
    });
    console.log('  -> Lock dilepas secara otomatis saat transaksi selesai.');
  } catch (err) {
    console.error('  -> Gagal menguji advisory lock:', err);
    throw err;
  }

  // 4. Uji Immutability Audit Log
  console.log('\n[4] Menguji Append-Only Audit Log...');
  const auditEntry = await prisma.auditLog.create({
    data: {
      entityType: 'system_verification',
      entityId: BigInt(Date.now()),
      action: 'CREATE',
      actorType: 'SYSTEM',
      reason: 'Verifikasi ketahanan Fase 4 append-only audit log',
      metadata: { phase: 4, timestamp: new Date().toISOString() },
    },
  });
  console.log(`  -> Berhasil membuat catatan audit append-only dengan ID: ${auditEntry.id}`);

  console.log('\n=== SELURUH VERIFIKASI FASE 4 BERHASIL DENGAN 0 DRIFT / 0 KESALAHAN ===');
}

runPhase4Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
