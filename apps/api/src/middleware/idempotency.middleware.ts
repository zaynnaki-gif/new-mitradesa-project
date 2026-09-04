import type { Request, Response, NextFunction } from 'express';

interface IdempotencyRecord {
  status: 'IN_PROGRESS' | 'COMPLETED';
  statusCode?: number;
  body?: any;
  headers?: Record<string, string>;
  createdAt: number;
}

// In-memory cache for Idempotency keys (TTL: 5 minutes)
const idempotencyStore = new Map<string, IdempotencyRecord>();
const TTL_MS = 5 * 60 * 1000;

// Periodic cleanup of expired keys every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.createdAt > TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 1000).unref();

/**
 * Middleware to enforce idempotency on state-changing requests (financial mutations, TTE, etc.)
 */
export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Only apply to mutating HTTP methods
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const rawKey = req.headers ? (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) : (req.header ? (req.header('idempotency-key') || req.header('x-idempotency-key')) : undefined);
  if (!rawKey || typeof rawKey !== 'string') {
    // If no key provided, allow request to proceed normally
    return next();
  }

  const key = rawKey.trim();
  if (key.length < 8 || key.length > 128) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Format Idempotency-Key tidak valid (panjang harus antara 8 hingga 128 karakter)',
      },
    });
    return;
  }

  const existing = idempotencyStore.get(key);

  if (existing) {
    if (existing.status === 'IN_PROGRESS') {
      res.setHeader('Retry-After', '2');
      res.status(409).json({
        success: false,
        error: {
          code: 'CONCURRENT_REQUEST',
          message: 'Permintaan dengan Idempotency-Key ini sedang dalam proses. Harap tunggu sesaat.',
        },
      });
      return;
    }

    if (existing.status === 'COMPLETED') {
      res.setHeader('X-Idempotent-Replay', 'true');
      if (existing.headers) {
        for (const [hKey, hVal] of Object.entries(existing.headers)) {
          res.setHeader(hKey, hVal);
        }
      }
      res.status(existing.statusCode || 200).send(existing.body);
      return;
    }
  }

  // Register key as IN_PROGRESS
  idempotencyStore.set(key, {
    status: 'IN_PROGRESS',
    createdAt: Date.now(),
  });

  // Intercept response to cache on completion
  const originalSend = res.send.bind(res);

  res.send = (body: any): Response => {
    try {
      // Only cache successful or client error responses (don't cache 5xx internal crashes so user can retry)
      if (res.statusCode < 500) {
        idempotencyStore.set(key, {
          status: 'COMPLETED',
          statusCode: res.statusCode,
          body,
          createdAt: Date.now(),
        });
      } else {
        idempotencyStore.delete(key);
      }
    } catch {
      idempotencyStore.delete(key);
    }
    return originalSend(body);
  };

  next();
};
