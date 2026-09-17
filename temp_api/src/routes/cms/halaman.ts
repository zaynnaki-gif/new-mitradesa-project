import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';

import { halamanService } from '../../services/halaman.service.js';
import {
  createHalamanSchema,
  updateHalamanSchema,
  queryHalamanSchema,
  idParamSchema,
} from '../../dto/cms.dto.js';

const router = Router();

/**
 * GET /api/halaman - List all halaman (admin)
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('halaman.view'),
  asyncHandler(async (req, res) => {
    const query = queryHalamanSchema.parse(req.query);
    const result = await halamanService.findAll(query);
    return response.success(res, result.data, 'Daftar Halaman', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/halaman/stats - Get halaman statistics
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('halaman.view'),
  asyncHandler(async (_req, res) => {
    const stats = await halamanService.getStats();
    return response.success(res, stats, 'Statistik Halaman');
  })
);

/**
 * GET /api/halaman/menu - Get menu items (public)
 */
router.get(
  '/menu',
  asyncHandler(async (_req, res) => {
    const menuItems = await halamanService.findMenuItems();
    return response.success(res, menuItems, 'Menu Items');
  })
);

/**
 * GET /api/halaman/published - List published halaman (public)
 */
router.get(
  '/published',
  asyncHandler(async (_req, res) => {
    const halamans = await halamanService.findPublished();
    return response.success(res, halamans, 'Daftar Halaman');
  })
);

/**
 * GET /api/halaman/:id - Get halaman by ID (admin)
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('halaman.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const halaman = await halamanService.findById(BigInt(id));
    return response.success(res, halaman, 'Detail Halaman');
  })
);

/**
 * GET /api/halaman/slug/:slug - Get halaman by slug (public)
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const halaman = await halamanService.findPublishedBySlug(req.params.slug);
    return response.success(res, halaman, 'Detail Halaman');
  })
);

/**
 * POST /api/halaman - Create new halaman
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('halaman.create'),
  asyncHandler(async (req, res) => {
    const data = createHalamanSchema.parse(req.body);
    const createdById = req.user?.accountId;
    const halaman = await halamanService.create(data, createdById);
    return response.created(res, halaman, 'Halaman berhasil dibuat');
  })
);

/**
 * PATCH /api/halaman/:id - Update halaman
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('halaman.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateHalamanSchema.parse(req.body);
    const halaman = await halamanService.update(BigInt(id), data);
    return response.success(res, halaman, 'Halaman berhasil diperbarui');
  })
);

/**
 * POST /api/halaman/:id/publish - Publish halaman
 */
router.post(
  '/:id/publish',
  authenticateInternal(),
  authorize('halaman.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const halaman = await halamanService.publish(BigInt(id));
    return response.success(res, halaman, 'Halaman berhasil dipublikasikan');
  })
);

/**
 * POST /api/halaman/:id/archive - Archive halaman
 */
router.post(
  '/:id/archive',
  authenticateInternal(),
  authorize('halaman.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const halaman = await halamanService.archive(BigInt(id));
    return response.success(res, halaman, 'Halaman berhasil diarsipkan');
  })
);

/**
 * DELETE /api/halaman/:id - Soft delete halaman
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('halaman.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await halamanService.softDelete(BigInt(id));
    return response.success(res, null, 'Halaman berhasil dihapus');
  })
);

export default router;
