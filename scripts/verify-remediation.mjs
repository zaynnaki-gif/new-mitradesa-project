import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Testing MIS-07 / GAP-06 TTE Authorization & Signatory PIN ---');

  // Check penanda tangan table columns
  const signatories = await prisma.penandaTangan.findMany({ take: 3 });
  console.log(`Found ${signatories.length} signatories in DB.`);
  for (const s of signatories) {
    console.log(`- ID: ${s.id}, Nama: ${s.nama}, Jabatan: ${s.jabatan}, AccountId: ${s.accountId}, HasPinHash: ${!!s.pinHash}`);
  }

  // Check if sample account exists
  const account = await prisma.account.findFirst();
  console.log(`Sample account: ID ${account?.id}, Username: ${account?.username}`);

  console.log('--- Testing MIS-04 / GAP-04 Mutasi LAHIR / PINDAH_DATANG ---');
  const sampleMutasi = await prisma.mutasiPenduduk.findFirst({
    where: { jenisMutasi: { in: ['LAHIR', 'PINDAH_DATANG'] } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Latest LAHIR/PINDAH_DATANG mutasi in DB:', sampleMutasi ? `${sampleMutasi.jenisMutasi} - ${sampleMutasi.namaLengkap}` : 'None recorded yet');

  console.log('--- Testing MIS-05 / GAP-03 Saran Aduan Public Route Ready ---');
  const saranCount = await prisma.saranAduan.count();
  console.log(`Total saran/aduan in DB: ${saranCount}`);

  await prisma.$disconnect();
}

run().catch(console.error);
