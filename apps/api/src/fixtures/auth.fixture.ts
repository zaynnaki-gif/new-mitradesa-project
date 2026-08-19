/**
 * Test Fixture - Authentication Utilities
 * Provides reusable test user creation and authentication
 */

import bcrypt from 'bcrypt';
import { prisma } from '../services/prisma.js';

export interface TestUser {
  accountId: bigint;
  token: string;
  username: string;
  password: string;
}

const BCRYPT_ROUNDS = 12;
const TEST_PASSWORD = 'test123456';

/**
 * Create or reuse test admin user for authentication
 */
export async function getTestAdmin(): Promise<TestUser> {
  const username = 'test_admin_e2e';

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);
  
  const account = await prisma.account.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email: 'test.admin@mitradesa.local',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  if (!account) {
    throw new Error('Failed to get or create test admin user');
  }

  // Create ADMIN role if not exists
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: 'Administrator',
      code: 'ADMIN',
      description: 'System Administrator for Testing',
      isSystem: true,
    },
  });

  if (adminRole) {
    // Assign ADMIN role if not already assigned
    await prisma.accountRole.upsert({
      where: {
        accountId_roleId: {
          accountId: account.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        accountId: account.id,
        roleId: adminRole.id,
      },
    });

    // Create all permissions for ADMIN
    const permissionDefs = [
      { name: 'Read Penduduk', code: 'penduduk.view' },
      { name: 'Create Penduduk', code: 'penduduk.create' },
      { name: 'Update Penduduk', code: 'penduduk.update' },
      { name: 'Delete Penduduk', code: 'penduduk.delete' },
      { name: 'Read Keluarga', code: 'keluarga.view' },
      { name: 'Create Keluarga', code: 'keluarga.create' },
      { name: 'Update Keluarga', code: 'keluarga.update' },
      { name: 'Delete Keluarga', code: 'keluarga.delete' },
      { name: 'Read Perangkat', code: 'perangkat_desa.view' },
      { name: 'Create Perangkat', code: 'perangkat_desa.create' },
      { name: 'Update Perangkat', code: 'perangkat_desa.update' },
      { name: 'Delete Perangkat', code: 'perangkat_desa.delete' },
      { name: 'Read Reference', code: 'reference.view' },
      { name: 'Create Reference', code: 'reference.create' },
      { name: 'Update Reference', code: 'reference.update' },
      { name: 'Delete Reference', code: 'reference.delete' },
      { name: 'Read Audit', code: 'audit.view' },
      { name: 'Read Config', code: 'config.view' },
      { name: 'Update Config', code: 'config.update' },
      // CMS Permissions
      { name: 'Read Kategori', code: 'kategori.view' },
      { name: 'Create Kategori', code: 'kategori.create' },
      { name: 'Update Kategori', code: 'kategori.update' },
      { name: 'Delete Kategori', code: 'kategori.delete' },
      { name: 'Read Berita', code: 'berita.view' },
      { name: 'Create Berita', code: 'berita.create' },
      { name: 'Update Berita', code: 'berita.update' },
      { name: 'Delete Berita', code: 'berita.delete' },
      { name: 'Read Halaman', code: 'halaman.view' },
      { name: 'Create Halaman', code: 'halaman.create' },
      { name: 'Update Halaman', code: 'halaman.update' },
      { name: 'Delete Halaman', code: 'halaman.delete' },
      { name: 'Read Media', code: 'media.view' },
      { name: 'Upload Media', code: 'media.upload' },
      { name: 'Update Media', code: 'media.update' },
      { name: 'Delete Media', code: 'media.delete' },
    ];

    for (const permDef of permissionDefs) {
      const permission = await prisma.permission.upsert({
        where: { code: permDef.code },
        update: {},
        create: {
          name: permDef.name,
          code: permDef.code,
          groupName: permDef.code.split('.')[0],
        },
      });

      if (permission && adminRole) {
        // Assign permission to role
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
  }

  // Create session token
  const tokenPayload = {
    sub: account.id.toString(),
    username: account.username,
    type: 'internal',
    exp: Date.now() + 86400000, // 24 hours
  };

  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

  // Try to find existing session first to avoid accumulation
  const existingSession = await prisma.internalSession.findFirst({
    where: {
      accountId: account.id,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingSession) {
    // Reuse existing valid session
    return {
      accountId: account.id,
      token: existingSession.token,
      username: account.username,
      password: TEST_PASSWORD,
    };
  }

  // Cleanup old sessions for this account before creating new one
  await prisma.internalSession.deleteMany({
    where: {
      accountId: account.id,
    },
  });

  // Store new session in database
  try {
    await prisma.internalSession.create({
      data: {
        accountId: account.id,
        token,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
  } catch (error: any) {
    // Session might already exist, that's OK
  }

  return {
    accountId: account.id,
    token,
    username: account.username,
    password: TEST_PASSWORD,
  };
}

/**
 * Clean up test sessions for a user
 */
export async function cleanupTestSessions(accountId: bigint): Promise<void> {
  await prisma.internalSession.deleteMany({
    where: { accountId },
  });
}

/**
 * Clean up test account and all related data
 */
export async function cleanupTestAccount(username: string): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { username },
  });

  if (account) {
    // Delete sessions
    await prisma.internalSession.deleteMany({
      where: { accountId: account.id },
    });

    // Delete account roles
    await prisma.accountRole.deleteMany({
      where: { accountId: account.id },
    });

    // Delete account
    await prisma.account.delete({
      where: { id: account.id },
    });
  }
}

/**
 * Clean up all test data (penduduk, keluarga, etc.)
 * Uses NIK prefix to identify test data
 */
export async function cleanupTestData(nikPrefix: string = '327105'): Promise<void> {
  // Delete test住户 directly using raw SQL
  await prisma.$executeRawUnsafe(`
    DELETE FROM anggota_keluarga
    WHERE keluarga_id IN (SELECT id FROM keluarga WHERE no_kk LIKE '${nikPrefix}%')
  `);

  await prisma.$executeRawUnsafe(`
    DELETE FROM keluarga WHERE no_kk LIKE '${nikPrefix}%'
  `);

  // Delete related perangkat_desa first to avoid FK constraint violations
  await prisma.$executeRawUnsafe(`
    DELETE FROM perangkat_desa 
    WHERE penduduk_id IN (SELECT id FROM penduduk WHERE nik LIKE '${nikPrefix}%')
  `);

  await prisma.$executeRawUnsafe(`
    DELETE FROM penduduk WHERE nik LIKE '${nikPrefix}%'
  `);
}

// Export prisma for direct use in tests
export { prisma };

/**
 * Clean up ALL test sessions (global cleanup)
 * Call this in afterAll or test setup to prevent session accumulation
 */
export async function cleanupAllTestSessions(): Promise<void> {
  try {
    // Delete sessions older than 1 hour to keep pool clean
    await prisma.internalSession.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });
  } catch (error) {
    // Ignore errors - connection pool issues
  }
}

/**
 * Delete test sessions by token prefix
 */
export async function cleanupTestSessionsByToken(tokenPrefix: string): Promise<void> {
  try {
    await prisma.internalSession.deleteMany({
      where: {
        token: {
          startsWith: tokenPrefix,
        },
      },
    });
  } catch (error) {
    // Ignore errors
  }
}
