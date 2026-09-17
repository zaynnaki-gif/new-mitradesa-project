import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { transparansiService } from '../../services/transparansi.service.js';
import {
  createApbdesSchema,
  updateApbdesSchema,
  queryApbdesSchema,
  idParamSchema,
} from '../../dto/transparansi.dto.js';


const router = Router();

/**
 * GET /api/transparansi - List all APBDes
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('transparansi.view'),
  asyncHandler(async (req, res) => {
    const query = queryApbdesSchema.parse(req.query);
    const result = await transparansiService.findAll(query);
    return response.success(res, result.data, 'Daftar APBDes', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/transparansi/:id - Get APBDes by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('transparansi.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const apbdes = await transparansiService.findById(BigInt(id));
    return response.success(res, apbdes, 'Detail APBDes');
  })
);

/**
 * POST /api/transparansi - Create new APBDes
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('transparansi.create'),
  asyncHandler(async (req, res) => {
    const data = createApbdesSchema.parse(req.body);
    const apbdes = await transparansiService.create(data);
    return response.created(res, apbdes, 'APBDes berhasil dibuat');
  })
);

/**
 * PATCH /api/transparansi/:id - Update APBDes
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('transparansi.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateApbdesSchema.parse(req.body);
    const apbdes = await transparansiService.update(BigInt(id), data);
    return response.success(res, apbdes, 'Data APBDes berhasil diperbarui');
  })
);

/**
 * DELETE /api/transparansi/:id - Delete APBDes
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('transparansi.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await transparansiService.delete(BigInt(id));
    return response.success(res, null, 'Data APBDes berhasil dihapus');
  })
);

export default router;
