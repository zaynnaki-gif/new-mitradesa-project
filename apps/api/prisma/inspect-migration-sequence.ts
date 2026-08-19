import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      s.sequence_name,
      s.data_type,
      s.start_value,
      s.minimum_value,
      s.maximum_value,
      s.increment
    FROM information_schema.sequences s
    WHERE s.sequence_name = '_prisma_migrations_id_seq';
  `;

  console.log(result);

  const sequenceState = await prisma.$queryRaw<any[]>`
    SELECT last_value, start_value, increment_by, min_value, max_value
    FROM "_prisma_migrations_id_seq";
  `;

  console.log(sequenceState);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
