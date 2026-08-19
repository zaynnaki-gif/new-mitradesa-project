const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const migrations = await p.$queryRaw`SELECT COUNT(*) as cnt FROM pg_tables WHERE tablename = '_prisma_migrations'`;
    console.log('_prisma_migrations exists:', migrations[0].cnt > 0 ? 'YES' : 'NO');

    const refTables = await p.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND (tablename LIKE 'ref_%' OR tablename = 'perangkat_desa')
      ORDER BY tablename
    `;
    console.log('\nReference tables:');
    refTables.forEach(t => console.log(' ', t.tablename));
    if (refTables.length === 0) console.log('  NONE FOUND');
  } finally {
    await p.$disconnect();
  }
}

main().catch(console.error);
