import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../utils/response.js';
import { config } from '../config/index.js';
import { prisma } from '../services/prisma.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    return response.success(res, {
      status: 'healthy',
      service: config.appName,
      version: config.appVersion,
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  })
);

/**
 * @route   GET /api/health/database
 * @desc    Database connectivity check
 * @access  Public
 */
router.get(
  '/database',
  asyncHandler(async (_req, res) => {
    try {
      // Simple database query to verify connectivity
      await prisma.$queryRaw`SELECT 1 as result`;
      return response.success(res, {
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw ApiError.serviceUnavailable('Database connection failed');
    }
  })
);

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with system info
 * @access  Public
 */
router.get(
  '/detailed',
  asyncHandler(async (_req, res) => {
    const memoryUsage = process.memoryUsage();

    return response.success(res, {
      status: 'healthy',
      service: config.appName,
      version: config.appVersion,
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      platform: process.platform,
      nodeVersion: process.version
    });
  })
);

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check for Kubernetes
 * @access  Public
 */
router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      // Verify database is ready
      await prisma.$queryRaw`SELECT 1 as result`;

      return response.success(res, {
        ready: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw ApiError.serviceUnavailable('Service not ready');
    }
  })
);

/**
 * @route   GET /api/health/live
 * @desc    Liveness check for Kubernetes
 * @access  Public
 */
router.get(
  '/live',
  asyncHandler(async (_req, res) => {
    return response.success(res, {
      alive: true,
      timestamp: new Date().toISOString()
    });
  })
);

export default router;
