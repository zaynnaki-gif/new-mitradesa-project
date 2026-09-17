/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const account = await prisma.account.findUnique({
    where: { username: 'superadmin' },
    include: {
      accountRoles: {
        include: { role: true }
      }
    }
  });
  console.dir(account, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
