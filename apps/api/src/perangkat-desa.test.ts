import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './app';
import { getTestAdmin, cleanupTestData, prisma } from './fixtures/auth.fixture';

describe('PerangkatDesa API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  const TEST_DESA_ID = BigInt(process.env.DESA_ID || '1');

  const basePenduduk = {
    nik: '3271059999999991',
    namaLengkap: 'Budi Santoso',
    tempatLahir: 'Jakarta',
    tanggalLahir: new Date('1975-03-15'),
    jenisKelamin: 'L' as const,
    statusPerkawinan: 'Kawin',
    wargaNegara: 'Indonesia',
    isAktif: true,
    desaId: TEST_DESA_ID,
  };

  beforeAll(async () => {
    admin = await getTestAdmin();
  });

  afterAll(async () => {
    await cleanupTestData('327105');
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupTestData('327105');
  });

  describe('Authentication', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/perangkat-desa').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/perangkat-desa')
        .set('Authorization', 'Bearer invalid')
        .expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/perangkat-desa', () => {
    it('returns perangkat desa list with pagination', async () => {
      const res = await request(app)
        .get('/api/perangkat-desa')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns perangkat desa detail', async () => {
      // Create test data
      const desa = await prisma.desa.findFirst();
      const penduduk = await prisma.penduduk.create({ data: basePenduduk });

      if (desa) {
        const perangkat = await prisma.perangkatDesa.create({
          data: {
            pendudukId: penduduk.id,
            desaId: desa.id,
            jabatan: 'KEPALA_DESA',
            status: 'AKTIF',
          },
        });

        const res = await request(app)
          .get(`/api/perangkat-desa/${perangkat.id}`)
          .set('Authorization', `Bearer ${admin.token}`)
          .expect(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('returns 404 for non-existent perangkat desa', async () => {
      const res = await request(app)
        .get('/api/perangkat-desa/999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/perangkat-desa', () => {
    it('creates perangkat desa', async () => {
      const desa = await prisma.desa.findFirst();
      const penduduk = await prisma.penduduk.create({ data: basePenduduk });

      if (desa) {
        const res = await request(app)
          .post('/api/perangkat-desa')
          .set('Authorization', `Bearer ${admin.token}`)
          .send({
            pendudukId: penduduk.id.toString(),
            jabatan: 'KEPALA_DESA',
            status: 'AKTIF',
          })
          .expect(201);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('Authorization', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/perangkat-desa')
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns perangkat desa with proper permission', async () => {
      const res = await request(app)
        .get('/api/perangkat-desa')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
      expect(res.body.success).toBe(true);
    });
  });
});
