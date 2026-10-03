import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedLayanan } from './seed_layanan.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Seed Identitas Desa
  let identitas = await prisma.identitasDesa.findFirst();
  if (!identitas) {
    identitas = await prisma.identitasDesa.create({
      data: {
        namaDesa: 'Desa Seruni Mumbul',
        kodeDesa: '5203082014',
        alamat: 'Jl. Raya Seruni Mumbul',
        kodepos: '83653',
        email: 'info@serunimumbul.desa.id',
        kepalaDesa: 'Ahmad Mumbuli',
      },
    });
  }

  console.log('Identitas Desa seeded:', identitas.namaDesa);

  // 2. Seed Role 'SUPER_ADMIN'
  const roleCode = 'SUPER_ADMIN';
  let role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'Super Administrator',
        code: roleCode,
        description: 'Full system access',
        isSystem: true,
      },
    });
  }

  // 3. Seed Admin Account
  const adminEmail = 'admin@mitradesa.id';
  const adminUsername = 'admin';
  const hashedPassword = await bcrypt.hash('password123', 10);

  let admin = await prisma.account.findUnique({ where: { username: adminUsername } });
  if (!admin) {
    admin = await prisma.account.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
      },
    });
  } else {
    admin = await prisma.account.update({
      where: { username: adminUsername },
      data: { passwordHash: hashedPassword }, // reset password on seed just in case
    });
  }

  // 4. Bind Role to Admin Account
  const accountRole = await prisma.accountRole.findFirst({
    where: { accountId: admin.id, roleId: role.id },
  });
  if (!accountRole) {
    await prisma.accountRole.create({
      data: {
        accountId: admin.id,
        roleId: role.id,
      },
    });
  }

  console.log('Admin user seeded:', admin.email);

  // 5. Seed Layanan Surat
  await seedLayanan(prisma);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
