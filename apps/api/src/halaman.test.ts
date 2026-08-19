import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './app';
import { getTestAdmin, cleanupTestData, prisma } from './fixtures/auth.fixture';

describe('Halaman API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  const TEST_DESA_ID = BigInt(process.env.DESA_ID || '1');

  const testHalaman = {
    judul: 'Test Halaman ' + Date.now(),
    slug: 'test-halaman-' + Date.now(),
    konten: '<p>Konten halaman test</p>',
    status: 'DRAFT' as const,
    isMenu: false,
    urutan: 0,
    desaId: TEST_DESA_ID,
  };

  const { desaId: _, ...testHalamanPayload } = testHalaman;

  beforeAll(async () => {
    admin = await getTestAdmin();
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM halaman WHERE slug LIKE 'test-halaman-%'`);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM halaman WHERE slug LIKE 'test-halaman-%'`);
  });

  describe('Authentication', () => {
    it('returns 401 for admin list without token', async () => {
      const res = await request(app).get('/api/halaman').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns menu items without auth', async () => {
      const res = await request(app).get('/api/halaman/menu').expect(200);
      expect(res.body.success).toBe(true);
    });

    it('returns published pages without auth', async () => {
      const res = await request(app).get('/api/halaman/published').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/halaman', () => {
    it('returns halaman list with pagination', async () => {
      const res = await request(app)
        .get('/api/halaman')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('GET /api/halaman/stats', () => {
    it('returns halaman statistics', async () => {
      const res = await request(app)
        .get('/api/halaman/stats')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('published');
      expect(res.body.data).toHaveProperty('draft');
    });
  });

  describe('GET /api/halaman/menu', () => {
    it('returns only menu items', async () => {
      // Create menu halaman
      const uniqueSlug = 'test-halaman-menu-' + Date.now();
      await prisma.halaman.create({
        data: { ...testHalaman, slug: uniqueSlug, isMenu: true, status: 'PUBLISHED' },
      });

      const res = await request(app).get('/api/halaman/menu').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/halaman', () => {
    it('creates halaman with valid data', async () => {
      const uniqueSlug = 'test-halaman-create-' + Date.now();

      const res = await request(app)
        .post('/api/halaman')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testHalamanPayload, slug: uniqueSlug })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.judul).toBe(testHalaman.judul);
    });

    it('returns 409 for duplicate slug', async () => {
      const uniqueSlug = 'test-halaman-dup-' + Date.now();

      // Create first
      await request(app)
        .post('/api/halaman')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testHalamanPayload, slug: uniqueSlug })
        .expect(201);

      // Try duplicate
      const res = await request(app)
        .post('/api/halaman')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testHalamanPayload, slug: uniqueSlug })
        .expect(409);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/halaman/:id', () => {
    it('updates halaman', async () => {
      const created = await prisma.halaman.create({ data: testHalaman });

      const res = await request(app)
        .patch(`/api/halaman/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ judul: 'Updated Judul' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app)
        .patch('/api/halaman/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ judul: 'Test' })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/halaman/:id/publish', () => {
    it('publishes draft halaman', async () => {
      const created = await prisma.halaman.create({ data: testHalaman });

      const res = await request(app)
        .post(`/api/halaman/${created.id}/publish`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PUBLISHED');
    });
  });

  describe('DELETE /api/halaman/:id', () => {
    it('soft deletes halaman', async () => {
      const created = await prisma.halaman.create({ data: testHalaman });

      const res = await request(app)
        .delete(`/api/halaman/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deleted = await prisma.halaman.findUnique({ where: { id: created.id } });
      expect(deleted?.deletedAt).toBeTruthy();
    });
  });
});
