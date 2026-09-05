import { Request, Response, NextFunction } from 'express';
import express from 'express';
import path from 'node:path';
import cors from 'cors';
import { config } from '../config/index.js';
import {
  requestLogger,
  securityHeaders,
  apiRateLimiter,
  idempotencyMiddleware,
  authenticateAny,
} from './index.js';
import { isServerDraining } from '../utils/lifecycle.js';
import { verifyDocumentAccessToken } from '../utils/doc-token.js';

/**
 * Middleware to protect static documents:
 * Accepts EITHER:
 * 1. An Authorization: Bearer <session-token> header
 * 2. A signed, short-lived, document-scoped ?doc_token=<token> query parameter
 */
export function documentStaticProtectionGuard(baseSubfolder = '') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const docToken = req.query.doc_token;

    // Check if a signed doc_token is provided
    if (typeof docToken === 'string' && docToken.trim()) {
      const cleanReqPath = req.path.replace(/\\/g, '/').replace(/^\/+/, '');
      const fullDocKey = baseSubfolder
        ? `${baseSubfolder.replace(/^\/+|\/+$/g, '')}/${cleanReqPath}`
        : cleanReqPath;

      const verification = verifyDocumentAccessToken(docToken.trim(), fullDocKey);
      if (verification.valid) {
        // Valid short-lived scoped token! Proceed to static serving
        return next();
      }

      res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_DOCUMENT_TOKEN',
          message: verification.error || 'Token akses dokumen tidak sah atau telah kadaluarsa',
        },
      });
      return;
    }

    // Otherwise, require valid user login session via Authorization: Bearer header
    void authenticateAny()(req, res, (err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  };
}

/**
 * Mount all shared security, rate limiting, and static upload guards onto an Express app.
 * Guarantees zero architectural drift across entrypoints.
 */
export function configureSecurityMiddleware(app: express.Express): void {
  // 1. System Lifecycle Draining Guard
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isServerDraining() && !req.path.startsWith('/api/health')) {
      res.setHeader('Connection', 'close');
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVER_SHUTTING_DOWN',
          message: 'Server sedang menyelesaikan proses penutupan (graceful shutdown). Silakan coba sesaat lagi.',
        },
      });
      return;
    }
    next();
  });

  // 2. Logging and Headers
  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(idempotencyMiddleware);
  app.use(apiRateLimiter);

  // 3. Static Upload Protection
  // Public assets
  app.use('/uploads/public', express.static(path.resolve(config.uploadDir, 'public')));
  app.use('/uploads/media', express.static(path.resolve(config.uploadDir, 'media')));
  // Public official/user avatars - publicly viewable for document verification and profile displays
  app.use(
    '/uploads/avatars',
    (_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(path.resolve(config.uploadDir, 'avatars'))
  );

  // Protected documents & private directories
  app.use(
    '/uploads/documents',
    documentStaticProtectionGuard('documents'),
    express.static(path.resolve(config.uploadDir, 'documents'))
  );
  app.use(
    '/uploads/private',
    documentStaticProtectionGuard('private'),
    express.static(path.resolve(config.uploadDir, 'private'))
  );

  // General fallback guard for /uploads
  app.use(
    '/uploads',
    (req: Request, res: Response, next: NextFunction) => {
      const cleanPath = req.path.replace(/\\/g, '/').toLowerCase();

      if (cleanPath.startsWith('/documents') || cleanPath.startsWith('/private')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Akses ke direktori dokumen privat ditolak' },
        });
        return;
      }

      // Check document file extensions
      const isDocument = /\.(pdf|docx?|xlsx?)$/i.test(cleanPath);
      if (isDocument) {
        return documentStaticProtectionGuard('')(req, res, next);
      }

      next();
    },
    express.static(path.resolve(config.uploadDir), { dotfiles: 'ignore', index: false })
  );
}
