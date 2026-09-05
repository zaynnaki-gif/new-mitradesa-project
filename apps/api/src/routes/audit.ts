import { Router, Request, Response } from 'express';
import { asyncHandler, response } from '../utils/response.js';
import { prisma } from '../services/index.js';
import { authenticateInternal, authorize } from '../middleware/index.js';

const router = Router();

/**
 * @route   GET /api/audit-log
 * @desc    Get audit logs
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('audit.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const entityType = req.query.entity_type as string;
    const entityId = req.query.entity_id ? BigInt(req.query.entity_id as string) : undefined;
    const action = req.query.action as string;
    const actorId = req.query.actor_id ? BigInt(req.query.actor_id as string) : undefined;
    const fromDate = req.query.from_date ? new Date(req.query.from_date as string) : undefined;
    const toDate = req.query.to_date ? new Date(req.query.to_date as string) : undefined;

    const where: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (actorId) where.actorId = actorId;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const skip = (page - 1) * perPage;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return response.success(
      res,
      {
        logs: logs.map((log) => ({
          ...log,
          id: log.id.toString(),
          entityId: log.entityId.toString(),
          actorId: log.actorId?.toString(),
        })),
      },
      'Audit logs retrieved successfully',
      {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      }
    );
  })
);

/**
 * @route   GET /api/audit-log/:id
 * @desc    Get audit log detail
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('audit.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = BigInt(req.params.id);

    const log = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      return response.error(res, 404, 'NOT_FOUND', 'Audit log not found');
    }

    return response.success(res, {
      ...log,
      id: log.id.toString(),
      entityId: log.entityId.toString(),
      actorId: log.actorId?.toString(),
    });
  })
);

/**
 * @route   GET /api/audit-log/notifications/dead-letter
 * @desc    Get all failed notifications from Dead-Letter Queue
 * @access  Private (Admin)
 */
router.get(
  '/notifications/dead-letter',
  authenticateInternal(),
  authorize('audit.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await prisma.auditLog.findMany({
      where: { entityType: 'wa_dead_letter' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return response.success(res, {
      deadLetters: logs.map((log) => ({
        ...log,
        id: log.id.toString(),
        entityId: log.entityId.toString(),
        actorId: log.actorId?.toString(),
      })),
    });
  })
);

/**
 * @route   POST /api/audit-log/notifications/dead-letter/:id/retry
 * @desc    Retry/resend a failed notification from dead-letter queue
 * @access  Private (Admin)
 */
router.post(
  '/notifications/dead-letter/:id/retry',
  authenticateInternal(),
  authorize('audit.view'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = BigInt(req.params.id);
    const { notificationService } = await import('../services/notification.service.js');
    const success = await notificationService.retryFailedNotification(id);

    return response.success(res, {
      success,
      message: success
        ? 'Notifikasi berhasil dikirim ulang'
        : 'Pengiriman ulang gagal (gateway masih bermasalah)',
    });
  })
);

export default router;

