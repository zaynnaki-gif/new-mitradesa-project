import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './app';
import { getTestAdmin, cleanupTestData, prisma } from './fixtures/auth.fixture';

describe('Keluarga API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  const TEST_DESA_ID = BigInt(process.env.DESA_ID || '1');

  const basePenduduk = {
    nik: '3271059876543210',
    namaLengkap: 'Jane Doe',
    tempatLahir: 'Bandung',
    tanggalLahir: new Date('1985-05-10'),
    jenisKelamin: 'P' as const,
    statusPerkawinan: 'Kawin',
    wargaNegara: 'Indonesia',
    isAktif: true,
    desaId: TEST_DESA_ID,
  };

  const baseKeluarga = {
    noKk: '3271050000000001',
    alamat: 'Jl. Desa No 1',
    rt: '01',
    rw: '01',
    desaId: TEST_DESA_ID,
  };

  const { desaId: _kDesaId, ...baseKeluargaPayload } = baseKeluarga;

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
      const res = await request(app).get('/api/keluarga').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/keluarga')
        .set('Authorization', 'Bearer invalid')
        .expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/keluarga', () => {
    it('returns keluarga list with pagination', async () => {
      const res = await request(app)
        .get('/api/keluarga')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('returns keluarga detail', async () => {
      const p = await prisma.penduduk.create({ data: basePenduduk });
      const k = await prisma.keluarga.create({
        data: { noKk: '3271050000000002', kepalaId: p.id, alamat: 'Alamat Test', desaId: TEST_DESA_ID },
      });

      const res = await request(app)
        .get(`/api/keluarga/${k.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.noKk).toBe('3271050000000002');
    });

    it('returns 404 for non-existent keluarga', async () => {
      const res = await request(app)
        .get('/api/keluarga/999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/keluarga', () => {
    it('creates keluarga with kepala', async () => {
      const kepala = await prisma.penduduk.create({ data: basePenduduk });

      const res = await request(app)
        .post('/api/keluarga')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...baseKeluargaPayload, kepalaId: kepala.id.toString() })
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.noKk).toBe(baseKeluarga.noKk);
    });

    it('returns 400 for invalid kepala', async () => {
      const res = await request(app)
        .post('/api/keluarga')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...baseKeluargaPayload, kepalaId: '999999' })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 409 for duplicate noKk', async () => {
      const kepala = await prisma.penduduk.create({ data: basePenduduk });

      await request(app)
        .post('/api/keluarga')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...baseKeluargaPayload, kepalaId: kepala.id.toString() })
        .expect(201);

      const kepala2 = await prisma.penduduk.create({
        data: { ...basePenduduk, nik: '3271051111111111' },
      });

      const res = await request(app)
        .post('/api/keluarga')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...baseKeluargaPayload, kepalaId: kepala2.id.toString() })
        .expect(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /api/keluarga/:id', () => {
    it('updates keluarga', async () => {
      const p = await prisma.penduduk.create({ data: basePenduduk });
      const k = await prisma.keluarga.create({
        data: { noKk: '3271050000000003', kepalaId: p.id, desaId: TEST_DESA_ID },
      });

      const res = await request(app)
        .patch(`/api/keluarga/${k.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ alamat: 'Alamat Baru' })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent', async () => {
      const res = await request(app)
        .patch('/api/keluarga/999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ alamat: 'Test' })
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/keluarga/:id', () => {
    it('soft deletes keluarga', async () => {
      const p = await prisma.penduduk.create({ data: basePenduduk });
      const k = await prisma.keluarga.create({
        data: { noKk: '3271050000000004', kepalaId: p.id, desaId: TEST_DESA_ID },
      });

      await request(app)
        .delete(`/api/keluarga/${k.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      const deleted = await prisma.keluarga.findUnique({ where: { id: k.id } });
      expect(deleted?.deletedAt).toBeTruthy();
    });
  });

  describe('POST /api/keluarga/:id/anggota', () => {
    it('adds anggota to keluarga', async () => {
      const kepala = await prisma.penduduk.create({ data: basePenduduk });
      const keluarga = await prisma.keluarga.create({
        data: { noKk: '3271050000000005', kepalaId: kepala.id, desaId: TEST_DESA_ID },
      });

      const anggota = await prisma.penduduk.create({
        data: { ...basePenduduk, nik: '3271056666666666' },
      });

      const res = await request(app)
        .post(`/api/keluarga/${keluarga.id}/anggota`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ pendudukId: anggota.id.toString(), hubungan: 'ISTRI' })
        .expect(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for invalid keluarga', async () => {
      const anggota = await prisma.penduduk.create({
        data: { ...basePenduduk, nik: '3271058888888888' },
      });

      const res = await request(app)
        .post('/api/keluarga/999999/anggota')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ pendudukId: anggota.id.toString(), hubungan: 'ISTRI' })
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Authorization', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/keluarga')
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns keluarga with proper permission', async () => {
      const res = await request(app)
        .get('/api/keluarga')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
      expect(res.body.success).toBe(true);
    });
  });
});
