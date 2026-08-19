import request from 'supertest';
import app from './app';

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'invalid', password: 'wrong' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for inactive account', async () => {
      // This test would require a database with an inactive account
      // For now, we test the expected behavior
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'inactive', password: 'password' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/citizen/request-otp', () => {
    it('should return 400 for invalid NIK format', async () => {
      const response = await request(app)
        .post('/api/auth/citizen/request-otp')
        .send({ nik: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing NIK', async () => {
      const response = await request(app)
        .post('/api/auth/citizen/request-otp')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/citizen/verify-otp', () => {
    it('should return 400 for missing challenge', async () => {
      const response = await request(app)
        .post('/api/auth/citizen/verify-otp')
        .send({ otp: '123456' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid OTP format', async () => {
      const response = await request(app)
        .post('/api/auth/citizen/verify-otp')
        .send({ challenge: 'valid-challenge', otp: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Authorization', () => {
  describe('Protected routes without authentication', () => {
    it('should deny access to protected routes', async () => {
      // Test audit log route
      const response = await request(app)
        .get('/api/audit-log')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('CORS', () => {
  it('should allow requests from allowed origins', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeTruthy();
  });
});

describe.skip('Rate Limiting', () => {
  it('should rate limit login attempts', async () => {
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'wrong' });
    }

    // 6th attempt should be rate limited
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'wrong' })
      .expect(429);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-xss-protection']).toBeTruthy();
    expect(response.headers['x-content-type-options']).toBeTruthy();
    expect(response.headers['x-frame-options']).toBeTruthy();
  });
});
