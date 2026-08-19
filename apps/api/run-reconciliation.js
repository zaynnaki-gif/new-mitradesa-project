/**
 * MITRADESA - Run Reconciliation Script
 * Executes the reconciliation SQL to mark baseline migration as applied
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');

async function runReconciliation() {
  console.log('🔄 Starting MITRADESA Migration Reconciliation...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Step 1: Create _prisma_migrations table if not exists
    console.log('📝 Step 1: Ensuring _prisma_migrations table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" SERIAL PRIMARY KEY,
        "checksum" VARCHAR(64),
        "finished_at" TIMESTAMP,
        "migration_name" VARCHAR(255),
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP,
        "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);
    console.log('✅ _prisma_migrations table ready\n');

    // Step 2: Clear old migration records
    console.log('🗑️  Step 2: Clearing old migration records...');
    const deleteResult = await client.query(`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name IN (
        '20260812000000_add_cms_models',
        '20260812010000_add_perangkat_desa',
        '20260811000000_add_phase4_reference_tables'
      )
      RETURNING migration_name
    `);
    console.log(`   Deleted ${deleteResult.rowCount} old migration record(s)`);
    if (deleteResult.rowCount > 0) {
      deleteResult.rows.forEach(r => console.log(`   - ${r.migration_name}`));
    }
    console.log('');

    // Step 3: Mark baseline as applied
    console.log('📋 Step 3: Marking baseline as applied...');

    // Check if already exists first
    const existingCheck = await client.query(`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE migration_name = '20260813000000_baseline_initial_schema'
    `);

    if (existingCheck.rows.length > 0) {
      console.log('   Baseline migration already marked as applied');
    } else {
      // Generate a new UUID for id
      const { v4: uuidv4 } = require('uuid');
      const newId = uuidv4();

      await client.query(`
        INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "applied_steps_count")
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
      `, [
        newId,
        'baseline-migration-reconciliation',
        '20260813000000_baseline_initial_schema',
        'Marked as applied - database already contains all schema objects',
        1
      ]);
      console.log(`   Baseline migration marked as applied (id: ${newId})`);
    }
    console.log('');

    // Step 4: Verify tables
    console.log('🔍 Step 4: Verifying database objects...\n');

    const expectedTables = [
      'provinsi', 'kabupaten', 'kecamatan', 'desa', 'identitas_desa',
      'account', 'role', 'permission', 'account_role', 'role_permission',
      'audit_log', 'configuration',
      'penduduk', 'keluarga', 'anggota_keluarga',
      'citizen_verification', 'otp_challenge', 'citizen_session', 'internal_session',
      'perangkat_desa',
      'ref_agama', 'ref_gol_darah', 'ref_status_perkawinan', 'ref_hubungan_keluarga',
      'ref_status_kependudukan', 'ref_pendidikan', 'ref_pekerjaan', 'ref_jabatan_perangkat', 'ref_status_perangkat',
      'kategori', 'berita', 'halaman', 'media'
    ];

    const expectedEnums = [
      'AccountStatus', 'VerificationStatus', 'OtpStatus', 'AuditAction',
      'ActorType', 'ConfigType', 'BeritaStatus', 'HalamanStatus'
    ];

    // Check tables
    console.log('   Tables:');
    let tableCount = 0;
    let missingTables = [];
    for (const table of expectedTables) {
      const result = await client.query(
        `SELECT EXISTS(SELECT FROM pg_tables WHERE tablename = $1)`,
        [table]
      );
      if (result.rows[0].exists) {
        tableCount++;
      } else {
        missingTables.push(table);
      }
    }
    console.log(`   ✅ Found: ${tableCount}/${expectedTables.length} tables`);
    if (missingTables.length > 0) {
      console.log(`   ❌ Missing: ${missingTables.join(', ')}`);
    }

    // Check enums
    console.log('\n   Enums:');
    let enumCount = 0;
    let missingEnums = [];
    for (const enumName of expectedEnums) {
      const result = await client.query(
        `SELECT EXISTS(SELECT FROM pg_type WHERE typname = $1 AND typtype = 'e')`,
        [enumName]
      );
      if (result.rows[0].exists) {
        enumCount++;
      } else {
        missingEnums.push(enumName);
      }
    }
    console.log(`   ✅ Found: ${enumCount}/${expectedEnums.length} enums`);
    if (missingEnums.length > 0) {
      console.log(`   ❌ Missing: ${missingEnums.join(', ')}`);
    }

    // Step 5: Show migration state
    console.log('\n📊 Step 5: Current Migration State\n');
    const migrationResult = await client.query(`
      SELECT
        migration_name,
        finished_at,
        applied_steps_count,
        CASE WHEN finished_at IS NOT NULL THEN 'APPLIED ✓' ELSE 'PENDING' END as status
      FROM "_prisma_migrations"
      ORDER BY started_at
    `);

    if (migrationResult.rows.length > 0) {
      console.log('   Migration History:');
      migrationResult.rows.forEach(r => {
        console.log(`   - ${r.migration_name}`);
        console.log(`     Status: ${r.status}`);
        console.log(`     Applied: ${r.finished_at || 'N/A'}`);
      });
    } else {
      console.log('   No migrations recorded yet');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ RECONCILIATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`\nTables: ${tableCount}/${expectedTables.length} found`);
    console.log(`Enums: ${enumCount}/${expectedEnums.length} found`);
    console.log('\nNext steps:');
    console.log('1. Archive old migrations (see archive-old-migrations.sql)');
    console.log('2. Run: npx prisma migrate status');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error during reconciliation:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runReconciliation();
