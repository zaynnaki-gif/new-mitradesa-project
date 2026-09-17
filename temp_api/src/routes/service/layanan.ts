import { ApiError } from '../../utils/response.js';
import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import {
  layananService,
  fieldDefinitionService,
} from '../../services/layanan.service.js';
import {
  createLayananSchema,
  updateLayananSchema,
  queryLayananSchema,
  idParamSchema,
  createFieldDefinitionSchema,
  updateFieldDefinitionSchema,
  queryFieldDefinitionSchema,
} from '../../dto/service-document.dto.js';

const router = Router();



// ============================================================
// Layanan (Service) Routes
// ============================================================

/**
 * GET /api/services - List all services
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('service.view'),
  asyncHandler(async (req, res) => {
    const query = queryLayananSchema.parse(req.query);
    const result = await layananService.findAll(query);
    return response.success(res, result.data, 'Daftar Layanan', result.meta);
  })
);

/**
 * GET /api/services/stats - Get service statistics
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('service.view'),
  asyncHandler(async (_req, res) => {
    const stats = await layananService.getStats();
    return response.success(res, stats, 'Statistik Layanan');
  })
);

/**
 * GET /api/services/:id - Get service by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('service.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const layanan = await layananService.findById(BigInt(id));
    if (!layanan) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }
    return response.success(res, layanan, 'Detail Layanan');
  })
);

/**
 * GET /api/services/slug/:slug - Get service by slug
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const layanan = await layananService.findBySlug(slug);
    if (!layanan) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }
    return response.success(res, layanan, 'Detail Layanan');
  })
);

/**
 * POST /api/services - Create new service
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('service.create'),
  asyncHandler(async (req, res) => {
    const data = createLayananSchema.parse(req.body);

    const layanan = await layananService.create(data, req.user?.accountId);
    return response.created(res, layanan, 'Layanan berhasil dibuat');
  })
);

/**
 * PATCH /api/services/:id - Update service
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('service.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateLayananSchema.parse(req.body);

    const layanan = await layananService.update(BigInt(id), data);
    return response.success(res, layanan, 'Layanan berhasil diperbarui');
  })
);

/**
 * DELETE /api/services/:id - Soft delete service
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('service.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);

    await layananService.softDelete(BigInt(id));
    return response.success(res, null, 'Layanan berhasil dihapus');
  })
);

// ============================================================
// Field Definition Routes (nested under services)
// ============================================================

/**
 * GET /api/services/:id/fields - Get fields for a service
 */
router.get(
  '/:id/fields',
  authenticateInternal(),
  authorize('service.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const query = queryFieldDefinitionSchema.parse(req.query);

    // Add layananId filter
    const queryWithLayanan = { ...query, layananId: parseInt(id) };
    const result = await fieldDefinitionService.findAll(queryWithLayanan);

    return response.success(res, result.data, 'Daftar Field', result.meta);
  })
);

/**
 * POST /api/services/:id/fields - Create field for a service
 */
router.post(
  '/:id/fields',
  authenticateInternal(),
  authorize('service.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = createFieldDefinitionSchema.parse(req.body);

    // Add layananId
    const dataWithLayanan = { ...data, layananId: parseInt(id) };

    const field = await fieldDefinitionService.create(dataWithLayanan);
    return response.created(res, field, 'Field berhasil dibuat');
  })
);

/**
 * PATCH /api/services/:id/fields/:fieldId - Update field
 */
router.patch(
  '/:id/fields/:fieldId',
  authenticateInternal(),
  authorize('service.update'),
  asyncHandler(async (req, res) => {
    const fieldId = req.params.fieldId;
    if (!fieldId || !/^\d+$/.test(fieldId)) {
      throw ApiError.badRequest('Field ID harus angka');
    }
    const data = updateFieldDefinitionSchema.parse(req.body);

    const field = await fieldDefinitionService.update(BigInt(fieldId), data);
    return response.success(res, field, 'Field berhasil diperbarui');
  })
);

/**
 * DELETE /api/services/:id/fields/:fieldId - Delete field
 */
router.delete(
  '/:id/fields/:fieldId',
  authenticateInternal(),
  authorize('service.update'),
  asyncHandler(async (req, res) => {
    const fieldId = req.params.fieldId;
    if (!fieldId || !/^\d+$/.test(fieldId)) {
      throw ApiError.badRequest('Field ID harus angka');
    }

    await fieldDefinitionService.delete(BigInt(fieldId));
    return response.success(res, null, 'Field berhasil dihapus');
  })
);

export default router;
