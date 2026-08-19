const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

async function main() {
  console.log('Step 1: Creating _prisma_migrations tracking table...');
  try {
    await p.$executeRaw`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255),
        finished_at TIMESTAMP,
        applied_steps_count INTEGER NOT NULL DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logs TEXT,
        rolled_back_at TIMESTAMP,
        checksum VARCHAR(64)
      )
    `;
    console.log('  Tracking table ready');
  } catch (e) {
    console.log('  Tracking table:', e.code || e.message.substring(0, 100));
  }

  console.log('\nStep 2: Reading migration SQL...');
  const sql = fs.readFileSync('prisma/migrations/20260811000000_add_phase4_reference_tables/migration.sql', 'utf8');
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  console.log('  Found', stmts.length, 'statements');

  console.log('\nStep 3: Applying migration statements...');
  let applied = 0;
  let skipped = 0;
  for (const stmt of stmts) {
    if (!stmt.trim()) continue;
    try {
      await p.$executeRaw`${stmt}`;
      applied++;
      const match = stmt.match(/CREATE TABLE "([^"]+)"/);
      console.log('  +', match ? match[1] : stmt.substring(0, 60));
    } catch (e) {
      if (e.code === '42P07') { skipped++; console.log('  = (already exists)'); }
      else { console.log('  !', e.code, e.message.substring(0, 80)); }
    }
  }

  console.log('\nStep 4: Marking migration as applied...');
  try {
    await p.$executeRaw`
      INSERT INTO "_prisma_migrations" (migration_name, finished_at, applied_steps_count)
      VALUES ('20260811000000_add_phase4_reference_tables', NOW(), ${applied})
      ON CONFLICT DO NOTHING
    `;
    console.log('  Marked successfully');
  } catch (e) {
    console.log('  Mark:', e.code || e.message.substring(0, 100));
  }

  console.log('\nStep 5: Final verification...');
  const tables = await p.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('\nTables in database:');
  tables.forEach(r => console.log(' ', r.tablename));
  console.log('\nTotal:', tables.length, 'tables');
}

main()
  .catch(e => console.error('Error:', e.message.substring(0, 200))
  .finally(() => p.$disconnect());
