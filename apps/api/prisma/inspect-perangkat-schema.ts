import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRaw<any[]>`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'perangkat_desa'
    ORDER BY ordinal_position;
  `;

  console.log("COLUMNS:");
  console.log(JSON.stringify(columns, null, 2));

  const constraints = await prisma.$queryRaw<any[]>`
    SELECT
      tc.constraint_name,
      tc.constraint_type
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'perangkat_desa'
    ORDER BY tc.constraint_name;
  `;

  console.log("\nCONSTRAINTS:");
  console.log(JSON.stringify(constraints, null, 2));

  const indexes = await prisma.$queryRaw<any[]>`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'perangkat_desa'
    ORDER BY indexname;
  `;

  console.log("\nINDEXES:");
  console.log(JSON.stringify(indexes, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
