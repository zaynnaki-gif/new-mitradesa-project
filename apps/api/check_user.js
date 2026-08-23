const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const acc = await prisma.account.findUnique({
    where: { username: 'superadmin' },
    include: { accountRoles: { include: { role: true } } }
  });
  console.dir(acc, {depth: null});
}
main().finally(() => prisma.$disconnect());
