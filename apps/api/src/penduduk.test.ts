import request from 'supertest';
import app from './app';
import { getTestAdmin, cleanupTestData, prisma } from './fixtures/auth.fixture';

describe('Penduduk API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  const TEST_DESA_ID = BigInt(process.env.DESA_ID || '1');

  // Test data
  const validPenduduk = {
    nik: '3271051234567890',
    namaLengkap: 'John Doe',
    tempatLahir: 'Jakarta',
    tanggalLahir: new Date('1990-01-15'),
    jenisKelamin: 'L' as const,
    golDarah: 'O',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    alamat: 'Jl. Desa No. 1',
    rt: '01',
    rw: '01',
    dusun: 'Dusun Barat',
    telepon: '081234567890',
    email: 'john@example.com',
    wargaNegara: 'Indonesia',
    isAktif: true,
    desaId: TEST_DESA_ID,
  };

  const { desaId: _, ...validPendudukPayload } = validPenduduk;

  beforeAll(async () => {
    // Get or create test admin
    admin = await getTestAdmin();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData('327105');
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test penduduk before each test
    await cleanupTestData('327105');
  });

  describe('Authentication', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/penduduk')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/penduduk')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/penduduk', () => {
    it('should return list of penduduks with pagination', async () => {
      // Create test penduduk
      await prisma.penduduk.create({
        data: validPenduduk,
      });

      const response = await request(app)
        .get('/api/penduduk')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(20);
    });

    it('should filter by search query', async () => {
      await prisma.penduduk.create({ data: validPenduduk });

      const response = await request(app)
        .get('/api/penduduk?search=John')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by jenisKelamin', async () => {
      await prisma.penduduk.create({ data: validPenduduk });

      const response = await request(app)
        .get('/api/penduduk?jenisKelamin=L')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/penduduk/:id', () => {
    it('should return single penduduk by ID', async () => {
      const created = await prisma.penduduk.create({ data: validPenduduk });

      const response = await request(app)
        .get(`/api/penduduk/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nik).toBe(validPenduduk.nik);
      expect(response.body.data.namaLengkap).toBe(validPenduduk.namaLengkap);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/api/penduduk/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/penduduk', () => {
    it('should create new penduduk', async () => {
      const response = await request(app)
        .post('/api/penduduk')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(validPendudukPayload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nik).toBe(validPenduduk.nik);
      expect(response.body.data.namaLengkap).toBe(validPenduduk.namaLengkap);
    });

    it('should return 400 for invalid NIK', async () => {
      const invalidData = { ...validPendudukPayload, nik: '123' };

      const response = await request(app)
        .post('/api/penduduk')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate NIK', async () => {
      await prisma.penduduk.create({ data: validPenduduk });

      const response = await request(app)
        .post('/api/penduduk')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(validPendudukPayload)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/penduduk/:id', () => {
    it('should update penduduk', async () => {
      const created = await prisma.penduduk.create({ data: validPenduduk });

      const response = await request(app)
        .patch(`/api/penduduk/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ namaLengkap: 'John Updated' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.namaLengkap).toBe('John Updated');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .patch('/api/penduduk/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ namaLengkap: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when no fields provided (empty update)', async () => {
      const created = await prisma.penduduk.create({ data: validPenduduk });

      const response = await request(app)
        .patch(`/api/penduduk/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/penduduk/:id', () => {
    it('should soft delete penduduk', async () => {
      const created = await prisma.penduduk.create({ data: validPenduduk });

      const response = await request(app)
        .delete(`/api/penduduk/${created.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify soft delete
      const deleted = await prisma.penduduk.findUnique({
        where: { id: created.id },
      });
      expect(deleted?.deletedAt).toBeDefined();
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .delete('/api/penduduk/999999999')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
