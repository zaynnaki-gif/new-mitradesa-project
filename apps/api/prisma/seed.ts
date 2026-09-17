import { PrismaClient } from '@prisma/client';
import { runSystemSeed } from '../src/services/seeder.service';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

/* eslint-disable no-console */

async function main() {
  console.log('Starting seed...');

  await runSystemSeed(prisma);

  // ============================================
  // DEVELOPMENT ACCOUNTS (NON-PRODUCTION ONLY)
  // ============================================
  if (process.env.NODE_ENV === 'production') {
    console.log('Production environment detected: Skipping development accounts (admin/pimpinan/developer) creation.');
  } else {
    console.log('Creating development accounts for local/staging...');

    const developmentAccounts = [
      {
        username: 'admin',
        email: 'admin@mitradesa.local',
        password: 'admin123',
        roleCode: 'ADMIN',
      },
      {
        username: 'pimpinan',
        email: 'pimpinan@mitradesa.local',
        password: 'pimpinan123',
        roleCode: 'PIMPINAN',
      },
      {
        username: 'developer',
        email: 'developer@mitradesa.local',
        password: 'dev123',
        roleCode: 'DEVELOPER',
      },
    ];

    for (const account of developmentAccounts) {
      const role = await prisma.role.findUnique({ where: { code: account.roleCode } });
      const passwordHash = await bcrypt.hash(account.password, BCRYPT_ROUNDS);
      const existingAccount = await prisma.account.findUnique({
        where: { username: account.username },
      });

      if (!existingAccount) {
        const newAccount = await prisma.account.create({
          data: {
            username: account.username,
            email: account.email,
            passwordHash,
            status: 'ACTIVE',
          },
        });

        if (!role) throw new Error(`Role ${account.roleCode} not found`);

        await prisma.accountRole.create({
          data: {
            accountId: newAccount.id,
            roleId: role.id,
          },
        });

        console.log(`Created account: ${account.username}`);
      } else {
        console.log(`Account already exists: ${account.username}`);
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
