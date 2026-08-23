import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const failedLogins = await prisma.auditLog.findMany({
    where: { action: 'LOGIN_FAILED' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent failed logins:', JSON.stringify(failedLogins, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  const allAccounts = await prisma.account.findMany({
    select: {
      id: true,
      username: true,
      status: true
    }
  });
  console.log('All accounts:', JSON.stringify(allAccounts, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
