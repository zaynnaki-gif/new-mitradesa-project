import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'perangkat_desa';
  `;

  console.log(result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
