import { PrismaClient, ConfigType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

/* eslint-disable no-console */

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
    // Accounts / Akun permissions
    { name: 'View All Accounts', code: 'account.view_all', groupName: 'account' },
    { name: 'View Account', code: 'account.view', groupName: 'account' },
    { name: 'Create Account', code: 'account.create', groupName: 'account' },
    { name: 'Update Account', code: 'account.update', groupName: 'account' },
    { name: 'Delete Account', code: 'account.delete', groupName: 'account' },
    { name: 'View All Accounts (legacy)', code: 'akun.view_all', groupName: 'akun' },
    { name: 'Create Account (legacy)', code: 'akun.create', groupName: 'akun' },
    { name: 'Update Account (legacy)', code: 'akun.update', groupName: 'akun' },
    { name: 'Delete Account (legacy)', code: 'akun.delete', groupName: 'akun' },

    // Role permissions
    { name: 'View Roles', code: 'role.view', groupName: 'role' },
    { name: 'Manage Roles', code: 'role.manage', groupName: 'role' },

    // Permission permissions
    { name: 'View Permissions', code: 'permission.view', groupName: 'permission' },
    { name: 'Manage Permissions', code: 'permission.manage', groupName: 'permission' },

    // Audit permissions
    { name: 'View Audit Log', code: 'audit.view', groupName: 'audit' },

    // Citizen / Penduduk permissions
    { name: 'View Citizen', code: 'citizen.view', groupName: 'citizen' },
    { name: 'Manage Citizen', code: 'citizen.manage', groupName: 'citizen' },
    { name: 'View Penduduk', code: 'penduduk.view', groupName: 'penduduk' },
    { name: 'Create Penduduk', code: 'penduduk.create', groupName: 'penduduk' },
    { name: 'Update Penduduk', code: 'penduduk.update', groupName: 'penduduk' },
    { name: 'Delete Penduduk', code: 'penduduk.delete', groupName: 'penduduk' },

    // Wilayah permissions
    { name: 'View Wilayah', code: 'wilayah.view', groupName: 'wilayah' },
    { name: 'Manage Wilayah', code: 'wilayah.manage', groupName: 'wilayah' },

    // Configuration permissions
    { name: 'View Configuration', code: 'config.view', groupName: 'config' },
    { name: 'Manage Configuration', code: 'config.manage', groupName: 'config' },
    { name: 'Update Configuration', code: 'config.update', groupName: 'config' },
    { name: 'Create Configuration', code: 'config.create', groupName: 'config' },
    { name: 'Delete Configuration', code: 'config.delete', groupName: 'config' },
    { name: 'View Configuration (legacy)', code: 'konfigurasi.view', groupName: 'konfigurasi' },
    { name: 'Manage Configuration (legacy)', code: 'konfigurasi.manage', groupName: 'konfigurasi' },

    // Layanan & Permintaan Surat permissions
    { name: 'View Layanan', code: 'layanan.view', groupName: 'layanan' },
    { name: 'Manage Layanan', code: 'layanan.manage', groupName: 'layanan' },
    { name: 'View Request', code: 'request.view', groupName: 'request' },
    { name: 'Create Request', code: 'request.create', groupName: 'request' },
    { name: 'Update Request', code: 'request.update', groupName: 'request' },
    { name: 'Approve Request', code: 'request.approve', groupName: 'request' },
    { name: 'Reject Request', code: 'request.reject', groupName: 'request' },

    // Template Designer permissions
    { name: 'View Template', code: 'template.view', groupName: 'template' },
    { name: 'Create Template', code: 'template.create', groupName: 'template' },
    { name: 'Update Template', code: 'template.update', groupName: 'template' },
    { name: 'Delete Template', code: 'template.delete', groupName: 'template' },
    { name: 'Publish Template', code: 'template.publish', groupName: 'template' },

    // Document Generation & Signing permissions
    { name: 'View Document', code: 'document.view', groupName: 'document' },
    { name: 'Create Document', code: 'document.create', groupName: 'document' },
    { name: 'Update Document', code: 'document.update', groupName: 'document' },
    { name: 'Delete Document', code: 'document.delete', groupName: 'document' },
    { name: 'Generate Document', code: 'document.generate', groupName: 'document' },
    { name: 'Sign Document', code: 'document.sign', groupName: 'document' },

    // Keuangan / Kas Umum permissions
    { name: 'View Kas Umum', code: 'kas_umum.view', groupName: 'kas_umum' },
    { name: 'Create Kas Umum', code: 'kas_umum.create', groupName: 'kas_umum' },
    { name: 'Update Kas Umum', code: 'kas_umum.update', groupName: 'kas_umum' },
    { name: 'Delete Kas Umum', code: 'kas_umum.delete', groupName: 'kas_umum' },

    // Kesehatan / Bumil / Posyandu permissions
    { name: 'View Kesehatan', code: 'kesehatan.view', groupName: 'kesehatan' },
    { name: 'Manage Kesehatan', code: 'kesehatan.manage', groupName: 'kesehatan' },
    { name: 'View Bumil', code: 'bumil.view', groupName: 'bumil' },
    { name: 'Manage Bumil', code: 'bumil.manage', groupName: 'bumil' },
    { name: 'View Posyandu', code: 'posyandu.view', groupName: 'posyandu' },
    { name: 'Manage Posyandu', code: 'posyandu.manage', groupName: 'posyandu' },

    // Pemerintahan / Bansos / Saran permissions
    { name: 'View Pemerintahan', code: 'pemerintahan.view', groupName: 'pemerintahan' },
    { name: 'Manage Pemerintahan', code: 'pemerintahan.manage', groupName: 'pemerintahan' },
    { name: 'View Bansos', code: 'bansos.view', groupName: 'bansos' },
    { name: 'Manage Bansos', code: 'bansos.manage', groupName: 'bansos' },

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

  if (!adminRole) throw new Error('ADMIN role not found');

  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Pimpinan gets viewing, request approval, and document signing permissions
  const pimpinanPermissions = [
    'account.view_all',
    'akun.view_all',
    'citizen.view',
    'penduduk.view',
    'wilayah.view',
    'audit.view',
    'request.view',
    'request.approve',
    'request.reject',
    'document.view',
    'document.sign',
    'template.view',
    'kas_umum.view',
    'kesehatan.view',
    'pemerintahan.view',
  ];

  if (!pimpinanRole) throw new Error('PIMPINAN role not found');

  for (const code of pimpinanPermissions) {
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: pimpinanRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: pimpinanRole.id,
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

  // ============================================
  // CONFIGURATION
  // ============================================
  console.log('Creating configuration...');

  const configurations = [
    { groupName: 'auth', key: 'jwt_expiry', value: '24h', value_type: ConfigType.STRING, description: 'JWT token expiry', isSystem: true },
    { groupName: 'auth', key: 'otp_length', value: '6', value_type: ConfigType.NUMBER, description: 'OTP code length', isSystem: true },
    { groupName: 'auth', key: 'otp_expiry_minutes', value: '5', value_type: ConfigType.NUMBER, description: 'OTP expiry in minutes', isSystem: true },
    { groupName: 'auth', key: 'otp_max_attempts', value: '3', value_type: ConfigType.NUMBER, description: 'Maximum OTP attempts', isSystem: true },
    { groupName: 'auth', key: 'session_expiry_hours', value: '24', value_type: ConfigType.NUMBER, description: 'Session expiry in hours', isSystem: true },
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
  // INSTANCE DESA (ADR-001)
  // ============================================
  console.log('Ensuring instance desa exists...');
  const targetDesaId = BigInt(process.env.DESA_ID || '1');
  const targetDesaKode = process.env.DESA_KODE || '52.03.08.2014';
  const targetDesaNama = process.env.DESA_NAMA || 'Desa Seruni Mumbul';

  await prisma.desa.upsert({
    where: { id: targetDesaId },
    update: {
      kode: targetDesaKode,
      nama: targetDesaNama,
    },
    create: {
      id: targetDesaId,
      kode: targetDesaKode,
      nama: targetDesaNama,
      kecamatanId: 5203080n,
    },
  });

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
      desaId: targetDesaId,
      createdById: devAccount?.id || null
    },
    {
      judul: 'Visi dan Misi',
      slug: 'visi-misi',
      konten: '<h3>Visi</h3><p>Mewujudkan desa yang mandiri, maju, dan sejahtera dengan mengedepankan kearifan lokal.</p><h3>Misi</h3><ul><li>Meningkatkan kualitas sumber daya manusia</li><li>Membangun infrastruktur yang memadai</li><li>Memberdayakan ekonomi kerakyatan</li></ul>',
      excerpt: 'Visi dan Misi arah pembangunan desa ke depan.',
      status: 'PUBLISHED' as const,
      desaId: targetDesaId,
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
