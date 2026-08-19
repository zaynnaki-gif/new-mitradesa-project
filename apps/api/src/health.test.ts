import request from 'supertest';
import app from './app';

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return 200 and healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('MITRADESA');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });

    it('should include environment info', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.version).toBeDefined();
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return 200 with memory info', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.memory.rss).toBeDefined();
      expect(response.body.data.platform).toBeDefined();
      expect(response.body.data.nodeVersion).toBeDefined();
    });
  });
});

describe('Root API', () => {
  it('should return API info', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.service).toBe('MITRADESA');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
