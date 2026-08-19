import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './app';
import { getTestAdmin, cleanupTestData, prisma } from './fixtures/auth.fixture';

describe('Kategori API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  const TEST_DESA_ID = BigInt(process.env.DESA_ID || '1');

  const testKategori = {
    nama: 'Test Kategori',
    slug: 'test-kategori-' + Date.now(),
    deskripsi: 'Deskripsi kategori test',
    ikon: 'folder',
    warna: '#3B82F6',
    urutan: 100,
    isAktif: true,
    desaId: TEST_DESA_ID,
  };

  const { desaId: _, ...testKategoriPayload } = testKategori;

  beforeAll(async () => {
    admin = await getTestAdmin();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$executeRawUnsafe(`
      DELETE FROM kategori WHERE slug LIKE 'test-kategori-%'
    `);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Cleanup before each test
    await prisma.$executeRawUnsafe(`
      DELETE FROM kategori WHERE slug LIKE 'test-kategori-%'
    `);
  });

  describe('Authentication', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/kategori').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/kategori')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/kategori', () => {
    it('returns kategori list with pagination', async () => {
      const res = await request(app)
        .get('/api/kategori')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('filters by search query', async () => {
      // Create test kategori first
      await prisma.kategori.create({ data: testKategori });

      const res = await request(app)
        .get('/api/kategori?search=Test')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/kategori/active', () => {
    it('returns active kategoris without auth', async () => {
      // Create active kategori
      await prisma.kategori.create({ data: { ...testKategori, isAktif: true } });

      const res = await request(app)
        .get('/api/kategori/active')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/kategori', () => {
    it('creates kategori with valid data', async () => {
      const uniqueSlug = 'test-kategori-create-' + Date.now();

      const res = await request(app)
        .post('/api/kategori')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testKategoriPayload, slug: uniqueSlug })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.nama).toBe(testKategori.nama);
    });

    it('returns 409 for duplicate slug', async () => {
      const uniqueSlug = 'test-kategori-dup-' + Date.now();

      // Create first
      await request(app)
        .post('/api/kategori')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testKategoriPayload, slug: uniqueSlug })
        .expect(201);

      // Try duplicate
      const res = await request(app)
        .post('/api/kategori')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testKategoriPayload, slug: uniqueSlug })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 for invalid slug format', async () => {
      const res = await request(app)
        .post('/api/kategori')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testKategoriPayload, slug: 'Invalid Slug!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/kategori/:id', () => {
    it('updates kategori', async () => {
      const created = await prisma.kategori.create({ data: testKategori });
      const uniqueSlug = 'test-kategori-update-' + Date.now();

      const res = await request(app)
        .patch(`/api/kategori/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ nama: 'Updated Nama' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app)
        .patch('/api/kategori/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ nama: 'Test' })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/kategori/:id', () => {
    it('deletes kategori', async () => {
      const created = await prisma.kategori.create({ data: testKategori });

      const res = await request(app)
        .delete(`/api/kategori/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
