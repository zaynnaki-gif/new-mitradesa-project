import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking _prisma_migrations.id...");

  const before = await prisma.$queryRaw<any[]>`
    SELECT
      column_name,
      data_type,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '_prisma_migrations'
      AND column_name = 'id'
  `;

  console.log("BEFORE:");
  console.log(JSON.stringify(before, null, 2));

  if (before.length !== 1) {
    throw new Error("Expected exactly one _prisma_migrations.id column");
  }

  if (before[0].data_type !== "bigint") {
    throw new Error(
      `Unexpected id type: ${before[0].data_type}. Aborting.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      ALTER TABLE "_prisma_migrations"
      ALTER COLUMN "id" DROP DEFAULT
    `);

    await tx.$executeRawUnsafe(`
      ALTER TABLE "_prisma_migrations"
      ALTER COLUMN "id" TYPE TEXT
      USING "id"::text
    `);
  });

  const after = await prisma.$queryRaw<any[]>`
    SELECT
      column_name,
      data_type,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '_prisma_migrations'
      AND column_name = 'id'
  `;

  console.log("AFTER:");
  console.log(JSON.stringify(after, null, 2));

  const rows = await prisma.$queryRaw<any[]>`
    SELECT id, migration_name
    FROM "_prisma_migrations"
    ORDER BY id
  `;

  console.log("MIGRATIONS:");
  console.log(
    JSON.stringify(
      rows,
      (_, v) => typeof v === "bigint" ? v.toString() : v,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
