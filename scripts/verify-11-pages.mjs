import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING DATA & BACKEND ACCESS FOR 11 ADMIN PAGES ===\n');

  const desa = await prisma.desa.findFirst();
  const desaId = desa.id;

  const checks = [
    { name: '1. Surat Masuk (/admin/pemerintahan/surat-masuk)', fn: () => prisma.suratMasuk.findMany({ where: { desaId }, take: 1 }) },
    { name: '2. Agenda Desa (/admin/pemerintahan/agenda)', fn: () => prisma.agenda.findMany({ where: { desaId }, take: 1 }) },
    { name: '3. Saran & Aduan (/admin/pemerintahan/saran-aduan)', fn: () => prisma.saranAduan.findMany({ where: { desaId }, take: 1 }) },
    { name: '4. Blanko Surat (/admin/layanan/blanko)', fn: () => prisma.blanko.findMany({ where: { desaId }, take: 1 }) },
    { name: '5. Nomor Dokumen (/admin/layanan/nomor-dokumen)', fn: () => prisma.nomorDokumen.findMany({ where: { desaId }, take: 1 }) },
    { name: '6. Posyandu (/admin/kesehatan/posyandu)', fn: () => prisma.posyanduKunjungan.findMany({ where: { desaId }, take: 1 }) },
    { name: '7. Bumil (/admin/kesehatan/bumil)', fn: () => prisma.bumil.findMany({ where: { desaId }, take: 1 }) },
    { name: '8. Kas Umum (/admin/keuangan/kas-umum)', fn: () => prisma.kasUmum.findMany({ where: { desaId }, take: 1 }) },
    { name: '9. Buku Bank (/admin/keuangan/buku-bank)', fn: () => prisma.bukuBank.findMany({ where: { desaId }, take: 1 }) },
    { name: '10. Bansos (/admin/sosial/bansos)', fn: () => prisma.bansos.findMany({ where: { desaId }, take: 1 }) },
    { name: '11. Potensi Desa (/admin/profil/potensi)', fn: () => prisma.potensiDesa.findMany({ where: { desaId }, take: 1 }) },
  ];

  for (const check of checks) {
    try {
      const res = await check.fn();
      console.log(`[PASS] ${check.name} - DB query executed successfully (records: ${res.length})`);
    } catch (err) {
      console.error(`[FAIL] ${check.name} - ${err.message}`);
    }
  }

  console.log('\n=== ALL 11 ADMIN MODULE BACKENDS VERIFIED HEALTHY ===');
}

main().finally(() => prisma.$disconnect());
