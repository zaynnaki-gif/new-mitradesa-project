import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './app';
import { getTestAdmin, cleanupTestData, prisma } from './fixtures/auth.fixture';

describe('Berita API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  const testBerita = {
    judul: 'Test Berita ' + Date.now(),
    slug: 'test-berita-' + Date.now(),
    excerpt: 'Excerpt berita test',
    konten: '<p>Konten berita test</p>',
    status: 'DRAFT' as const,
  };

  beforeAll(async () => {
    admin = await getTestAdmin();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$executeRawUnsafe(`DELETE FROM berita WHERE slug LIKE 'test-berita-%'`);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM berita WHERE slug LIKE 'test-berita-%'`);
  });

  describe('Authentication', () => {
    it('returns 401 for admin list without token', async () => {
      const res = await request(app).get('/api/berita').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns published berita without auth', async () => {
      const res = await request(app).get('/api/berita/published').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/berita', () => {
    it('returns berita list with pagination', async () => {
      const res = await request(app)
        .get('/api/berita')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('GET /api/berita/stats', () => {
    it('returns berita statistics', async () => {
      const res = await request(app)
        .get('/api/berita/stats')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('published');
      expect(res.body.data).toHaveProperty('draft');
      expect(res.body.data).toHaveProperty('archived');
    });
  });

  describe('GET /api/berita/published', () => {
    it('returns only published berita', async () => {
      // Create published berita
      const uniqueSlug = 'test-berita-pub-' + Date.now();
      await prisma.berita.create({
        data: {
          ...testBerita,
          slug: uniqueSlug,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      const res = await request(app)
        .get('/api/berita/published')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/berita', () => {
    it('creates berita with valid data', async () => {
      const uniqueSlug = 'test-berita-create-' + Date.now();

      const res = await request(app)
        .post('/api/berita')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testBerita, slug: uniqueSlug })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.judul).toBe(testBerita.judul);
    });

    it('returns 409 for duplicate slug', async () => {
      const uniqueSlug = 'test-berita-dup-' + Date.now();

      // Create first
      await request(app)
        .post('/api/berita')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testBerita, slug: uniqueSlug })
        .expect(201);

      // Try duplicate
      const res = await request(app)
        .post('/api/berita')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testBerita, slug: uniqueSlug })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/berita')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ judul: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/berita/:id', () => {
    it('updates berita', async () => {
      const created = await prisma.berita.create({ data: testBerita });
      const uniqueSlug = 'test-berita-update-' + Date.now();

      const res = await request(app)
        .patch(`/api/berita/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ judul: 'Updated Judul' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app)
        .patch('/api/berita/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ judul: 'Test' })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/berita/:id/publish', () => {
    it('publishes draft berita', async () => {
      const created = await prisma.berita.create({ data: testBerita });

      const res = await request(app)
        .post(`/api/berita/${created.id}/publish`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PUBLISHED');
    });
  });

  describe('DELETE /api/berita/:id', () => {
    it('soft deletes berita', async () => {
      const created = await prisma.berita.create({ data: testBerita });

      const res = await request(app)
        .delete(`/api/berita/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deleted = await prisma.berita.findUnique({ where: { id: created.id } });
      expect(deleted?.deletedAt).toBeTruthy();
    });
  });
});
