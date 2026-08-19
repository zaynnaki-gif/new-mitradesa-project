import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      last_value,
      log_cnt,
      is_called
    FROM "_prisma_migrations_id_seq";
  `;

  console.log(JSON.stringify(result, (_, v) =>
    typeof v === "bigint" ? v.toString() : v, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
