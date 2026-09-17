import { PrismaClient, Prisma, ConfigType } from '@prisma/client';

export async function runSystemSeed(prisma: PrismaClient | Prisma.TransactionClient) {
  // ============================================
  // ROLES
  // ============================================
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

  // ============================================
  // PERMISSIONS
  // ============================================
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

  // ============================================
  // ROLE-PERMISSION ASSIGNMENTS
  // ============================================
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const pimpinanRole = await prisma.role.findUnique({ where: { code: 'PIMPINAN' } });
  const developerRole = await prisma.role.findUnique({ where: { code: 'DEVELOPER' } });

  // Admin gets all permissions except system.*
  const adminPermissions = await prisma.permission.findMany({
    where: { code: { not: 'system.*' } },
  });

  if (adminRole) {
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

  if (pimpinanRole) {
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
  // CONFIGURATION
  // ============================================
  const configurations = [
    { groupName: 'auth', key: 'jwt_expiry', value: '24h', value_type: ConfigType.STRING, description: 'JWT token expiry', isSystem: true },
    { groupName: 'auth', key: 'otp_length', value: '6', value_type: ConfigType.NUMBER, description: 'OTP code length', isSystem: true },
    { groupName: 'auth', key: 'otp_expiry_minutes', value: '5', value_type: ConfigType.NUMBER, description: 'OTP expiry in minutes', isSystem: true },
    { groupName: 'auth', key: 'otp_max_attempts', value: '3', value_type: ConfigType.NUMBER, description: 'Maximum OTP attempts', isSystem: true },
    { groupName: 'auth', key: 'session_expiry_hours', value: '24', value_type: ConfigType.NUMBER, description: 'Session expiry in hours', isSystem: true },
    // NOTIFIKASI
    { groupName: 'NOTIFICATION', key: 'FONNTE_API_KEY', value: '', value_type: ConfigType.STRING, description: 'API Key Fonnte untuk WhatsApp Gateway', isSystem: false },
    { groupName: 'NOTIFICATION', key: 'WA_GATEWAY_STATUS', value: 'DISCONNECTED', value_type: ConfigType.STRING, description: 'Status koneksi WhatsApp Gateway', isSystem: true },
    { groupName: 'NOTIFICATION', key: 'TEMPLATE_WA_SUBMIT', value: 'Halo {nama}, permohonan surat {jenis_surat} Anda berhasil diajukan.', value_type: ConfigType.STRING, description: 'Template pesan submit', isSystem: false },
    // PERSURATAN
    { groupName: 'PERSURATAN', key: 'FORMAT_NOMOR_SURAT', value: '{nomor}/{kode_klasifikasi}/429.114.03/{tahun}', value_type: ConfigType.STRING, description: 'Format nomor surat otomatis', isSystem: false },
    { groupName: 'PERSURATAN', key: 'TAHUN_ANGGARAN', value: '2026', value_type: ConfigType.NUMBER, description: 'Tahun anggaran berjalan', isSystem: false },
    { groupName: 'PERSURATAN', key: 'PUBLIC_WEB_URL', value: 'https://mitradesa.id', value_type: ConfigType.STRING, description: 'URL web publik (digunakan di QR Verifikasi)', isSystem: false },
    // KEAMANAN
    { groupName: 'SECURITY', key: 'RATE_LIMIT_ENABLED', value: 'true', value_type: ConfigType.BOOLEAN, description: 'Aktifkan pembatasan rate limit API', isSystem: false },
    { groupName: 'SECURITY', key: 'RATE_LIMIT_MAX', value: '100', value_type: ConfigType.NUMBER, description: 'Maksimum request per 15 menit', isSystem: false },
    { groupName: 'SECURITY', key: 'GRACE_PERIOD_HOURS', value: '24', value_type: ConfigType.NUMBER, description: 'Batas waktu link recovery', isSystem: false },
    // BACKUP
    { groupName: 'SYSTEM', key: 'LAST_BACKUP_DATE', value: '', value_type: ConfigType.STRING, description: 'Waktu backup terakhir (otomatis)', isSystem: true },
    { groupName: 'SYSTEM', key: 'BACKUP_STATUS', value: 'OK', value_type: ConfigType.STRING, description: 'Status backup sistem', isSystem: true },
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

  // ============================================
  // REFERENSI BAKU KEPENDUDUKAN
  // ============================================
  const agamas = [
    { kode: '1', nama: 'ISLAM' },
    { kode: '2', nama: 'KRISTEN' },
    { kode: '3', nama: 'KATHOLIK' },
    { kode: '4', nama: 'HINDU' },
    { kode: '5', nama: 'BUDHA' },
    { kode: '6', nama: 'KHONGHUCU' },
    { kode: '7', nama: 'KEPERCAYAAN' },
  ];

  for (const item of agamas) {
    await prisma.refAgama.upsert({
      where: { kode: item.kode },
      update: item,
      create: item,
    });
  }

  const pendidikans = [
    { kode: '1', nama: 'TIDAK/BELUM SEKOLAH', jenjang: 1 },
    { kode: '2', nama: 'BELUM TAMAT SD/SEDERAJAT', jenjang: 2 },
    { kode: '3', nama: 'TAMAT SD/SEDERAJAT', jenjang: 3 },
    { kode: '4', nama: 'SLTP/SEDERAJAT', jenjang: 4 },
    { kode: '5', nama: 'SLTA/SEDERAJAT', jenjang: 5 },
    { kode: '6', nama: 'DIPLOMA I/II', jenjang: 6 },
    { kode: '7', nama: 'AKADEMI/DIPLOMA III/S.MUDA', jenjang: 7 },
    { kode: '8', nama: 'DIPLOMA IV/STRATA I', jenjang: 8 },
    { kode: '9', nama: 'STRATA II', jenjang: 9 },
    { kode: '10', nama: 'STRATA III', jenjang: 10 },
  ];

  for (const item of pendidikans) {
    await prisma.refPendidikan.upsert({
      where: { kode: item.kode },
      update: item,
      create: item,
    });
  }

  const statusPerkawinan = [
    { kode: '1', nama: 'BELUM KAWIN' },
    { kode: '2', nama: 'KAWIN' },
    { kode: '3', nama: 'CERAI HIDUP' },
    { kode: '4', nama: 'CERAI MATI' },
  ];

  for (const item of statusPerkawinan) {
    await prisma.refStatusPerkawinan.upsert({
      where: { kode: item.kode },
      update: item,
      create: item,
    });
  }

  const golDarah = [
    { kode: 'A', nama: 'A' },
    { kode: 'B', nama: 'B' },
    { kode: 'AB', nama: 'AB' },
    { kode: 'O', nama: 'O' },
    { kode: 'A+', nama: 'A+' },
    { kode: 'A-', nama: 'A-' },
    { kode: 'B+', nama: 'B+' },
    { kode: 'B-', nama: 'B-' },
    { kode: 'AB+', nama: 'AB+' },
    { kode: 'AB-', nama: 'AB-' },
    { kode: 'O+', nama: 'O+' },
    { kode: 'O-', nama: 'O-' },
    { kode: 'UNK', nama: 'TIDAK TAHU' },
  ];

  for (const item of golDarah) {
    await prisma.refGolonganDarah.upsert({
      where: { kode: item.kode },
      update: item,
      create: item,
    });
  }
}
