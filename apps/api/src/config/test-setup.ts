// Test setup file for Jest
/* eslint-disable no-console */
import dotenv from 'dotenv';
import { jest, beforeAll, afterAll } from '@jest/globals';

// CRITICAL: Load test environment BEFORE anything else
// This ensures TEST_DATABASE_URL is set before Prisma initializes
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for tests
jest.setTimeout(60000);

// Import safety guard - MUST be before any Prisma/DB operations
import { assertTestDatabase } from '../utils/database-safety';

// CRITICAL: Clear any cached Prisma singleton to force re-initialization
// This prevents production DATABASE_URL from being reused
if (typeof global !== 'undefined' && (global as Record<string, unknown>).prisma !== undefined) {
  delete (global as Record<string, unknown>).prisma;
}

// CRITICAL: Validate we're using a safe test database BEFORE any DB operations
try {
  assertTestDatabase();
  console.log('✓ Database safety check PASSED - using isolated test database');
  console.log('✓ TEST_DATABASE_URL:', process.env.TEST_DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
} catch (error) {
  console.error('\n' + '='.repeat(80));
  console.error('FATAL: Database safety check FAILED');
  console.error('='.repeat(80));
  console.error((error as Error).message);
  console.error('='.repeat(80));
  console.error('\nTests CANNOT run against production/development databases.');
  console.error('Please configure TEST_DATABASE_URL to a dedicated test database.');
  console.error('\n');
  // Exit with non-zero code to fail fast
  process.exit(1);
}

// Import for cleanup (only runs after safety check passes)
import { prisma, cleanupAllTestSessions } from '../fixtures/auth.fixture';

// Global beforeAll - ensure single-tenant environment is initialized
beforeAll(async () => {
  try {
    // Single-tenant: ensure IdentitasDesa exists (the source of truth)
    const identitas = await prisma.identitasDesa.findFirst();
    if (!identitas) {
      // Create regions first
      let provinsi = await prisma.provinsi.findFirst();
      if (!provinsi) {
        provinsi = await prisma.provinsi.create({
          data: { kode: '51', nama: 'Bali' }
        });
      }

      let kabupaten = await prisma.kabupaten.findFirst();
      if (!kabupaten) {
        kabupaten = await prisma.kabupaten.create({
          data: { kode: '5101', nama: 'Jembrana', provinsiId: provinsi.id }
        });
      }

      let kecamatan = await prisma.kecamatan.findFirst();
      if (!kecamatan) {
        kecamatan = await prisma.kecamatan.create({
          data: { kode: '510101', nama: 'Melaya', kabupatenId: kabupaten.id }
        });
      }

      // Create DesaConfig
      const desaConfig = await prisma.desaConfig.create({
        data: {
          kecamatanId: kecamatan.id,
          kode: process.env.DESA_KODE || '5101012001',
          nama: process.env.DESA_NAMA || 'Desa Seruni Mumbul',
        }
      });

      // Create IdentitasDesa (single-tenant source of truth)
      await prisma.identitasDesa.create({
        data: {
          desaConfigId: desaConfig.id,
          namaDesa: process.env.DESA_NAMA || 'Desa Seruni Mumbul',
          kodeDesa: process.env.DESA_KODE || '5101012001',
          kepalaDesa: 'Administrator',
          alamat: '-',
          email: '-',
          telepon: '-',
        }
      });

      console.log('✓ Created default test IdentitasDesa instance');
    }
  } catch (error) {
    console.error('Failed to create default test IdentitasDesa:', error);
  }
});

// Global afterAll - cleanup all sessions created during tests
afterAll(async () => {
  try {
    // Cleanup all test sessions to prevent session accumulation
    await cleanupAllTestSessions();
  } catch (error) {
    // Ignore cleanup errors
  }
});
