import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const sanitizedUrl = req.originalUrl
      .replace(/([?&](?:nik|password|token|otp)=)[^&]+/gi, '$1***')
      .replace(/\b\d{16}\b/g, '****************');
    // eslint-disable-next-line no-console
    console.log(`[${requestId}] ${req.method} ${sanitizedUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
