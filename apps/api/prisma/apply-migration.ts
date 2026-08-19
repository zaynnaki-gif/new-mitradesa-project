import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigrationManually() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Manual Migration Execution ===\n');

    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'prisma', 'migrations', '20260811000000_add_phase4_reference_tables', 'migration.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    console.log('Migration SQL file read successfully.');
    console.log(`SQL length: ${migrationSql.length} characters\n`);

    // Split by semicolons to execute each statement
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.\n`);

    // Execute each statement
    let executedCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.length > 0) {
        try {
          await prisma.$executeRawUnsafe(stmt + ';');
          executedCount++;
          // Extract table name for logging
          const match = stmt.match(/CREATE TABLE\s+"([^"]+)"/i);
          const tableName = match ? match[1] : `Statement ${i + 1}`;
          console.log(`  ✓ Executed: ${tableName}`);
        } catch (err: any) {
          console.error(`  ✗ Error executing statement ${i + 1}: ${err.message}`);
          console.log(`    Statement: ${stmt.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\nExecuted ${executedCount} statements successfully.`);

    // Now insert the migration record manually
    console.log('\nInserting migration record...');
    const checksum = 'manual-execution'; // Prisma normally computes this
    const now = new Date();

    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      ) VALUES (
        nextval('_prisma_migrations_id_seq'),
        $1,
        $2,
        $3,
        NULL,
        NULL,
        $4,
        1
      )
    `, checksum, now, '20260811000000_add_phase4_reference_tables', now);

    console.log('Migration record inserted.\n');

    // Verify the tables were created
    console.log('Verifying tables...');
    const tables = ['ref_agama', 'ref_gol_darah', 'ref_status_perkawinan',
                    'ref_hubungan_keluarga', 'ref_status_kependudukan',
                    'ref_pendidikan', 'ref_pekerjaan', 'ref_jabatan_perangkat',
                    'ref_status_perangkat'];

    for (const table of tables) {
      const exists = await prisma.$queryRaw<any[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        ) as exists;
      `;
      console.log(`  ${table}: ${exists[0].exists ? 'EXISTS' : 'MISSING'}`);
    }

    console.log('\n=== Migration Complete ===');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigrationManually();
