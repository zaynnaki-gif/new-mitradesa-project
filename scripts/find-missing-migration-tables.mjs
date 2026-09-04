import fs from 'fs';
import path from 'path';

const fullSql = fs.readFileSync('apps/api/full_schema_utf8.sql', 'utf8');

// Get all migrations
const migrationsDir = 'apps/api/prisma/migrations';
const existingDirs = fs.readdirSync(migrationsDir).filter(d => fs.statSync(path.join(migrationsDir, d)).isDirectory());

let existingSql = '';
for (const dir of existingDirs) {
  const migFile = path.join(migrationsDir, dir, 'migration.sql');
  if (fs.existsSync(migFile)) {
    existingSql += '\n' + fs.readFileSync(migFile, 'utf8');
  }
}

// Find all CREATE TABLE in fullSql
const tableMatches = [...fullSql.matchAll(/CREATE TABLE "([^"]+)"/g)].map(m => m[1]);
const existingTableMatches = [...existingSql.matchAll(/CREATE TABLE "([^"]+)"/g)].map(m => m[1]);

const missingTables = tableMatches.filter(t => !existingTableMatches.includes(t));
console.log('Tables in full schema:', tableMatches.length);
console.log('Tables in existing 4 migrations:', existingTableMatches.length);
console.log('Missing tables in migrations:', missingTables);
