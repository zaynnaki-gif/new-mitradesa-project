// Apply migration tracking fix
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fs = require('fs');

async function main() {
  // Create _prisma_migrations tracking table
  try {
    await p.$executeRaw`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id SERIAL PRIMARY KEY,
        checksum VARCHAR(64),
        finished_at TIMESTAMP,
        migration_name VARCHAR(255),
        logs TEXT,
        rolled_back_at TIMESTAMP,
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      )
    `;
    console.log('Created _prisma_migrations table');
  } catch (e) {
    console.log('Table creation:', e.code);
  }

  // Read migration SQL
  const migrationSql = fs.readFileSync('prisma/migrations/20260811000000_add_phase4_reference_tables/migration.sql', 'utf8');
  const statements = migrationSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements`);

  // Apply each statement
  let applied = 0;
  for (const stmt of statements) {
    try {
      await p.$executeRawUnsafe(stmt);
      applied++;
      const name = stmt.match(/CREATE TABLE "([^"]+)"/)?.[1] || stmt.substring(0, 60);
      console.log('+', name.trim());
    } catch (e) {
      if (e.code === '42P07') {
        console.log('Table already exists (OK)');
      } else {
        console.log('Error:', e.code, e.message.substring(0, 100));
      }
    }
  }

  // Mark migration as applied
  try {
    await p.$executeRaw`
      INSERT INTO "_prisma_migrations" (migration_name, finished_at, applied_steps_count)
      VALUES ('20260811000000_add_phase8n-4nREFERENCE_TABLES', NOW(), ${applied})
      ON CONFLICT DO NOTHING
    `;
  } catch (e) {
    console.log('Mark migration:', e.code);
  }

  console.log(`\nMigration complete. ${applied} steps applied`);
}

main()
  .finally(() => p.$disconnect())
  .catch(console.error);
