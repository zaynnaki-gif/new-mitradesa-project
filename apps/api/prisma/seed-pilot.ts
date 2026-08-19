/**
 * PHASE 5.0 - PILOT SEED DATA
 *
 * Purpose: Create realistic pilot village data for Phase 5.0 validation
 * Database: STAGING (NOT production)
 *
 * This script creates:
 * 1. Village identity (IdentitasDesa)
 * 2. Government structure (PerangkatDesa)
 * 3. CMS data (Kategori, Berita, Halaman, Media)
 * 4. Service templates (Layanan)
 * 5. Admin roles with least privilege
 * 6. Sample document templates
 *
 * SAFETY: This script includes guards to prevent running on wrong environments.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

// ============================================================
// SAFETY GUARD - Prevent accidental production execution
// ============================================================

const SAFETY_CHECK_ENABLED = true;

function verifyEnvironment(): boolean {
  if (!SAFETY_CHECK_ENABLED) {
    return true;
  }

  const nodeEnv = process.env.NODE_ENV || 'unknown';
  const dbUrl = (process.env.DATABASE_URL || '').toLowerCase();

  console.log('===========================================');
  console.log('ENVIRONMENT SAFETY CHECK');
  console.log('===========================================');
  console.log(`NODE_ENV: ${nodeEnv}`);
  console.log(`DATABASE_URL: ${dbUrl.substring(0, 30)}...`);
  console.log('');

  // Check 1: NODE_ENV must be 'staging'
  if (nodeEnv !== 'staging') {
    console.error('❌ ERROR: NODE_ENV must be "staging" to run this seed.');
    console.error(`   Current NODE_ENV: "${nodeEnv}"`);
    console.error('');
    console.error('   Set NODE_ENV before running:');
    console.error('   NODE_ENV=staging npx tsx prisma/seed-pilot.ts');
    console.error('===========================================');
    return false;
  }

  // Check 2: DATABASE_URL must contain 'staging'
  if (!dbUrl.includes('staging')) {
    console.error('❌ ERROR: DATABASE_URL must contain "staging" to run this seed.');
    console.error(`   Current DATABASE_URL does not appear to be staging.`);
    console.error('');
    console.error('   DO NOT run this on production!');
    console.error('===========================================');
    return false;
  }

  // Check 3: Block known production patterns
  const productionPatterns = ['supabase', 'prod', 'production', 'aws-', 'azure'];
  const isProduction = productionPatterns.some(p => dbUrl.includes(p) && !dbUrl.includes('staging'));

  if (isProduction) {
    console.error('❌ ERROR: DATABASE_URL appears to be PRODUCTION.');
    console.error('   This seed will NOT run on production database!');
    console.error('===========================================');
    return false;
  }

  console.log('✅ Environment check PASSED');
  console.log('===========================================');
  console.log('');
  console.log('⚠️  WARNING: About to seed STAGING database!');
  console.log('   This will create test data.');
  console.log('');

  return true;
}

// Verify environment BEFORE any database operations
if (!verifyEnvironment()) {
  process.exit(1);
}

// ============================================================
// SEED EXECUTION
// ============================================================

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

// PILOT VILLAGE DATA
const PILOT_VILLAGE = {
  nama: 'Desa Mitradesa',
  singkatan: 'Desa Mitra',
  kodeDesa: '3271052001',
  alamat: 'Jl. Desa Mitradesa No. 1, RT 001/RW 001',
  kodepos: '40191',
  telepon: '022-12345678',
  whatsapp: '6281234567890',
  email: 'desamitrasa@email.id',
  website: 'https://mitradesa.desa.id',
  kepalaDesa: 'Budi Santoso',
  sekretarisDesa: 'Siti Aminah',
};

const PEMERINTAHAN = [
  {
    nama: 'Budi Santoso',
    nik: '3271050101700001',
    jabatan: 'KEPALA_DESA',
    noHp: '6281234567001',
    email: 'budi.santoso@email.id',
  },
  {
    nama: 'Siti Aminah',
    nik: '3271050101750002',
    jabatan: 'SEKRETARIS_DESA',
    noHp: '6281234567002',
    email: 'siti.aminah@email.id',
  },
  {
    nama: 'Ahmad Hidayat',
    nik: '3271050101800003',
    jabatan: 'KEPALA_WILAYAH',
    noHp: '6281234567003',
    email: 'ahmad.hidayat@email.id',
  },
  {
    nama: 'Dewi Lestari',
    nik: '3271050101820004',
    jabatan: 'KEPALA_KESEJAHTERAAN',
    noHp: '6281234567004',
    email: 'dewi.lestari@email.id',
  },
  {
    nama: 'Rudi Hermawan',
    nik: '3271050101850005',
    jabatan: 'KEPALA_URUSAN',
    noHp: '6281234567005',
    email: 'rudi.hermawan@email.id',
  },
];

const KATEGORI = [
  { nama: 'Berita Desa', deskripsi: 'Berita dan informasi dari desa' },
  { nama: 'Pengumuman', deskripsi: 'Pengumuman resmi desa' },
  { nama: 'Kegiatan', deskripsi: 'Kegiatan dan acara desa' },
  { nama: 'Prestasi', deskripsi: 'Prestasi dan penghargaan' },
  { nama: 'Budaya', deskripsi: 'Budaya dan tradisi lokal' },
];

const BERITA = [
  {
    judul: 'Musyawarah Desa Perencanaan Pembangunan 2026',
    slug: 'musyawarah-desa-perencanaan-pembangunan-2026',
    konten: 'Pada tanggal 15 Januari 2026, Pemerintah Desa Mitradesa mengadakan musyawarah desa untuk perencanaan pembangunan tahun 2026. Acara ini diikuti oleh seluruh perangkat desa, BPD, RT/RW, dan perwakilan masyarakat.',
    kategori: 'Berita Desa',
  },
  {
    judul: 'Pelayanan KTP dan KK Massal',
    slug: 'pelayanan-ktp-dan-kk-massal',
    konten: 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten akan melakukan pelayanan KTP dan KK massal di Desa Mitradesa pada tanggal 20-25 Februari 2026. Masyarakat dihimbau untuk membawa dokumen pendukung.',
    kategori: 'Pengumuman',
  },
  {
    judul: 'Gotong Royong Mingguan',
    slug: 'gotong-royong-mingguan',
    konten: 'Setiap hari Minggu, masyarakat Desa Mitradesa melaksanakan gotong royong untuk membersihkan lingkungan. Ayo partisipasi untuk desa yang bersih dan sehat!',
    kategori: 'Kegiatan',
  },
  {
    judul: 'Desa Mitradesa Raih Desa Award 2025',
    slug: 'desa-mitradsa-raih-desa-award-2025',
    konten: 'Atas dedikasi dan kerja keras seluruh masyarakat, Desa Mitradesa berhasil meraih Desa Award 2025 dari Pemerintah Kabupaten dalam kategori Desa Terbersih dan Desa Paling Aktif.',
    kategori: 'Prestasi',
  },
  {
    judul: 'Rangkaian Hari Kemerdekaan',
    slug: 'rangkaian-hari-kemerdekaan',
    konten: 'Memperingati Hari Kemerdekaan RI ke-81, Desa Mitradesa akan mengadakan berbagai kegiatan seperti lomba voli, PBB, dan gerak jalan. Mari turut meriahkan!',
    kategori: 'Kegiatan',
  },
  {
    judul: 'Workshop Batik Tulis',
    slug: 'workshop-batik-tulis',
    konten: 'Dinas Kebudayaan Kabupaten akan mengadakan workshop batik tulis untuk melestarikan budaya lokal. Peserta akan belajar teknik membatik dari maestro batik lokal.',
    kategori: 'Budaya',
  },
  {
    judul: 'Program Bantuan Sosial',
    slug: 'program-bantuan-sosial',
    konten: 'Pemerintah Desa Mitradesa membuka pendaftaran program bantuan sosial untuk keluarga kurang mampu. Pendaftaran dapat dilakukan di Kantor Desa.',
    kategori: 'Pengumuman',
  },
  {
    judul: 'Peringatan Hari Jadi Desa',
    slug: 'peringatan-hari-jadi-desa',
    konten: 'Desa Mitradesa merayakan Hari Jadi Desa ke-75 pada tanggal 1 Maret 2026 dengan berbagai kegiatan dan hiburan.',
    kategori: 'Berita Desa',
  },
];

const HALAMAN = [
  {
    judul: 'Profil Desa',
    slug: 'profil-desa',
    konten: '<h2>Profil Desa Mitradesa</h2><p>Desa Mitradesa merupakan salah satu desa di Kabupaten Bandung yang memiliki potensi besar dalam bidang pertanian dan pariwisata.</p>',
    isPublished: true,
  },
  {
    judul: 'Visi Misi',
    slug: 'visi-misi',
    konten: '<h2>Visi</h2><p>Terwujudnya Desa Mitradesa yang maju, mandiri, dan sejahtera.</p><h2>Misi</h2><ul><li>Meningkatkan kualitas SDM</li><li>Mengembangkan potensi ekonomi lokal</li><li>Memperbaiki infrastruktur desa</li></ul>',
    isPublished: true,
  },
  {
    judul: 'Struktur Organisasi',
    slug: 'struktur-organisasi',
    konten: '<h2>Struktur Organisasi Pemerintah Desa</h2><p>Struktur organisasi Pemerintah Desa Mitradesa terdiri dari Kepala Desa, Sekretariat, dan Urusan.</p>',
    isPublished: true,
  },
];

const LAYANAN = [
  {
    nama: 'Surat Keterangan Domisili',
    slug: 'surat-keterangan-domisili',
    deskripsi: 'Surat Keterangan Domisili adalah surat yang dibuat oleh Kepala Desa untuk membuktikan bahwa seseorang berdomisili di Desa Mitradesa.',
    estimatedDays: 1,
    requiredDocuments: 'KTP, KK',
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'alamat', label: 'Alamat Lengkap', type: 'textarea', required: true },
      { name: 'keperluan', label: 'Keperluan', type: 'textarea', required: true },
    ],
  },
  {
    nama: 'Surat Keterangan Usaha',
    slug: 'surat-keterangan-usaha',
    deskripsi: 'Surat Keterangan Usaha adalah surat yang dibuat oleh Kepala Desa untuk membuktikan bahwa seseorang memiliki usaha di Desa Mitradesa.',
    estimatedDays: 1,
    requiredDocuments: 'KTP, NPWP (jika ada)',
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'jenisUsaha', label: 'Jenis Usaha', type: 'text', required: true },
      { name: 'alamatUsaha', label: 'Alamat Usaha', type: 'textarea', required: true },
      { name: 'keperluan', label: 'Keperluan', type: 'textarea', required: true },
    ],
  },
  {
    nama: 'Surat Pengantar',
    slug: 'surat-pengantar',
    deskripsi: 'Surat Pengantar adalah surat yang dibuat oleh Kepala Desa untuk keperluan administrasi kependudukan.',
    estimatedDays: 1,
    requiredDocuments: 'KTP, KK',
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'tujuan', label: 'Tujuan Surat', type: 'text', required: true },
      { name: 'keterangan', label: 'Keterangan', type: 'textarea', required: true },
    ],
  },
  {
    nama: 'Surat Keterangan Tidak Mampu',
    slug: 'surat-keterangan-tidak-mampu',
    deskripsi: 'Surat Keterangan Tidak Mampu adalah surat yang dibuat oleh Kepala Desa untuk membantu masyarakat yang tidak mampu dalam urusan administrasi.',
    estimatedDays: 2,
    requiredDocuments: 'KTP, KK, Surat Keterangan RT/RW',
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'alamat', label: 'Alamat Lengkap', type: 'textarea', required: true },
      { name: 'keperluan', label: 'Keperluan', type: 'textarea', required: true },
      { name: 'penghasilan', label: 'Perkiraan Penghasilan Bulanan', type: 'text', required: true },
    ],
  },
];

// ROLES FOR PILOT
const PILOT_ROLES = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Full system access for system administrator',
    isSystem: true,
    permissions: ['*'], // All permissions
  },
  {
    name: 'Admin Desa',
    code: 'ADMIN_DESA',
    description: 'Village admin with full operational access',
    isSystem: true,
    permissions: [
      'penduduk.*',
      'keluarga.*',
      'perangkat_desa.*',
      'kategori.*',
      'berita.*',
      'halaman.*',
      'media.*',
      'layanan.*',
      'template_surat.*',
      'permintaan_layanan.*',
      'dokumen.*',
      'penanda_tangan.*',
      'nomor_dokumen.*',
      'identitas_desa.*',
      'audit.view',
    ],
  },
  {
    name: 'Operator',
    code: 'OPERATOR',
    description: 'Data entry operator - can manage penduduk, keluarga, and devices',
    isSystem: true,
    permissions: [
      'penduduk.create',
      'penduduk.view',
      'penduduk.update',
      'keluarga.create',
      'keluarga.view',
      'keluarga.update',
      'perangkat_desa.create',
      'perangkat_desa.view',
      'perangkat_desa.update',
    ],
  },
  {
    name: 'Editor CMS',
    code: 'EDITOR_CMS',
    description: 'Content editor for website CMS',
    isSystem: true,
    permissions: [
      'kategori.create',
      'kategori.view',
      'kategori.update',
      'kategori.delete',
      'berita.create',
      'berita.view',
      'berita.update',
      'berita.delete',
      'halaman.create',
      'halaman.view',
      'halaman.update',
      'halaman.delete',
      'media.upload',
      'media.view',
      'media.update',
      'media.delete',
    ],
  },
  {
    name: 'Petugas Pelayanan',
    code: 'PETUGAS_PELAYANAN',
    description: 'Service officer - processes citizen requests',
    isSystem: true,
    permissions: [
      'layanan.view',
      'template_surat.view',
      'permintaan_layanan.view',
      'permintaan_layanan.update',
      'dokumen.view',
      'dokumen.create',
      'nomor_dokumen.view',
      'nomor_dokumen.create',
      'identitas_desa.view',
    ],
  },
  {
    name: 'Penandatangan',
    code: 'PENANDATANGAN',
    description: 'Document signer - can sign documents',
    isSystem: true,
    permissions: [
      'layanan.view',
      'template_surat.view',
      'permintaan_layanan.view',
      'permintaan_layanan.update',
      'dokumen.view',
      'dokumen.create',
      'dokumen.sign',
      'penanda_tangan.view',
      'penanda_tangan.create',
      'penanda_tangan.update',
      'nomor_dokumen.view',
      'nomor_dokumen.create',
    ],
  },
];

async function createPermissions() {
  console.log('Creating permissions...');

  const permissionGroups = {
    penduduk: ['view', 'create', 'update', 'delete'],
    keluarga: ['view', 'create', 'update', 'delete'],
    perangkat_desa: ['view', 'create', 'update', 'delete'],
    kategori: ['view', 'create', 'update', 'delete'],
    berita: ['view', 'create', 'update', 'delete'],
    halaman: ['view', 'create', 'update', 'delete'],
    media: ['view', 'upload', 'update', 'delete'],
    layanan: ['view', 'create', 'update', 'delete'],
    template_surat: ['view', 'create', 'update', 'delete'],
    permintaan_layanan: ['view', 'create', 'update'],
    dokumen: ['view', 'create', 'sign'],
    penanda_tangan: ['view', 'create', 'update', 'delete'],
    nomor_dokumen: ['view', 'create'],
    identitas_desa: ['view', 'update'],
    audit: ['view'],
    akun: ['view_all', 'create', 'update', 'delete'],
    role: ['view', 'manage'],
    permission: ['view', 'manage'],
    konfigurasi: ['view', 'manage'],
  };

  const permissions: { name: string; code: string; groupName: string }[] = [];

  for (const [group, actions] of Object.entries(permissionGroups)) {
    for (const action of actions) {
      const code = `${group}.${action}`;
      const name = `${group.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} ${action.charAt(0).toUpperCase() + action.slice(1)}`;
      permissions.push({ name, code, groupName: group });
    }
  }

  // Add wildcard permission
  permissions.push({ name: 'Full Access', code: '*', groupName: 'system' });

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  console.log(`Created ${permissions.length} permissions`);
  return permissions;
}

async function createRoles(permissions: { code: string }[]) {
  console.log('Creating roles...');

  for (const role of PILOT_ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { description: role.description },
      create: {
        name: role.name,
        code: role.code,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    const dbRole = await prisma.role.findUnique({ where: { code: role.code } });

    if (dbRole) {
      // Clear existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: dbRole.id },
      });

      // Assign new permissions
      for (const permCode of role.permissions) {
        if (permCode === '*') {
          // Assign all permissions
          for (const perm of permissions) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: dbRole.id,
                  permissionId: (await prisma.permission.findUnique({ where: { code: perm.code } }))!.id,
                },
              },
              update: {},
              create: {
                roleId: dbRole.id,
                permissionId: (await prisma.permission.findUnique({ where: { code: perm.code } }))!.id,
              },
            });
          }
        } else if (permCode.endsWith('.*')) {
          // Assign all permissions in group
          const group = permCode.replace('.*', '');
          const groupPerms = permissions.filter((p) => p.code.startsWith(`${group}.`));
          for (const perm of groupPerms) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: dbRole.id,
                  permissionId: (await prisma.permission.findUnique({ where: { code: perm.code } }))!.id,
                },
              },
              update: {},
              create: {
                roleId: dbRole.id,
                permissionId: (await prisma.permission.findUnique({ where: { code: perm.code } }))!.id,
              },
            });
          }
        } else {
          // Assign specific permission
          const perm = await prisma.permission.findUnique({ where: { code: permCode } });
          if (perm) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: dbRole.id,
                  permissionId: perm.id,
                },
              },
              update: {},
              create: {
                roleId: dbRole.id,
                permissionId: perm.id,
              },
            });
          }
        }
      }
    }

    console.log(`Created role: ${role.name}`);
  }
}

async function createAdminAccounts() {
  console.log('Creating pilot admin accounts...');

  const accounts = [
    {
      username: 'superadmin',
      email: 'superadmin@mitradesa.pilot',
      password: 'SuperAdmin123!',
      roleCode: 'SUPER_ADMIN',
    },
    {
      username: 'admin_desa',
      email: 'admin@mitradesa.pilot',
      password: 'AdminDesa123!',
      roleCode: 'ADMIN_DESA',
    },
    {
      username: 'operator',
      email: 'operator@mitradesa.pilot',
      password: 'Operator123!',
      roleCode: 'OPERATOR',
    },
    {
      username: 'editor_cms',
      email: 'editor@mitradesa.pilot',
      password: 'EditorCMS123!',
      roleCode: 'EDITOR_CMS',
    },
    {
      username: 'petugas',
      email: 'petugas@mitradesa.pilot',
      password: 'Petugas123!',
      roleCode: 'PETUGAS_PELAYANAN',
    },
    {
      username: 'penandatangan',
      email: 'penandatangan@mitradesa.pilot',
      password: 'Penandatangan123!',
      roleCode: 'PENANDATANGAN',
    },
  ];

  for (const account of accounts) {
    const role = await prisma.role.findUnique({ where: { code: account.roleCode } });
    const passwordHash = await bcrypt.hash(account.password, BCRYPT_ROUNDS);

    const existing = await prisma.account.findUnique({
      where: { username: account.username },
    });

    if (!existing) {
      const newAccount = await prisma.account.create({
        data: {
          username: account.username,
          email: account.email,
          passwordHash,
          status: 'ACTIVE',
        },
      });

      if (role) {
        await prisma.accountRole.create({
          data: {
            accountId: newAccount.id,
            roleId: role.id,
          },
        });
      }

      console.log(`Created account: ${account.username} (password: ${account.password})`);
    } else {
      console.log(`Account already exists: ${account.username}`);
    }
  }
}

async function createVillageIdentity() {
  console.log('Creating village identity...');

  // First create the administrative hierarchy
  const provinsi = await prisma.provinsi.upsert({
    where: { kode: '32' },
    update: {},
    create: {
      kode: '32',
      nama: 'Jawa Barat',
    },
  });

  const kabupaten = await prisma.kabupaten.upsert({
    where: { provinsiId_kode: { provinsiId: provinsi.id, kode: '04' } },
    update: {},
    create: {
      provinsiId: provinsi.id,
      kode: '04',
      nama: 'Kabupaten Bandung',
    },
  });

  const kecamatan = await prisma.kecamatan.upsert({
    where: { kabupatenId_kode: { kabupatenId: kabupaten.id, kode: '01' } },
    update: {},
    create: {
      kabupatenId: kabupaten.id,
      kode: '01',
      nama: 'Kecamatan Contoh',
    },
  });

  const desa = await prisma.desa.upsert({
    where: { kecamatanId_kode: { kecamatanId: kecamatan.id, kode: PILOT_VILLAGE.kodeDesa } },
    update: {},
    create: {
      kecamatanId: kecamatan.id,
      kode: PILOT_VILLAGE.kodeDesa,
      nama: PILOT_VILLAGE.nama,
    },
  });

  await prisma.identitasDesa.upsert({
    where: { desaId: desa.id },
    update: {
      namaDesa: PILOT_VILLAGE.nama,
      singkatanDesa: PILOT_VILLAGE.singkatan,
      kodeDesa: PILOT_VILLAGE.kodeDesa,
      alamat: PILOT_VILLAGE.alamat,
      kodepos: PILOT_VILLAGE.kodepos,
      telepon: PILOT_VILLAGE.telepon,
      whatsapp: PILOT_VILLAGE.whatsapp,
      email: PILOT_VILLAGE.email,
      website: PILOT_VILLAGE.website,
      kepalaDesa: PILOT_VILLAGE.kepalaDesa,
      sekretarisDesa: PILOT_VILLAGE.sekretarisDesa,
    },
    create: {
      desaId: desa.id,
      namaDesa: PILOT_VILLAGE.nama,
      singkatanDesa: PILOT_VILLAGE.singkatan,
      kodeDesa: PILOT_VILLAGE.kodeDesa,
      alamat: PILOT_VILLAGE.alamat,
      kodepos: PILOT_VILLAGE.kodepos,
      telepon: PILOT_VILLAGE.telepon,
      whatsapp: PILOT_VILLAGE.whatsapp,
      email: PILOT_VILLAGE.email,
      website: PILOT_VILLAGE.website,
      kepalaDesa: PILOT_VILLAGE.kepalaDesa,
      sekretarisDesa: PILOT_VILLAGE.sekretarisDesa,
    },
  });

  console.log('Village identity created');
  return desa;
}

async function createGovernmentStructure(desa: { id: bigint }) {
  console.log('Creating government structure...');

  // Create a dummy penduduk for each perangkat if needed
  for (const perangkat of PEMERINTAHAN) {
    // Check if perangkat already exists by checking if we have one with this jabatan
    const existing = await prisma.perangkatDesa.findFirst({
      where: {
        desaId: desa.id,
        jabatan: perangkat.jabatan as string
      }
    });

    if (existing) {
      console.log(`Perangkat ${perangkat.jabatan} already exists, skipping...`);
      continue;
    }

    // Create dummy penduduk first
    const penduduk = await prisma.penduduk.create({
      data: {
        nik: perangkat.nik,
        namaLengkap: perangkat.nama,
        tempatLahir: 'Bandung',
        tanggalLahir: new Date('1970-01-01'),
        jenisKelamin: 'L',
        statusPerkawinan: 'KAWIN',
        alamat: 'Desa Mitradesa',
        desaId: desa.id,
      }
    });

    await prisma.perangkatDesa.create({
      data: {
        pendudukId: penduduk.id,
        desaId: desa.id,
        jabatan: perangkat.jabatan as string,
        status: 'AKTIF',
      },
    });
  }

  console.log('Government structure created');
}

async function createCMSData() {
  console.log('Creating CMS data...');

  // Get desa
  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.log('Village not found, skipping CMS data');
    return;
  }

  // Create categories
  const kategoriMap: Record<string, bigint> = {};
  for (const kat of KATEGORI) {
    const kategori = await prisma.kategori.upsert({
      where: { slug: kat.nama.toLowerCase().replace(/ /g, '-') },
      update: { nama: kat.nama, deskripsi: kat.deskripsi },
      create: {
        desaId: desa.id,
        nama: kat.nama,
        slug: kat.nama.toLowerCase().replace(/ /g, '-'),
        deskripsi: kat.deskripsi,
      },
    });
    kategoriMap[kat.nama] = kategori.id;
  }

  // Create berita
  for (const berita of BERITA) {
    const kategoriId = kategoriMap[berita.kategori];
    if (!kategoriId) continue;

    await prisma.berita.upsert({
      where: { slug: berita.slug },
      update: {
        judul: berita.judul,
        konten: berita.konten,
        kategoriId,
        status: 'PUBLISHED',
      },
      create: {
        judul: berita.judul,
        slug: berita.slug,
        konten: berita.konten,
        excerpt: berita.konten.substring(0, 150) + '...',
        kategoriId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  // Create halaman
  for (const halaman of HALAMAN) {
    await prisma.halaman.upsert({
      where: { slug: halaman.slug },
      update: {
        judul: halaman.judul,
        konten: halaman.konten,
        status: halaman.isPublished ? 'PUBLISHED' : 'DRAFT',
      },
      create: {
        judul: halaman.judul,
        slug: halaman.slug,
        konten: halaman.konten,
        status: halaman.isPublished ? 'PUBLISHED' : 'DRAFT',
      },
    });
  }

  console.log('CMS data created');
}

async function createServices() {
  console.log('Creating services...');

  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.log('Village not found, skipping services');
    return;
  }

  for (let i = 0; i < LAYANAN.length; i++) {
    const layanan = LAYANAN[i];
    // Generate unique kode from slug and index
    const kode = `${layanan.slug.toUpperCase().replace(/-/g, '').substring(0, 8)}_${i + 1}`;

    await prisma.layanan.upsert({
      where: { slug: layanan.slug },
      update: {
        nama: layanan.nama,
        deskripsi: layanan.deskripsi,
        kategori: 'Umum',
        isActive: true,
      },
      create: {
        desaId: desa.id,
        kode: kode,
        nama: layanan.nama,
        slug: layanan.slug,
        deskripsi: layanan.deskripsi,
        kategori: 'Umum',
        isActive: true,
      },
    });
  }

  console.log('Services created');
}

async function main() {
  console.log('===========================================');
  console.log('PHASE 5.0 - PILOT SEED DATA');
  console.log('===========================================');
  console.log('');
  console.log('⚠️  WARNING: This script is for STAGING database only!');
  console.log('⚠️  DO NOT run against production database!');
  console.log('');
  console.log('Running with:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  Database: ${(process.env.DATABASE_URL || 'not set').replace(/\/\/.*:.*@/, '//***:***@')}`);
  console.log('');

  try {
    // Create permissions
    const permissions = await createPermissions();

    // Create roles with least privilege
    await createRoles(permissions);

    // Create admin accounts
    await createAdminAccounts();

    // Create village identity
    const desa = await createVillageIdentity();

    // Create government structure
    await createGovernmentStructure(desa);

    // Create CMS data
    await createCMSData();

    // Create services
    await createServices();

    console.log('');
    console.log('===========================================');
    console.log('PILOT SEED COMPLETED SUCCESSFULLY!');
    console.log('===========================================');
    console.log('');
    console.log('Pilot Accounts:');
    console.log('  superadmin    / SuperAdmin123!');
    console.log('  admin_desa    / AdminDesa123!');
    console.log('  operator      / Operator123!');
    console.log('  editor_cms    / EditorCMS123!');
    console.log('  petugas       / Petugas123!');
    console.log('  penandatangan / Penandatangan123!');
    console.log('');
    console.log('Village: ' + PILOT_VILLAGE.nama);
    console.log('Kode Desa: ' + PILOT_VILLAGE.kodeDesa);
    console.log('');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
