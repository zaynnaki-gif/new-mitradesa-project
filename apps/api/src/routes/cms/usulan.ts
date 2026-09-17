import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { usulanService } from '../../services/usulan.service.js';
import { createUsulanSchema, updateUsulanSchema, queryUsulanSchema } from '../../dto/usulan-voting.dto.js';
import { authenticateInternal } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';


const router = Router();

/**
 * @route GET /api/cms/usulan
 * @desc  Daftar semua usulan online
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('usulan.view'),
  asyncHandler(async (req, res) => {
    const query = queryUsulanSchema.parse(req.query);
    const result = await usulanService.findAll(query);
    return response.success(res, result.data, 'Daftar usulan', result.meta);
  })
);

/**
 * @route GET /api/cms/usulan/:id
 * @desc  Detail usulan
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('usulan.view'),
  asyncHandler(async (req, res) => {
    const data = await usulanService.findById(BigInt(req.params.id));
    return response.success(res, data);
  })
);

/**
 * @route POST /api/cms/usulan
 * @desc  Buat usulan baru (admin)
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('usulan.create'),
  asyncHandler(async (req, res) => {
    const input = createUsulanSchema.parse(req.body);
    const data = await usulanService.create(input, req.user?.accountId, req.ip, req.headers['user-agent']);
    return response.created(res, data, 'Usulan berhasil dibuat');
  })
);

/**
 * @route PUT /api/cms/usulan/:id
 * @desc  Update usulan (termasuk set status/rkpdesId)
 */
router.put(
  '/:id',
  authenticateInternal(),
  authorize('usulan.update'),
  asyncHandler(async (req, res) => {
    const input = updateUsulanSchema.parse(req.body);
    const data = await usulanService.update(BigInt(req.params.id), input, req.user?.accountId, req.ip, req.headers['user-agent']);
    return response.success(res, data, 'Usulan berhasil diperbarui');
  })
);

/**
 * @route POST /api/cms/usulan/:id/dukung
 * @desc  Tambah dukungan untuk usulan
 */
router.post(
  '/:id/dukung',
  asyncHandler(async (req, res) => {
    const data = await usulanService.dukung(BigInt(req.params.id));
    return response.success(res, data, 'Dukungan berhasil ditambahkan');
  })
);

/**
 * @route DELETE /api/cms/usulan/:id
 * @desc  Hapus usulan
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('usulan.delete'),
  asyncHandler(async (req, res) => {
    await usulanService.remove(BigInt(req.params.id), req.user?.accountId, req.ip, req.headers['user-agent']);
    return response.success(res, null, 'Usulan berhasil dihapus');
  })
);

export default router;
