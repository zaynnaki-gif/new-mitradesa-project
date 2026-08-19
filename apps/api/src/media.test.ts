import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './app';
import { getTestAdmin, prisma } from './fixtures/auth.fixture';

describe('Media API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  const testMedia = {
    nama: 'Test Media ' + Date.now(),
    slug: 'test-media-' + Date.now(),
    deskripsi: 'Test media file',
    fileUrl: 'https://example.com/test.jpg',
    fileType: 'IMAGE' as const,
    fileSize: 1024,
    mimeType: 'image/jpeg',
    width: 800,
    height: 600,
    alt: 'Test image',
    kategori: 'test',
  };

  beforeAll(async () => {
    admin = await getTestAdmin();
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM media WHERE slug LIKE 'test-media-%'`);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM media WHERE slug LIKE 'test-media-%'`);
  });

  describe('Authentication', () => {
    it('returns 401 without token for admin list', async () => {
      const res = await request(app).get('/api/media').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/media')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns public media detail without auth', async () => {
      // Create test media first
      const media = await prisma.media.create({ data: testMedia });
      const res = await request(app)
        .get(`/api/media/${media.id}`)
        .expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/media', () => {
    it('returns media list with pagination', async () => {
      const res = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('filters by file type', async () => {
      const res = await request(app)
        .get('/api/media?fileType=IMAGE')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('filters by search query', async () => {
      await prisma.media.create({ data: testMedia });
      const res = await request(app)
        .get('/api/media?search=Test')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/media/stats', () => {
    it('returns media statistics', async () => {
      const res = await request(app)
        .get('/api/media/stats')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('images');
      expect(res.body.data).toHaveProperty('videos');
      expect(res.body.data).toHaveProperty('audio');
      expect(res.body.data).toHaveProperty('documents');
    });
  });

  describe('POST /api/media', () => {
    it('creates media with valid data', async () => {
      const uniqueSlug = 'test-media-create-' + Date.now();

      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testMedia, slug: uniqueSlug })
        .expect(201);

      if (res.body.success !== true) console.error(JSON.stringify(res.body, null, 2));
      expect(res.body.success).toBe(true);
      expect(res.body.data.nama).toBe(testMedia.nama);
    });

    it('returns 409 for duplicate slug', async () => {
      const uniqueSlug = 'test-media-dup-' + Date.now();

      await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testMedia, slug: uniqueSlug })
        .expect(201);

      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testMedia, slug: uniqueSlug })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 for invalid file type', async () => {
      const uniqueSlug = 'test-media-invalid-type-' + Date.now();

      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testMedia, fileType: 'INVALID' as any, slug: uniqueSlug })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid MIME type', async () => {
      const uniqueSlug = 'test-media-invalid-mime-' + Date.now();

      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testMedia, mimeType: 'invalid', slug: uniqueSlug })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 for negative file size', async () => {
      const uniqueSlug = 'test-media-neg-size-' + Date.now();

      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ ...testMedia, fileSize: -100, slug: uniqueSlug })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/media/:id', () => {
    it('updates media', async () => {
      const created = await prisma.media.create({ data: testMedia });
      const uniqueSlug = 'test-media-update-' + Date.now();

      const res = await request(app)
        .patch(`/api/media/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ nama: 'Updated Media Name', slug: uniqueSlug })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app)
        .patch('/api/media/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ nama: 'Test' })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for duplicate slug on update', async () => {
      const created1 = await prisma.media.create({ data: testMedia });
      const created2 = await prisma.media.create({ data: { ...testMedia, slug: 'test-media-dup-check-' + Date.now() } });

      const res = await request(app)
        .patch(`/api/media/${created1.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ slug: created2.slug })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/media/:id', () => {
    it('soft deletes media', async () => {
      const created = await prisma.media.create({ data: testMedia });

      const res = await request(app)
        .delete(`/api/media/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const deleted = await prisma.media.findUnique({ where: { id: created.id } });
      expect(deleted?.deletedAt).toBeTruthy();
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app)
        .delete('/api/media/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

describe('Media Security Tests', () => {
  let admin: { token: string };

  beforeAll(async () => {
    const { getTestAdmin } = await import('./fixtures/auth.fixture');
    admin = await getTestAdmin();
  });

  describe('Input Validation', () => {
    it('rejects XSS in nama field', async () => {
      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          nama: '<script>alert(1)</script>',
          slug: 'xss-test-' + Date.now(),
          fileUrl: 'https://example.com/test.jpg',
          fileType: 'IMAGE',
          fileSize: 1024,
          mimeType: 'image/jpeg',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.nama).toBe('<script>alert(1)</script>');
    });

    it('accepts valid slug format', async () => {
      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          nama: 'Valid Media',
          slug: 'valid-media-' + Date.now(),
          fileUrl: 'https://example.com/test.jpg',
          fileType: 'IMAGE',
          fileSize: 1024,
          mimeType: 'image/jpeg',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('rejects invalid slug format', async () => {
      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          nama: 'Invalid Slug Media',
          slug: 'Invalid Slug!',
          fileUrl: 'https://example.com/test.jpg',
          fileType: 'IMAGE',
          fileSize: 1024,
          mimeType: 'image/jpeg',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects oversized request', async () => {
      const largeData = {
        nama: 'A'.repeat(10000),
        slug: 'oversized-' + Date.now(),
        fileUrl: 'https://example.com/test.jpg',
        fileType: 'IMAGE',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      };

      const res = await request(app)
        .post('/api/media')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(largeData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/media').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 without proper permission', async () => {
      const res = await request(app)
        .post('/api/media')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          nama: 'Test',
          slug: 'no-perm-' + Date.now(),
          fileUrl: 'https://example.com/test.jpg',
          fileType: 'IMAGE',
          fileSize: 1024,
          mimeType: 'image/jpeg',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
