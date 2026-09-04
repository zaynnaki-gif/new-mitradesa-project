import { Request, Response, NextFunction } from 'express';
import { authService, otpService } from '../services/index.js';
import { ApiError } from '../utils/response.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        type: 'internal' | 'citizen';
        accountId?: bigint;
        pendudukId?: bigint;
        username?: string;
        email?: string;
        permissions: string[];
        roles: string[];
      };
    }
  }
}

/**
 * Extract token from Authorization header or query param
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
  }

  // Also allow token from query parameter for direct browser downloads / view in tab
  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  return null;
}

/**
 * Authenticate internal user
 */
export function authenticateInternal() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);

      if (!token) {
        throw ApiError.unauthorized('No authentication token provided');
      }

      const user = await authService.verifyInternalToken(token);

      if (!user) {
        throw ApiError.unauthorized('Invalid or expired token');
      }

      req.user = {
        type: 'internal',
        accountId: user.accountId,
        username: user.username,
        email: user.email,
        permissions: user.permissions,
        roles: user.roles,
      };

      return next();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }
      return next(error);
    }
  };
}

/**
 * Authenticate citizen
 */
export function authenticateCitizen() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);

      if (!token) {
        throw ApiError.unauthorized('No authentication token provided');
      }

      const session = await otpService.verifyCitizenSession(token);

      if (!session) {
        throw ApiError.unauthorized('Invalid or expired session');
      }

      req.user = {
        type: 'citizen',
        pendudukId: session.pendudukId,
        permissions: ['citizen'], // Citizens have basic permissions
        roles: ['CITIZEN'],
      };

      return next();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }
      return next(error);
    }
  };
}

/**
 * Authenticate either internal or citizen
 */
export function authenticateAny() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);

      if (!token) {
        throw ApiError.unauthorized('No authentication token provided');
      }

      // Try internal first
      const internalUser = await authService.verifyInternalToken(token);

      if (internalUser) {
        req.user = {
          type: 'internal',
          accountId: internalUser.accountId,
          username: internalUser.username,
          email: internalUser.email,
          permissions: internalUser.permissions,
          roles: internalUser.roles,
        };
        return next();
      }

      // Try citizen
      const citizenSession = await otpService.verifyCitizenSession(token);

      if (citizenSession) {
        req.user = {
          type: 'citizen',
          pendudukId: citizenSession.pendudukId,
          permissions: ['citizen'],
          roles: ['CITIZEN'],
        };
        return next();
      }

      throw ApiError.unauthorized('Invalid or expired token');
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }
      next(error);
    }
  };
}

/**
 * Check if user is authenticated (optional)
 */
export function optionalAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    void _res;
    try {
      const token = extractToken(req);

      if (!token) {
        return next();
      }

      // Try internal
      const internalUser = await authService.verifyInternalToken(token);

      if (internalUser) {
        req.user = {
          type: 'internal',
          accountId: internalUser.accountId,
          username: internalUser.username,
          email: internalUser.email,
          permissions: internalUser.permissions,
          roles: internalUser.roles,
        };
        return next();
      }

      // Try citizen
      const citizenSession = await otpService.verifyCitizenSession(token);

      if (citizenSession) {
        req.user = {
          type: 'citizen',
          pendudukId: citizenSession.pendudukId,
          permissions: ['citizen'],
          roles: ['CITIZEN'],
        };
        return next();
      }

      next();
    } catch (error) {
      next();
    }
  };
}
