const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fs = require('fs');

async function main() {
  // Step 1: Create _prisma_migrations tracking table
  console.log('Step 1: Creating _prisma_migrations tracking table...');
  try {
    await p.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "_prisma_migrations" (id SERIAL PRIMARY KEY, migration_name VARCHAR(255), finished_at TIMESTAMP, applied_steps_count INTEGER NOT NULL DEFAULT 0, started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, logs TEXT, rolled_back_at TIMESTAMP, checksum VARCHAR(64)');
    console.log('_prisma_migrations table ready');
  } catch (e) {
    console.log('Tracking table:', e.code || e.message.substring(0, 100));
  }

  // Step 2: Read migration SQL
  console.log('\nStep 2: Reading migration SQL...');
  const migrationSql = fs.readFileSync('prisma/migrations/20260811000000_add_phase4_reference_tables/migration.sql', 'utf8');

  // Step 3: Execute each CREATE TABLE
  console.log('\nStep 3: Executing migration statements...');
  const stmts = migrationSql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  console.log('Found', stmts.length, 'statements');

  for (const stmt of stmts) {
    if (stmt.length > 0) {
      try {
        await p.executeRawUnsafe(stmt);
        const name = stmt.match(/"([^"]+)"/)?.[1] || stmt.substring(0, 50);
        console.log('+', name);
      } catch (e) {
        if (e.code === '42P07') {
          console.log('= (already exists');
        } else {
          console.log('!', e.code || e.message.substring(0, 80));
        }
      }
    }
  }

  // Step 4: Mark migration as applied
  console.log('\nStep 4: Marking migration as applied...');
  try {
    const result = await p.executeRawUnsafe(
      "INSERT INTO \"_prisma_migrations\" (migration_name, finished_at, applied_steps_count) VALUES ('20260811000000_add_phase4_reference_tables', NOW(), 9) ON CONFLICT DO NOTHING"
    );
    console.log('Migration marked as applied');
  } catch (e) {
    console.log('Mark migration:', e.code || e.message.substring(0, 100));
  }

  console.log('\nDone.');
  await p.disconnect();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
