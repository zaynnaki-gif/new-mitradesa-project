import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { pendudukService } from '../../services/penduduk.service.js';
import {
  createPendudukSchema,
  updatePendudukSchema,
  queryPendudukSchema,
  idParamSchema,
} from '../../dto/penduduk.dto.js';

const router = Router();

/**
 * Validation schemas
 */
const createSchema = createPendudukSchema;
const updateSchema = updatePendudukSchema;
const querySchema = queryPendudukSchema;
const idSchema = idParamSchema;

/**
 * @route   GET /api/penduduk
 * @desc    Get all penduduks with pagination
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await pendudukService.findAll(query, {
      maskNik: false, // Admin gets full NIK
      maskContact: false,
    });
    return response.success(res, result.data, 'Penduduk list retrieved', result.meta);
  })
);

/**
 * @route   GET /api/penduduk/stats
 * @desc    Get penduduk statistics
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (_req, res) => {
    const stats = await pendudukService.getStats();
    return response.success(res, stats, 'Statistics retrieved');
  })
);

/**
 * @route   GET /api/penduduk/:id
 * @desc    Get penduduk by ID
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const penduduk = await pendudukService.findById(id, {
      maskNik: false,
      maskContact: false,
    });
    return response.success(res, penduduk, 'Penduduk retrieved');
  })
);

/**
 * @route   GET /api/penduduk/nik/:nik
 * @desc    Get penduduk by NIK
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/nik/:nik',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (req, res) => {
    const nik = req.params.nik;

    // Validate NIK format
    if (!/^\d{16}$/.test(nik)) {
      throw ApiError.badRequest('NIK must be exactly 16 digits');
    }

    const penduduk = await pendudukService.findByNik(nik, {
      maskNik: false,
      maskContact: false,
    });
    return response.success(res, penduduk, 'Penduduk retrieved');
  })
);

/**
 * @route   POST /api/penduduk
 * @desc    Create new penduduk
 * @access  Private (Admin with penduduk.create)
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('penduduk.create'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const actorId = req.user?.accountId;
    const penduduk = await pendudukService.create(data, actorId, req.ip, req.headers['user-agent']);
    return response.created(res, penduduk, 'Penduduk created successfully');
  })
);

/**
 * @route   PATCH /api/penduduk/:id
 * @desc    Update penduduk
 * @access  Private (Admin with penduduk.update)
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('penduduk.update'),
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const data = updateSchema.parse(req.body);
    const actorId = req.user?.accountId;
    const penduduk = await pendudukService.update(id, data, actorId, req.ip, req.headers['user-agent']);
    return response.success(res, penduduk, 'Penduduk updated successfully');
  })
);

/**
 * @route   DELETE /api/penduduk/:id
 * @desc    Soft delete penduduk
 * @access  Private (Admin with penduduk.delete)
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('penduduk.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const actorId = req.user?.accountId;
    await pendudukService.softDelete(id, actorId, req.ip, req.headers['user-agent']);
    return response.success(res, null, 'Penduduk deactivated successfully');
  })
);

export default router;
