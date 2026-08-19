const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedTestDb() {
  console.log('Checking for admin account...');
  let admin = await prisma.account.findUnique({ where: { username: 'admin' } });
  if (!admin) {
    console.log('Creating admin account...');
    const role = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    if (role) {
      const passwordHash = await bcrypt.hash('admin123', 12);
      admin = await prisma.account.create({
        data: {
          username: 'admin',
          email: 'admin@mitradesa.local',
          passwordHash,
          status: 'ACTIVE',
        },
      });
      await prisma.accountRole.create({
        data: {
          accountId: admin.id,
          roleId: role.id,
        },
      });
      console.log('Admin account created.');
    } else {
      console.log('ADMIN role not found!');
    }
  } else {
    console.log('Admin account exists.');
  }

  console.log('Checking for IdentitasDesa...');
  let identitas = await prisma.identitasDesa.findFirst();
  if (!identitas) {
    console.log('Creating IdentitasDesa...');
    await prisma.identitasDesa.create({
      data: {
        namaDesa: 'Desa Test',
        kodeDesa: '12345',
      }
    });
    console.log('IdentitasDesa created.');
  } else {
    console.log('IdentitasDesa exists.');
  }
}

seedTestDb().catch(console.error).finally(() => prisma.$disconnect());
