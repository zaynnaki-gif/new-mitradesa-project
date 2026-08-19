import { ApiError } from '../../utils/response.js';
import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { permintaanLayananService } from '../../services/permintaan-layanan.service.js';
import {
  createPermintaanLayananSchema,
  updatePermintaanLayananSchema,
  updatePermintaanStatusSchema,
  queryPermintaanLayananSchema,
  idParamSchema,
} from '../../dto/service-document.dto.js';
import { RequestStatus } from '@prisma/client';

const router = Router();



/**
 * Get current user's account ID
 */
function getAccountId(req: Express.Request): bigint {
  const accountId = req.user?.accountId;
  if (!accountId) {
    throw ApiError.unauthorized('Tidak ter-authentikasi');
  }
  return accountId;
}

/**
 * GET /api/service-requests - List all service requests
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('request.view'),
  asyncHandler(async (req, res) => {
    const query = queryPermintaanLayananSchema.parse(req.query);
    const result = await permintaanLayananService.findAll(query);
    return response.success(res, result.data, 'Daftar Permintaan', result.meta);
  })
);

/**
 * GET /api/service-requests/stats - Get request statistics
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('request.view'),
  asyncHandler(async (_req, res) => {
    const stats = await permintaanLayananService.getStats();
    return response.success(res, stats, 'Statistik Permintaan');
  })
);

/**
 * GET /api/service-requests/:id - Get request by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('request.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const permintaan = await permintaanLayananService.findById(BigInt(id));
    if (!permintaan) {
      throw ApiError.notFound('Permintaan tidak ditemukan');
    }
    return response.success(res, permintaan, 'Detail Permintaan');
  })
);

/**
 * POST /api/service-requests - Create new request
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('request.create'),
  asyncHandler(async (req, res) => {
    const data = createPermintaanLayananSchema.parse(req.body);
    const actorId = getAccountId(req);

    const permintaan = await permintaanLayananService.create(
      data,
      actorId
    );
    return response.created(res, permintaan, 'Permintaan berhasil dibuat');
  })
);

/**
 * PATCH /api/service-requests/:id - Update request data
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('request.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updatePermintaanLayananSchema.parse(req.body);

    const permintaan = await permintaanLayananService.update(
      BigInt(id),
      data
    );
    return response.success(res, permintaan, 'Permintaan berhasil diperbarui');
  })
);

/**
 * POST /api/service-requests/:id/submit - Submit request
 */
router.post(
  '/:id/submit',
  authenticateInternal(),
  authorize('request.process'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const actorId = getAccountId(req);

    const permintaan = await permintaanLayananService.submit(
      BigInt(id),
      actorId
    );
    return response.success(res, permintaan, 'Permintaan berhasil diajukan');
  })
);

/**
 * POST /api/service-requests/:id/verify - Verify request
 */
router.post(
  '/:id/verify',
  authenticateInternal(),
  authorize('request.process'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = { ...req.body, status: RequestStatus.VERIFICATION };
    const data = updatePermintaanStatusSchema.parse(body);
    const actorId = getAccountId(req);

    const permintaan = await permintaanLayananService.updateStatus(
      BigInt(id),
      data,
      actorId
    );
    return response.success(res, permintaan, 'Permintaan berhasil diverifikasi');
  })
);

/**
 * POST /api/service-requests/:id/process - Mark as processing
 */
router.post(
  '/:id/process',
  authenticateInternal(),
  authorize('request.process'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = { ...req.body, status: RequestStatus.PROCESSING };
    const data = updatePermintaanStatusSchema.parse(body);
    const actorId = getAccountId(req);

    const permintaan = await permintaanLayananService.updateStatus(
      BigInt(id),
      data,
      actorId
    );
    return response.success(res, permintaan, 'Status berhasil diperbarui ke Diproses');
  })
);

/**
 * POST /api/service-requests/:id/reject - Reject request
 */
router.post(
  '/:id/reject',
  authenticateInternal(),
  authorize('request.approve'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = { ...req.body, status: RequestStatus.REJECTED };
    const data = updatePermintaanStatusSchema.parse(body);
    const actorId = getAccountId(req);

    const permintaan = await permintaanLayananService.updateStatus(
      BigInt(id),
      data,
      actorId
    );
    return response.success(res, permintaan, 'Permintaan berhasil ditolak');
  })
);

/**
 * POST /api/service-requests/:id/complete - Complete request
 */
router.post(
  '/:id/complete',
  authenticateInternal(),
  authorize('request.process'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = { ...req.body, status: RequestStatus.COMPLETED };
    const data = updatePermintaanStatusSchema.parse(body);
    const actorId = getAccountId(req);

    const permintaan = await permintaanLayananService.updateStatus(
      BigInt(id),
      data,
      actorId
    );
    return response.success(res, permintaan, 'Permintaan berhasil diselesaikan');
  })
);

/**
 * POST /api/service-requests/:id/cancel - Cancel request
 */
router.post(
  '/:id/cancel',
  authenticateInternal(),
  authorize('request.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { catatan } = req.body || {};
    const actorId = getAccountId(req);

    const permintaan = await permintaanLayananService.cancel(
      BigInt(id),
      catatan,
      actorId
    );
    return response.success(res, permintaan, 'Permintaan berhasil dibatalkan');
  })
);

/**
 * DELETE /api/service-requests/:id - Soft delete request
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('request.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);

    await permintaanLayananService.softDelete(BigInt(id));
    return response.success(res, null, 'Permintaan berhasil dihapus');
  })
);

export default router;
