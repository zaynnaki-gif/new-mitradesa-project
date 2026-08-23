import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const layananCount = await prisma.layanan.count();
  const fieldCount = await prisma.fieldDefinition.count();
  console.log(`Layanan count: ${layananCount}`);
  console.log(`FieldDefinition count: ${fieldCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
