import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request Logger Middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.info(`[${requestId}] [${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
}

import helmet from 'helmet';

/**
 * Security Headers Middleware (using Helmet)
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
});

/**
 * Not Found Handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

/**
 * Global Error Handler
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', err);

  // Handle known errors
  if ('statusCode' in err && 'code' in err) {
    const error = err as { statusCode: number; code: string; message: string };
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    const zodErr = err as Error & { errors?: Array<{ message: string }> };
    const firstError = zodErr.errors?.[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError?.message || 'Invalid request data',
        details: zodErr.errors,
      },
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; message: string; meta?: Record<string, unknown> };
    let statusCode = 400; // Bad Request by default for known Prisma errors
    let code = 'DATABASE_ERROR';
    
    if (prismaError.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
    } else if (prismaError.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: 'Database operation failed: ' + (process.env.NODE_ENV === 'development' ? prismaError.message : prismaError.code),
        ...(process.env.NODE_ENV === 'development' && prismaError.meta ? { details: prismaError.meta } : {}),
      },
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}
