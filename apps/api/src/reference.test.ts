/**
 * Phase 4 Reference Data Tests
 * Tests for all 9 reference tables
 */

import request from 'supertest';
import app from './app';
import { getTestAdmin, prisma } from './fixtures/auth.fixture';

describe('Reference Data API', () => {
  let admin: { accountId: bigint; token: string; username: string; password: string };

  beforeAll(async () => {
    admin = await getTestAdmin();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ============================================
  // RefAgama Tests
  // ============================================
  describe('GET /api/reference/agama', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reference/agama');
      expect(response.status).toBe(401);
    });

    it('should return list of agama', async () => {
      const response = await request(app)
        .get('/api/reference/agama')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/reference/agama?page=1&limit=5')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.meta).toBeDefined();
    });

    it('should filter by isAktif', async () => {
      const response = await request(app)
        .get('/api/reference/agama?isAktif=true')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/reference/agama/:kode', () => {
    it('should return 404 for nonexistent kode', async () => {
      const response = await request(app)
        .get('/api/reference/agama/NONEXISTENT')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(404);
    });

    it('should return agama by kode', async () => {
      const response = await request(app)
        .get('/api/reference/agama/ISLAM')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.kode).toBe('ISLAM');
    });
  });

  // ============================================
  // RefGolDarah Tests
  // ============================================
  describe('GET /api/reference/gol-darah', () => {
    it('should return list of gol darah', async () => {
      const response = await request(app)
        .get('/api/reference/gol-darah')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reference/gol-darah/:kode', () => {
    it('should return gol darah by kode', async () => {
      const response = await request(app)
        .get('/api/reference/gol-darah/A')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.kode).toBe('A');
    });
  });

  // ============================================
  // RefStatusPerkawinan Tests
  // ============================================
  describe('GET /api/reference/status-kawin', () => {
    it('should return list of status perkawinan', async () => {
      const response = await request(app)
        .get('/api/reference/status-kawin')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reference/status-kawin/:kode', () => {
    it('should return status perkawinan by kode', async () => {
      const response = await request(app)
        .get('/api/reference/status-kawin/BK')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.kode).toBe('BK');
    });
  });

  // ============================================
  // RefHubunganKeluarga Tests
  // ============================================
  describe('GET /api/reference/hubungan-keluarga', () => {
    it('should return list of hubungan keluarga', async () => {
      const response = await request(app)
        .get('/api/reference/hubungan-keluarga')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reference/hubungan-keluarga/:kode', () => {
    it('should return hubungan keluarga by kode', async () => {
      const response = await request(app)
        .get('/api/reference/hubungan-keluarga/KEPALA_KELUARGA')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.kode).toBe('KEPALA_KELUARGA');
    });
  });

  // ============================================
  // RefStatusKependudukan Tests
  // ============================================
  describe('GET /api/reference/status-kependudukan', () => {
    it('should return list of status kependudukan', async () => {
      const response = await request(app)
        .get('/api/reference/status-kependudukan')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ============================================
  // RefPendidikan Tests
  // ============================================
  describe('GET /api/reference/pendidikan', () => {
    it('should return list of pendidikan', async () => {
      const response = await request(app)
        .get('/api/reference/pendidikan')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reference/pendidikan/:kode', () => {
    it('should return pendidikan by kode', async () => {
      const response = await request(app)
        .get('/api/reference/pendidikan/S1')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.kode).toBe('S1');
    });
  });

  // ============================================
  // RefPekerjaan Tests
  // ============================================
  describe('GET /api/reference/pekerjaan', () => {
    it('should return list of pekerjaan', async () => {
      const response = await request(app)
        .get('/api/reference/pekerjaan')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ============================================
  // RefJabatanPerangkat Tests
  // ============================================
  describe('GET /api/reference/jabatan-perangkat', () => {
    it('should return list of jabatan perangkat', async () => {
      const response = await request(app)
        .get('/api/reference/jabatan-perangkat')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reference/jabatan-perangkat/:kode', () => {
    it('should return jabatan perangkat by kode', async () => {
      const response = await request(app)
        .get('/api/reference/jabatan-perangkat/KEPALA_DESA')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.kode).toBe('KEPALA_DESA');
    });
  });

  // ============================================
  // RefStatusPerangkat Tests
  // ============================================
  describe('GET /api/reference/status-perangkat', () => {
    it('should return list of status perangkat', async () => {
      const response = await request(app)
        .get('/api/reference/status-perangkat')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ============================================
  // Authorization Tests
  // ============================================
  describe('Authorization', () => {
    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/reference/agama');
      expect(response.status).toBe(401);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/reference/agama')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(response.status).toBe(200);
    });
  });
});
