import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Starting seed...');

  // ============================================
  // ROLES
  // ============================================
  console.log('Creating roles...');

  const roles = [
    {
      name: 'Administrator',
      code: 'ADMIN',
      description: 'System administrator with full access to internal operations',
      isSystem: true,
    },
    {
      name: 'Pimpinan',
      code: 'PIMPINAN',
      description: 'Village leadership - can approve and sign documents',
      isSystem: true,
    },
    {
      name: 'Developer',
      code: 'DEVELOPER',
      description: 'System developer with development access',
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }

  console.log(`Created ${roles.length} roles`);

  // ============================================
  // PERMISSIONS
  // ============================================
  console.log('Creating permissions...');

  const permissions = [
    // Admin permissions
    { name: 'View All Accounts', code: 'akun.view_all', groupName: 'akun' },
    { name: 'Create Account', code: 'akun.create', groupName: 'akun' },
    { name: 'Update Account', code: 'akun.update', groupName: 'akun' },
    { name: 'Delete Account', code: 'akun.delete', groupName: 'akun' },

    // Role permissions
    { name: 'View Roles', code: 'role.view', groupName: 'role' },
    { name: 'Manage Roles', code: 'role.manage', groupName: 'role' },

    // Permission permissions
    { name: 'View Permissions', code: 'permission.view', groupName: 'permission' },
    { name: 'Manage Permissions', code: 'permission.manage', groupName: 'permission' },

    // Audit permissions
    { name: 'View Audit Log', code: 'audit.view', groupName: 'audit' },

    // Citizen permissions
    { name: 'View Citizen', code: 'citizen.view', groupName: 'citizen' },
    { name: 'Manage Citizen', code: 'citizen.manage', groupName: 'citizen' },

    // Configuration permissions
    { name: 'View Configuration', code: 'konfigurasi.view', groupName: 'konfigurasi' },
    { name: 'Manage Configuration', code: 'konfigurasi.manage', groupName: 'konfigurasi' },

    // System permissions (wildcard)
    { name: 'Full System Access', code: 'system.*', groupName: 'system' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  console.log(`Created ${permissions.length} permissions`);

  // ============================================
  // ROLE-PERMISSION ASSIGNMENTS
  // ============================================
  console.log('Assigning permissions to roles...');

  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const pimpinanRole = await prisma.role.findUnique({ where: { code: 'PIMPINAN' } });
  const developerRole = await prisma.role.findUnique({ where: { code: 'DEVELOPER' } });

  // Admin gets all permissions except system.*
  const adminPermissions = await prisma.permission.findMany({
    where: { code: { not: 'system.*' } },
  });

  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole!.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole!.id,
        permissionId: permission.id,
      },
    });
  }

  // Pimpinan gets basic permissions
  const pimpinanPermissions = [
    'akun.view_all',
    'citizen.view',
    'audit.view',
  ];

  for (const code of pimpinanPermissions) {
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: pimpinanRole!.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: pimpinanRole!.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Developer gets system.* (full access)
  const systemPermission = await prisma.permission.findUnique({
    where: { code: 'system.*' },
  });

  if (systemPermission && developerRole) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: developerRole.id,
          permissionId: systemPermission.id,
        },
      },
      update: {},
      create: {
        roleId: developerRole.id,
        permissionId: systemPermission.id,
      },
    });
  }

  // ============================================
  // DEVELOPMENT ACCOUNTS
  // ============================================
  console.log('Creating development accounts...');

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

      await prisma.accountRole.create({
        data: {
          accountId: newAccount.id,
          roleId: role!.id,
        },
      });

      console.log(`Created account: ${account.username}`);
    } else {
      console.log(`Account already exists: ${account.username}`);
    }
  }

  // ============================================
  // CONFIGURATION
  // ============================================
  console.log('Creating configuration...');

  const configurations = [
    { groupName: 'auth', key: 'jwt_expiry', value: '24h', value_type: 'STRING', description: 'JWT token expiry', isSystem: true },
    { groupName: 'auth', key: 'otp_length', value: '6', value_type: 'NUMBER', description: 'OTP code length', isSystem: true },
    { groupName: 'auth', key: 'otp_expiry_minutes', value: '5', value_type: 'NUMBER', description: 'OTP expiry in minutes', isSystem: true },
    { groupName: 'auth', key: 'otp_max_attempts', value: '3', value_type: 'NUMBER', description: 'Maximum OTP attempts', isSystem: true },
    { groupName: 'auth', key: 'session_expiry_hours', value: '24', value_type: 'NUMBER', description: 'Session expiry in hours', isSystem: true },
  ];

  for (const config of configurations) {
    await prisma.configuration.upsert({
      where: {
        groupName_key: {
          groupName: config.groupName,
          key: config.key,
        },
      },
      update: config,
      create: config,
    });
  }

  console.log(`Created ${configurations.length} configurations`);

  // ============================================
  // HALAMAN (STATIC PAGES)
  // ============================================
  console.log('Creating standard CMS pages...');
  
  const devAccount = await prisma.account.findFirst({ where: { username: 'developer' } });
  
  const pages = [
    {
      judul: 'Sejarah Desa',
      slug: 'sejarah-desa',
      konten: '<p>Desa ini memiliki sejarah panjang yang dimulai sejak zaman kerajaan nusantara. Dibangun oleh para pendiri yang memiliki visi kuat untuk kesejahteraan bersama.</p>',
      excerpt: 'Sejarah pembentukan dan perkembangan desa dari masa ke masa.',
      status: 'PUBLISHED' as const,
      desaId: 1n,
      createdById: devAccount?.id || null
    },
    {
      judul: 'Visi dan Misi',
      slug: 'visi-misi',
      konten: '<h3>Visi</h3><p>Mewujudkan desa yang mandiri, maju, dan sejahtera dengan mengedepankan kearifan lokal.</p><h3>Misi</h3><ul><li>Meningkatkan kualitas sumber daya manusia</li><li>Membangun infrastruktur yang memadai</li><li>Memberdayakan ekonomi kerakyatan</li></ul>',
      excerpt: 'Visi dan Misi arah pembangunan desa ke depan.',
      status: 'PUBLISHED' as const,
      desaId: 1n,
      createdById: devAccount?.id || null
    }
  ];

  for (const p of pages) {
    await prisma.halaman.upsert({
      where: { slug: p.slug },
      update: { ...p, status: 'PUBLISHED' },
      create: p,
    });
  }
  
  console.log(`Created ${pages.length} standard pages`);

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
