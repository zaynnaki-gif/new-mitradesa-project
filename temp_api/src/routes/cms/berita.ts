import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { beritaService } from '../../services/berita.service.js';
import {
  createBeritaSchema,
  updateBeritaSchema,
  queryBeritaSchema,
  idParamSchema,
} from '../../dto/cms.dto.js';

const router = Router();

/**
 * GET /api/berita - List all berita (admin)
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('berita.view'),
  asyncHandler(async (req, res) => {
    const query = queryBeritaSchema.parse(req.query);
    const result = await beritaService.findAll(query);
    return response.success(res, result.data, 'Daftar Berita', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/berita/stats - Get berita statistics
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('berita.view'),
  asyncHandler(async (_req, res) => {
    const stats = await beritaService.getStats();
    return response.success(res, stats, 'Statistik Berita');
  })
);

/**
 * GET /api/berita/published - List published berita (public)
 */
router.get(
  '/published',
  asyncHandler(async (req, res) => {
    const query = queryBeritaSchema.parse(req.query);
    // Public route: maybe not require desaId unless provided via query param/domain.
    // Assuming for now public routes return all published or require modification to parse subdomain.
    // For simplicity, we just pass undefined to return all published globally unless modified.
    const result = await beritaService.findPublished(query);
    return response.success(res, result.data, 'Daftar Berita', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/berita/:id - Get berita by ID (admin)
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('berita.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const berita = await beritaService.findById(BigInt(id));
    return response.success(res, berita, 'Detail Berita');
  })
);

/**
 * GET /api/berita/slug/:slug - Get berita by slug (public)
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const berita = await beritaService.findPublishedBySlug(req.params.slug);
    return response.success(res, berita, 'Detail Berita');
  })
);

/**
 * POST /api/berita - Create new berita
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('berita.create'),
  asyncHandler(async (req, res) => {
    const data = createBeritaSchema.parse(req.body);
    const penulisId = req.user?.accountId;
    const berita = await beritaService.create(data, penulisId);
    return response.created(res, berita, 'Berita berhasil dibuat');
  })
);

/**
 * PATCH /api/berita/:id - Update berita
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('berita.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateBeritaSchema.parse(req.body);
    const berita = await beritaService.update(BigInt(id), data);
    return response.success(res, berita, 'Berita berhasil diperbarui');
  })
);

/**
 * POST /api/berita/:id/publish - Publish berita
 */
router.post(
  '/:id/publish',
  authenticateInternal(),
  authorize('berita.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const berita = await beritaService.publish(BigInt(id));
    return response.success(res, berita, 'Berita berhasil dipublikasikan');
  })
);

/**
 * POST /api/berita/:id/archive - Archive berita
 */
router.post(
  '/:id/archive',
  authenticateInternal(),
  authorize('berita.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const berita = await beritaService.archive(BigInt(id));
    return response.success(res, berita, 'Berita berhasil diarsipkan');
  })
);

/**
 * DELETE /api/berita/:id - Soft delete berita
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('berita.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await beritaService.softDelete(BigInt(id));
    return response.success(res, null, 'Berita berhasil dihapus');
  })
);

export default router;
