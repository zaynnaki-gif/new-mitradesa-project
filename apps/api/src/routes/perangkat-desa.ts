import { Router } from 'express';
import { asyncHandler, response } from '../utils/response.js';
import { authenticateInternal, authorize } from '../middleware/index.js';
import { perangkatDesaService } from '../services/perangkat-desa.service.js';
import {
  createPerangkatDesaSchema,
  updatePerangkatDesaSchema,
  queryPerangkatDesaSchema,
  idParamSchema,
  linkAccountSchema,
} from '../dto/perangkat-desa.dto.js';

const router = Router();

/**
 * GET /api/perangkat-desa/public - List active perangkat desa (public)
 * Returns only public information without sensitive data
 */
router.get(
  '/public',
  asyncHandler(async (req, res) => {
    const aktifOnly = req.query.aktif !== 'false';

    const where: import('@prisma/client').Prisma.PerangkatDesaWhereInput = { deletedAt: null };
    if (aktifOnly) {
      where.status = 'AKTIF';
    }

    const perangkat = await perangkatDesaService.findAllPublic(where);
    return response.success(res, perangkat, 'Daftar Perangkat Desa');
  })
);

/**
 * GET /api/perangkat-desa - List all perangkat desa
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('perangkat_desa.view'),
  asyncHandler(async (req, res) => {
    const query = queryPerangkatDesaSchema.parse(req.query);
    const result = await perangkatDesaService.findAll(query);
    return response.success(res, result.data, 'Daftar Perangkat Desa', result.meta);
  })
);

/**
 * GET /api/perangkat-desa/:id - Get perangkat desa detail
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('perangkat_desa.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const perangkat = await perangkatDesaService.findById(id);
    return response.success(res, perangkat, 'Detail Perangkat Desa');
  })
);

/**
 * POST /api/perangkat-desa - Create perangkat desa
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('perangkat_desa.create'),
  asyncHandler(async (req, res) => {
    const data = createPerangkatDesaSchema.parse(req.body);
    const perangkat = await perangkatDesaService.create(
      data,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.created(res, perangkat, 'Perangkat Desa berhasil dibuat');
  })
);

/**
 * PATCH /api/perangkat-desa/:id - Update perangkat desa
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('perangkat_desa.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updatePerangkatDesaSchema.parse(req.body);
    const perangkat = await perangkatDesaService.update(
      id,
      data,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, perangkat, 'Perangkat Desa berhasil diperbarui');
  })
);

/**
 * DELETE /api/perangkat-desa/:id - Soft delete perangkat desa
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('perangkat_desa.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await perangkatDesaService.softDelete(
      id,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, null, 'Perangkat Desa berhasil dihapus');
  })
);

/**
 * GET /api/perangkat-desa/:id/account - Get linked account
 */
router.get(
  '/:id/account',
  authenticateInternal(),
  authorize('perangkat_desa.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const account = await perangkatDesaService.getAccount(id);
    return response.success(res, account, 'Account Perangkat Desa');
  })
);

/**
 * POST /api/perangkat-desa/:id/account - Link account
 */
router.post(
  '/:id/account',
  authenticateInternal(),
  authorize('perangkat_desa.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { accountId } = linkAccountSchema.parse(req.body);
    await perangkatDesaService.linkAccount(
      id,
      accountId,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, null, 'Account berhasil dikaitkan');
  })
);

/**
 * DELETE /api/perangkat-desa/:id/account - Unlink account
 */
router.delete(
  '/:id/account',
  authenticateInternal(),
  authorize('perangkat_desa.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await perangkatDesaService.unlinkAccount(
      id,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, null, 'Account berhasil dilepaskan');
  })
);

export default router;
