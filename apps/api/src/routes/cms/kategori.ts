import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { kategoriService } from '../../services/kategori.service.js';
import {
  createKategoriSchema,
  updateKategoriSchema,
  queryKategoriSchema,
  idParamSchema,
} from '../../dto/cms.dto.js';

const router = Router();

/**
 * GET /api/kategori - List all kategoris
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('kategori.view'),
  asyncHandler(async (req, res) => {
    const query = queryKategoriSchema.parse(req.query);
    const result = await kategoriService.findAll(query);
    return response.success(res, result.data, 'Daftar Kategori', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/kategori/stats - Get statistics
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('kategori.view'),
  asyncHandler(async (_req, res) => {
    const stats = await kategoriService.getStats();
    return response.success(res, stats, 'Statistik Kategori');
  })
);

/**
 * GET /api/kategori/active - List active kategoris (for dropdowns)
 */
router.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const kategoris = await kategoriService.findActive();
    return response.success(res, kategoris, 'Daftar Kategori Aktif');
  })
);

/**
 * GET /api/kategori/:id - Get kategori by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('kategori.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const kategori = await kategoriService.findById(BigInt(id));
    return response.success(res, kategori, 'Detail Kategori');
  })
);

/**
 * GET /api/kategori/slug/:slug - Get kategori by slug
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const kategori = await kategoriService.findBySlug(req.params.slug);
    return response.success(res, kategori, 'Detail Kategori');
  })
);

/**
 * POST /api/kategori - Create new kategori
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('kategori.create'),
  asyncHandler(async (req, res) => {
    const data = createKategoriSchema.parse(req.body);
    const kategori = await kategoriService.create(data);
    return response.created(res, kategori, 'Kategori berhasil dibuat');
  })
);

/**
 * PATCH /api/kategori/:id - Update kategori
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('kategori.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateKategoriSchema.parse(req.body);
    const kategori = await kategoriService.update(BigInt(id), data);
    return response.success(res, kategori, 'Kategori berhasil diperbarui');
  })
);

/**
 * DELETE /api/kategori/:id - Delete kategori
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('kategori.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await kategoriService.delete(BigInt(id));
    return response.success(res, null, 'Kategori berhasil dihapus');
  })
);

export default router;
