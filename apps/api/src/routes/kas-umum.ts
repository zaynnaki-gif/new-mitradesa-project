import { Router } from 'express';
import { asyncHandler, response } from '../utils/response.js';
import { authenticateInternal, authorize } from '../middleware/index.js';
import { kasUmumService } from '../services/kas-umum.service.js';
import {
  createKasUmumSchema,
  updateKasUmumSchema,
  queryKasUmumSchema,
  idParamSchema,
} from '../dto/kas-umum.dto.js';

const router = Router();

/**
 * GET /api/kas-umum - List kas umum entries
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('kas_umum.view'),
  asyncHandler(async (req, res) => {
    const query = queryKasUmumSchema.parse(req.query);
    const result = await kasUmumService.findAll(query);
    return response.success(res, result.data, 'Daftar kas umum', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/kas-umum/saldo - Get current saldo
 */
router.get(
  '/saldo',
  authenticateInternal(),
  authorize('kas_umum.view'),
  asyncHandler(async (req, res) => {
    const saldo = await kasUmumService.getSaldoAkhir();
    return response.success(res, { saldo }, 'Saldo akhir');
  })
);

/**
 * GET /api/kas-umum/:id - Get single entry
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('kas_umum.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const item = await kasUmumService.findById(id);
    return response.success(res, item, 'Detail kas umum');
  })
);

/**
 * POST /api/kas-umum - Create entry
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('kas_umum.create'),
  asyncHandler(async (req, res) => {
    const data = createKasUmumSchema.parse(req.body);
    const item = await kasUmumService.create(data);
    return response.created(res, item, 'Entri kas umum berhasil dibuat');
  })
);

/**
 * PATCH /api/kas-umum/:id - Update entry
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('kas_umum.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateKasUmumSchema.parse(req.body);
    const item = await kasUmumService.update(id, data);
    return response.success(res, item, 'Entri kas umum berhasil diperbarui');
  })
);

/**
 * DELETE /api/kas-umum/:id - Delete entry
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('kas_umum.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await kasUmumService.delete(id);
    return response.success(res, null, 'Entri kas umum berhasil dihapus');
  })
);

export default router;
