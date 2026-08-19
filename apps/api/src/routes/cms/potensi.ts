import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { potensiService } from '../../services/potensi.service.js';

import {
  createPotensiSchema,
  updatePotensiSchema,
  queryPotensiSchema,
  idParamSchema,
} from '../../dto/potensi.dto.js';

const router = Router();

/**
 * GET /api/potensi - List all potensi desa
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('potensi.view'),
  asyncHandler(async (req, res) => {
    const query = queryPotensiSchema.parse(req.query);
    const result = await potensiService.findAll(query);
    return response.success(res, result.data, 'Berhasil mengambil data potensi desa', result.meta);
  })
);

/**
 * GET /api/potensi/:id - Get potensi desa by id
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('potensi.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const potensi = await potensiService.findById(BigInt(id));
    return response.success(res, potensi);
  })
);

/**
 * POST /api/potensi - Create new potensi desa
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('potensi.create'),
  asyncHandler(async (req, res) => {
    const data = createPotensiSchema.parse(req.body);
    const potensi = await potensiService.create(data);
    return response.created(res, potensi, 'Potensi Desa berhasil dibuat');
  })
);

/**
 * PATCH /api/potensi/:id - Update potensi desa
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('potensi.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updatePotensiSchema.parse(req.body);
    
    const potensi = await potensiService.update(BigInt(id), data);
    return response.success(res, potensi, 'Potensi Desa berhasil diupdate');
  })
);

/**
 * DELETE /api/potensi/:id - Delete potensi desa
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('potensi.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await potensiService.delete(BigInt(id));
    return response.success(res, null, 'Potensi Desa berhasil dihapus');
  })
);

export default router;
