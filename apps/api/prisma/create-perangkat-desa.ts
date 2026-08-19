import { PrismaClient } from '@prisma/client';

async function createPerangkatDesa() {
  const prisma = new PrismaClient();

  try {
    console.log('Creating perangkat_desa table based on schema.prisma...\n');

    // Create the table
    const createSql = `
      CREATE TABLE "perangkat_desa" (
        "id" BIGSERIAL NOT NULL,
        "penduduk_id" BIGINT NOT NULL,
        "desa_id" BIGINT NOT NULL,
        "jabatan" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'AKTIF',
        "foto_url" VARCHAR(500),
        "account_id" BIGINT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "perangkat_desa_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "perangkat_desa_penduduk_id_fkey" FOREIGN KEY ("penduduk_id") REFERENCES "penduduk" ("id") ON DELETE RESTRICT NOT DEFERRABLE,
        CONSTRAINT "perangkat_desa_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa" ("id") ON DELETE RESTRICT NOT DEFERRABLE,
        CONSTRAINT "perangkat_desa_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("id") ON DELETE SET NULL NOT DEFERRABLE,
        CONSTRAINT "perangkat_desa_account_id_key" UNIQUE ("account_id")
      );

      CREATE INDEX "perangkat_desa_penduduk_id_idx" ON "perangkat_desa"("penduduk_id");
      CREATE INDEX "perangkat_desa_desa_id_idx" ON "perangkat_desa"("desa_id");
      CREATE INDEX "perangkat_desa_jabatan_idx" ON "perangkat_desa"("jabatan");
      CREATE INDEX "perangkat_desa_status_idx" ON "perangkat_desa"("status");
    `;

    // Split and execute statements
    const statements = createSql.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await prisma.$executeRawUnsafe(stmt);
      }
    }

    console.log('Created perangkat_desa table!');

    // Verify
    const exists = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'perangkat_desa'
      ) as exists;
    `;
    console.log('perangkat_desa exists:', exists[0].exists);

  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('perangkat_desa table already exists');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createPerangkatDesa();
