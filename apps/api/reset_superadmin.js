/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  const passwordHash = await bcrypt.hash('superadmin123', BCRYPT_ROUNDS);
  
  await prisma.account.update({
    where: { username: 'superadmin' },
    data: { passwordHash }
  });
  
  console.log('Successfully reset superadmin password to superadmin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
