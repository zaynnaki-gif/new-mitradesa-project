import { PrismaClient } from '@prisma/client';
import { permintaanLayananService } from './apps/api/src/services/permintaan-layanan.service.ts';
import { documentEngineService } from './apps/api/src/services/document-engine.service.ts';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Starting E2E Persuratan Flow ---');

  // 1. Setup a dummy Penduduk and Layanan if not exists
  let layanan = await prisma.layanan.findFirst({
    where: { isActive: true },
    include: { dokumen: { include: { templates: { include: { versions: true } } } } }
  });

  if (!layanan) {
    console.error('No active Layanan found. Please seed the database.');
    return;
  }

  // Find a Penduduk
  let penduduk = await prisma.penduduk.findFirst();
  if (!penduduk) {
    console.log('No Penduduk found. Creating a dummy Penduduk...');
    penduduk = await prisma.penduduk.create({
      data: {
        nik: '1234567890123456',
        namaLengkap: 'Dummy Penduduk',
        tempatLahir: 'Jakarta',
        tanggalLahir: new Date('1990-01-01'),
        jenisKelamin: 'L',
        agama: 'Islam',
        pendidikan: 'S1',
        pekerjaan: 'Wiraswasta',
        statusPerkawinan: 'Kawin',
        wargaNegara: 'WNI',
        alamat: 'Dummy Address',
        isAktif: true
      }
    });
  }

  console.log(`Using Penduduk: ${penduduk.namaLengkap} (${penduduk.nik})`);
  console.log(`Using Layanan: ${layanan.nama}`);

  // Create a PermintaanLayanan manually to start
  const request = await prisma.permintaanLayanan.create({
    data: {
      nomorPermintaan: `REQ-E2E-${Date.now()}`,
      pendudukId: penduduk.id,
      layananId: layanan.id,
      status: 'DRAFT',
      dataJson: { tujuan: 'Testing E2E' },
    }
  });

  console.log(`\n[1] Created PermintaanLayanan ID: ${request.id} (Status: DRAFT)`);

  // Simulate Actor ID
  const actorId = BigInt(1);

  // 2. Submit
  const submitted = await permintaanLayananService.submit(request.id, actorId);
  console.log(`[2] Submitted -> Status: ${submitted.status}`);

  // 3. Verify
  const verified = await permintaanLayananService.updateStatus(request.id, { status: 'VERIFICATION' }, actorId);
  console.log(`[3] Verified -> Status: ${verified.status}`);

  // 4. Process (Optional, but let's do it)
  const processed = await permintaanLayananService.updateStatus(request.id, { status: 'PROCESSING' }, actorId);
  console.log(`[4] Processing -> Status: ${processed.status}`);

  // 5. Approve & Generate Document
  const approved = await permintaanLayananService.updateStatus(request.id, { status: 'APPROVED' }, actorId);
  console.log(`[5] Approved -> Status: ${approved.status}`);

  try {
    console.log(`[5.1] Generating Document...`);
    const docResult = await documentEngineService.generateDocumentForPermintaan(request.id);
    console.log(`      Document Generated Successfully! Nomor: ${docResult.nomorDokumen}, Token: ${docResult.verificationToken}`);
    console.log(`      WA notification is triggered non-blocking inside generateDocument.`);
  } catch (err) {
    console.error('Error generating document:', err);
  }

  // Cleanup
  await prisma.permintaanLayanan.delete({ where: { id: request.id } });
  console.log('\n--- Test Completed and Cleaned Up ---');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
