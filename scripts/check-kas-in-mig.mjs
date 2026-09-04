import fs from 'fs';
import path from 'path';

const migrationsDir = 'apps/api/prisma/migrations';
const dirs = fs.readdirSync(migrationsDir).filter(d => fs.statSync(path.join(migrationsDir, d)).isDirectory());

for (const dir of dirs) {
  const migFile = path.join(migrationsDir, dir, 'migration.sql');
  if (fs.existsSync(migFile)) {
    const content = fs.readFileSync(migFile, 'utf8');
    if (content.includes('kas_umum')) {
      console.log(`kas_umum found in: ${dir}`);
    }
  }
}
