import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { umkmService } from '../../services/umkm.service.js';
import {
  createUmkmSchema,
  updateUmkmSchema,
  queryUmkmSchema,
  idParamSchema,
} from '../../dto/umkm.dto.js';


const router = Router();

/**
 * GET /api/umkm - List all UMKM
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('umkm.view'),
  asyncHandler(async (req, res) => {
    const query = queryUmkmSchema.parse(req.query);
    const result = await umkmService.findAll(query);
    return response.success(res, result.data, 'Daftar UMKM', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/umkm/:id - Get UMKM by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('umkm.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const umkm = await umkmService.findById(BigInt(id));
    return response.success(res, umkm, 'Detail UMKM');
  })
);

/**
 * POST /api/umkm - Create new UMKM
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('umkm.create'),
  asyncHandler(async (req, res) => {
    const data = createUmkmSchema.parse(req.body);
    const umkm = await umkmService.create(data);
    return response.created(res, umkm, 'UMKM berhasil dibuat');
  })
);

/**
 * PATCH /api/umkm/:id - Update UMKM
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('umkm.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateUmkmSchema.parse(req.body);
    const umkm = await umkmService.update(BigInt(id), data);
    return response.success(res, umkm, 'UMKM berhasil diperbarui');
  })
);

/**
 * DELETE /api/umkm/:id - Delete UMKM
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('umkm.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await umkmService.delete(BigInt(id));
    return response.success(res, null, 'UMKM berhasil dihapus');
  })
);

export default router;
