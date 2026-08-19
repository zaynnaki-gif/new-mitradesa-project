import { PrismaClient } from '@prisma/client';

async function applyPerangkatDesaManually() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking perangkat_desa table...\n');

    // Check if table exists
    const exists = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'perangkat_desa'
      ) as exists;
    `;
    console.log('perangkat_desa exists:', exists[0].exists);

    if (!exists[0].exists) {
      console.log('\nCreating perangkat_desa table...');

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
          CONSTRAINT "perangkat_desa_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("id") ON DELETE SET NULL NOT DEFERRABLE
        )
      `;

      await prisma.$executeRawUnsafe(createSql);

      // Create indexes
      await prisma.$executeRawUnsafe('CREATE INDEX "perangkat_desa_penduduk_id_idx" ON "perangkat_desa"("penduduk_id")');
      await prisma.$executeRawUnsafe('CREATE INDEX "perangkat_desa_desa_id_idx" ON "perangkat_desa"("desa_id")');
      await prisma.$executeRawUnsafe('CREATE INDEX "perangkat_desa_jabatan_idx" ON "perangkat_desa"("jabatan")');
      await prisma.$executeRawUnsafe('CREATE INDEX "perangkat_desa_status_idx" ON "perangkat_desa"("status")');
      await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "perangkat_desa_account_id_key" ON "perangkat_desa"("account_id")');

      console.log('perangkat_desa table created successfully!');
    }

    // Verify
    const finalCheck = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'perangkat_desa'
      ) as exists;
    `;
    console.log('Final check - perangkat_desa exists:', finalCheck[0].exists);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

applyPerangkatDesaManually();
