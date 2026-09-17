import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { authService } from '../../services/index.js';
import {
  authenticateInternal,
  loginRateLimiter,
} from '../../middleware/index.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(3),
  password: z.string().min(6),
});

/**
 * @route   POST /api/auth/register
 * @desc    Internal account register
 * @access  Public
 */
router.post(
  '/register',
  loginRateLimiter, // Resusing login rate limiter for simplicity
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, fullName: _fullName, password } = registerSchema.parse(req.body);

    const { hashPassword } = await import('../../services/auth.service.js');
    const passwordHash = await hashPassword(password);

    const result = await authService.registerInternal(
      username,
      email,
      passwordHash,
      req.ip,
      req.headers['user-agent']
    );

    return response.created(res, {
      user: {
        id: result.id.toString(),
        username: result.username,
        email: result.email,
        roles: result.accountRoles.map((ar) => ar.role.code),
      },
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Internal account login
 * @access  Public
 */
router.post(
  '/login',
  loginRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = loginSchema.parse(req.body);

    const result = await authService.loginInternal(
      username,
      password,
      req.ip,
      req.headers['user-agent']
    );

    return response.success(res, {
      token: result.token,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24 hours in seconds
      user: {
        id: result.account.id.toString(),
        username: result.account.username,
        email: result.account.email,
        roles: result.account.accountRoles.map((ar) => ar.role.code),
      },
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (revoke internal session)
 * @access  Private
 */
router.post(
  '/logout',
  authenticateInternal(),
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await authService.logoutInternal(token, req.ip, req.headers['user-agent']);
    }

    return response.success(res, { message: 'Logged out successfully' });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get(
  '/me',
  authenticateInternal(),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.accountId) {
      throw ApiError.unauthorized('Not authenticated');
    }

    const account = await authService.getAccountById(req.user.accountId);

    if (!account) {
      throw ApiError.notFound('Account not found');
    }

    return response.success(res, {
      id: account.id.toString(),
      username: account.username,
      email: account.email,
      status: account.status,
      lastLoginAt: account.lastLoginAt,
      roles: account.accountRoles.map((ar) => ({
        code: ar.role.code,
        name: ar.role.name,
        permissions: ar.role.rolePermissions.map((rp) => rp.permission.code),
      })),
    });
  })
);

/**
 * @route   GET /api/auth/permissions
 * @desc    Get current user's permissions
 * @access  Private
 */
router.get(
  '/permissions',
  authenticateInternal(),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    return response.success(res, {
      permissions: req.user.permissions,
      roles: req.user.roles,
    });
  })
);

export default router;
