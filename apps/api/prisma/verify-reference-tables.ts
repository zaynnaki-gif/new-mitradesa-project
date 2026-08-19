import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRaw<{table_name: string}[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'ref_agama',
        'ref_gol_darah',
        'ref_status_perkawinan',
        'ref_hubungan_keluarga',
        'ref_status_kependudukan',
        'ref_pendidikan',
        'ref_pekerjaan',
        'ref_jabatan_perangkat',
        'ref_status_perangkat'
      )
    ORDER BY table_name;
  `;

  console.log("REFERENCE TABLES:");
  console.table(tables);

  console.log(`FOUND: ${tables.length}/9`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
