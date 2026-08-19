import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = '_prisma_migrations'
    ORDER BY c.ordinal_position;
  `;

  console.log(JSON.stringify(result, null, 2));

  const constraints = await prisma.$queryRaw<any[]>`
    SELECT
      tc.constraint_name,
      tc.constraint_type
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = '_prisma_migrations';
  `;

  console.log(JSON.stringify(constraints, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
