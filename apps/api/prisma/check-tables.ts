import { PrismaClient } from '@prisma/client';

async function checkTables() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking if reference tables exist in database...\n');

    const tablesToCheck = [
      'ref_agama',
      'ref_gol_darah',
      'ref_status_perkawinan',
      'ref_hubungan_keluarga',
      'ref_status_kependudukan',
      'ref_pendidikan',
      'ref_pekerjaan',
      'ref_jabatan_perangkat',
      'ref_status_perangkat',
      'penduduk',
      'keluarga',
      'anggota_keluarga',
      'perangkat_desa',
      'account',
      'role',
      'permission',
      'provinsi',
      'kabupaten',
      'kecamatan',
      'desa',
      'identitas_desa',
      'audit_log',
      'configuration'
    ];

    for (const table of tablesToCheck) {
      const result = await prisma.$queryRaw<any[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        ) as exists;
      `;
      console.log(`${table}: ${result[0].exists ? 'EXISTS' : 'MISSING'}`);
    }

    // List ALL tables
    console.log('\n--- All tables in public schema ---');
    const allTables = await prisma.$queryRaw<any[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log(allTables.map(t => t.table_name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
