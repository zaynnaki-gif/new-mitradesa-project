/**
 * MITRADESA - Test Baseline Migration on Fresh Database
 *
 * HOW TO USE:
 * 1. Create a new database in Supabase (for testing)
 * 2. Copy the DATABASE_URL of the new database
 * 3. Replace DATABASE_URL in this script
 * 4. Run: node test-baseline-migration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');
const fs = require('fs');

// ============================================================================
// CONFIGURATION - Change these values for testing
// ============================================================================

// Option 1: Use a different database URL for testing
const TEST_DATABASE_URL = process.env.DATABASE_URL; // Change this to test database URL

// Option 2: Create database directly (Supabase specific)
const IS_SUPABASE = true;

// ============================================================================

async function createFreshDatabase() {
  console.log('🔄 Testing Baseline Migration on Fresh Database\n');
  console.log('='.repeat(50));

  // Parse the DATABASE_URL to extract connection info
  const dbUrl = new URL(TEST_DATABASE_URL);

  // For Supabase, we need to connect to the default 'postgres' database first
  // then create a new database for testing
  const baseUrl = `${dbUrl.protocol}//${dbUrl.host}`;
  const baseUser = dbUrl.username;
  const basePass = dbUrl.password;

  console.log('📡 Connecting to base database...');

  const client = new Client({
    connectionString: TEST_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Check existing tables
    console.log('🔍 Checking current database state...');
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count FROM pg_tables WHERE schemaname = 'public'
    `);
    console.log(`   Current tables: ${tablesResult.rows[0].count}`);

    if (parseInt(tablesResult.rows[0].count) > 0) {
      console.log('\n⚠️  WARNING: Database is NOT empty!');
      console.log('   This test should be run on a FRESH database.');
      console.log('   Tables found:');

      const existingTables = await client.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
      `);
      existingTables.rows.forEach(r => console.log(`   - ${r.tablename}`));

      console.log('\n❌ Aborting - Run this test on a NEW/EMPTY database');
      return;
    }

    // Read and execute baseline migration
    console.log('\n📝 Reading baseline migration SQL...');
    const migrationSql = fs.readFileSync(
      require('path').join(__dirname, 'prisma', 'baseline-migration-fresh-db.sql'),
      'utf8'
    );
    console.log(`   Read ${migrationSql.length} characters\n`);

    // Execute migration in a transaction
    console.log('🚀 Executing baseline migration...\n');

    await client.query('BEGIN');

    // Split by semicolon and execute each statement
    const statements = migrationSql
      .split(/;(\s*\n)/)
      .filter(s => s.trim().length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      try {
        await client.query(trimmed);
        successCount++;
      } catch (error) {
        // Ignore certain errors that are expected
        if (error.code === '42P07' || // table already exists
            error.code === '42710' || // type already exists
            error.code === '23505') { // unique violation
          console.log(`   ⚠️  Skipped (already exists): ${error.detail || error.message.substring(0, 50)}`);
        } else {
          console.log(`   ❌ Error: ${error.message.substring(0, 100)}`);
          errorCount++;
        }
      }
    }

    await client.query('COMMIT');

    console.log('\n📊 Migration Results:');
    console.log(`   ✅ Successful statements: ${successCount}`);
    console.log(`   ⚠️  Skipped (already existed): some`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    // Verify tables created
    console.log('🔍 Verifying created objects...\n');

    const finalTables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    const finalEnums = await client.query(`
      SELECT typname as enum_name FROM pg_type WHERE typtype = 'e' ORDER BY typname
    `);

    console.log('   Tables created:');
    finalTables.rows.forEach(r => console.log(`   ✅ ${r.tablename}`));

    console.log('\n   Enums created:');
    finalEnums.rows.forEach(r => console.log(`   ✅ ${r.enum_name}`));

    console.log('\n' + '='.repeat(50));
    console.log('✅ BASELINE MIGRATION TEST COMPLETE');
    console.log('='.repeat(50));
    console.log(`\nSummary:`);
    console.log(`   Tables: ${finalTables.rows.length}`);
    console.log(`   Enums: ${finalEnums.rows.length}`);

    if (errorCount === 0 && finalTables.rows.length >= 33) {
      console.log('\n🎉 Migration test PASSED!');
    } else {
      console.log('\n⚠️  Migration completed with some issues - review above');
    }

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', error.message);
    console.error('\nDetails:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the test
createFreshDatabase()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  });
