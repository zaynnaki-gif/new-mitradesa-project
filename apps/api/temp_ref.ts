import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.refHubunganKeluarga.findMany();
  console.log(data.map(d => ({ id: d.id.toString(), nama: d.nama })));
}

main().finally(() => prisma.$disconnect());
