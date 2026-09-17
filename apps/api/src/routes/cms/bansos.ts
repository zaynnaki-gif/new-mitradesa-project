import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { bansosService } from '../../services/bansos.service.js';
import {
  createBansosSchema,
  updateBansosSchema,
  queryBansosSchema,
  addPenerimaSchema,
  updatePenerimaSchema,
  idParamSchema,
  bigintIdParamSchema
} from '../../dto/bansos.dto.js';


const router = Router();


/**
 * GET /api/cms/bansos - List all Bansos Programs
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('bansos.view'),
  asyncHandler(async (req, res) => {
    const query = queryBansosSchema.parse(req.query);
    const result = await bansosService.findAll(query);
    return response.success(res, result.data, 'Daftar Program Bansos', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/cms/bansos/:id - Get Bansos by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('bansos.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const bansos = await bansosService.findById(id);
    return response.success(res, bansos, 'Detail Program Bansos');
  })
);

/**
 * POST /api/cms/bansos - Create new Bansos Program
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('bansos.create'),
  asyncHandler(async (req, res) => {
    const data = createBansosSchema.parse(req.body);
    // Remove desaId since the system handles it via other means or default
    const bansos = await bansosService.create(data);
    return response.created(res, bansos, 'Program Bansos berhasil dibuat');
  })
);

/**
 * PATCH /api/cms/bansos/:id - Update Bansos Program
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('bansos.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateBansosSchema.parse(req.body);
    const bansos = await bansosService.update(id, data);
    return response.success(res, bansos, 'Program Bansos berhasil diperbarui');
  })
);

/**
 * DELETE /api/cms/bansos/:id - Delete Bansos Program
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('bansos.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await bansosService.delete(id);
    return response.success(res, null, 'Program Bansos berhasil dihapus');
  })
);

// ==========================================
// PENERIMA BANSOS ROUTES
// ==========================================

/**
 * GET /api/cms/bansos/:id/penerima - List Penerima for a Bansos Program
 */
router.get(
  '/:id/penerima',
  authenticateInternal(),
  authorize('bansos.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const penerima = await bansosService.getPenerima(id);
    return response.success(res, penerima, 'Daftar Penerima Bansos');
  })
);

/**
 * POST /api/cms/bansos/:id/penerima - Add Penerima to a Bansos Program
 */
router.post(
  '/:id/penerima',
  authenticateInternal(),
  authorize('bansos.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = addPenerimaSchema.parse(req.body);
    const penerima = await bansosService.addPenerima(id, data);
    return response.created(res, penerima, 'Penerima berhasil ditambahkan');
  })
);

/**
 * PATCH /api/cms/bansos/penerima/:id - Update Penerima status
 */
router.patch(
  '/penerima/:id',
  authenticateInternal(),
  authorize('bansos.update'),
  asyncHandler(async (req, res) => {
    const { id } = bigintIdParamSchema.parse(req.params);
    const data = updatePenerimaSchema.parse(req.body);
    const penerima = await bansosService.updatePenerima(id, data);
    return response.success(res, penerima, 'Status penerima berhasil diperbarui');
  })
);

/**
 * DELETE /api/cms/bansos/penerima/:id - Remove Penerima
 */
router.delete(
  '/penerima/:id',
  authenticateInternal(),
  authorize('bansos.update'),
  asyncHandler(async (req, res) => {
    const { id } = bigintIdParamSchema.parse(req.params);
    await bansosService.deletePenerima(id);
    return response.success(res, null, 'Penerima berhasil dihapus dari program');
  })
);

export default router;
