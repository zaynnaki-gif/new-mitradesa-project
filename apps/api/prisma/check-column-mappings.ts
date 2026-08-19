import { PrismaClient } from '@prisma/client';

async function checkColumnMappings() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking column name mappings...\n');

    // Expected columns based on schema
    const expectedMappings = [
      // account table
      { table: 'account', field: 'password_hash', expected: 'password_hash' },

      // role table
      { table: 'role', field: 'role_code', expected: 'role_code' },

      // Other tables
      { table: 'permission', field: 'permission_code', expected: 'permission_code' },

      // wilayah
      { table: 'provinsi', field: 'kode', expected: 'kode' },
      { table: 'kabupaten', field: 'kode', expected: 'kode' },
      { table: 'kecamatan', field: 'kode', expected: 'kode' },
      { table: 'desa', field: 'kode', expected: 'kode' },

      // penduduk
      { table: 'penduduk', field: 'nama_lengkap', expected: 'nama_lengkap' },
      { table: 'penduduk', field: 'tempat_lahir', expected: 'tempat_lahir' },
      { table: 'penduduk', field: 'tanggal_lahir', expected: 'tanggal_lahir' },
      { table: 'penduduk', field: 'jenis_kelamin', expected: 'jenis_kelamin' },
      { table: 'penduduk', field: 'gol_darah', expected: 'gol_darah' },
      { table: 'penduduk', field: 'agama', expected: 'agama' },
      { table: 'penduduk', field: 'status_perkawinan', expected: 'status_perkawinan' },
      { table: 'penduduk', field: 'hubungan_keluarga', expected: 'hubungan_keluarga' },
      { table: 'penduduk', field: 'alamat', expected: 'alamat' },
      { table: 'penduduk', field: 'rt', expected: 'rt' },
      { table: 'penduduk', field: 'rw', expected: 'rw' },
      { table: 'penduduk', field: 'dusun', expected: 'dusun' },
      { table: 'penduduk', field: 'kode_pos', expected: 'kode_pos' },
      { table: 'penduduk', field: 'telepon', expected: 'telepon' },
      { table: 'penduduk', field: 'email', expected: 'email' },
      { table: 'penduduk', field: 'warga_negara', expected: 'warga_negara' },
      { table: 'penduduk', field: 'nik_ayah', expected: 'nik_ayah' },
      { table: 'penduduk', field: 'nik_ibu', expected: 'nik_ibu' },
      { table: 'penduduk', field: 'is_aktif', expected: 'is_aktif' },
      { table: 'penduduk', field: 'status_kepindahan', expected: 'status_kepindahan' },
      { table: 'penduduk', field: 'created_at', expected: 'created_at' },
      { table: 'penduduk', field: 'updated_at', expected: 'updated_at' },
      { table: 'penduduk', field: 'deleted_at', expected: 'deleted_at' },
      { table: 'penduduk', field: 'desa_id', expected: 'desa_id' },
    ];

    for (const { table, field, expected } of expectedMappings) {
      const result = await prisma.$queryRaw<any[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ${table}
        AND column_name = ${expected};
      `;
      const status = result.length > 0 ? '✓' : '✗';
      console.log(`${status} ${table}.${field}: ${result.length > 0 ? 'EXISTS' : 'MISSING'}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumnMappings();
