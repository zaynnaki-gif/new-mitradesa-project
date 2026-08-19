import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      id::text AS id,
      checksum,
      migration_name,
      started_at,
      finished_at,
      applied_steps_count
    FROM "_prisma_migrations"
    ORDER BY id
  `;

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
