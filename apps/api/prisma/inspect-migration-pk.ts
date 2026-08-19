import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      c.data_type,
      c.udt_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.columns c
      ON c.table_schema = kcu.table_schema
      AND c.table_name = kcu.table_name
      AND c.column_name = kcu.column_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = '_prisma_migrations'
      AND tc.constraint_type = 'PRIMARY KEY';
  `;

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
