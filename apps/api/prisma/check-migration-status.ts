import { PrismaClient } from '@prisma/client';

async function checkMigrationStatus() {
  const prisma = new PrismaClient();

  try {
    // Get all migrations in database
    const dbMigrations = await prisma.$queryRaw`
      SELECT id, migration_name, started_at, finished_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY id;
    `;

    console.log('Migrations in database:');
    console.log(JSON.stringify(dbMigrations, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
    console.log();

    // Get all migrations in directory
    const fs = await import('fs');
    const path = await import('path');

    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationFolders = fs.readdirSync(migrationsDir)
      .filter(name => fs.statSync(path.join(migrationsDir, name)).isDirectory());

    console.log('Migrations in filesystem:');
    migrationFolders.forEach(name => console.log(`  ${name}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();
