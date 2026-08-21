import { Router } from 'express';
import { asyncHandler, response } from '../utils/response';
import { authenticateInternal, authorize } from '../middleware/index';
import { keluargaService } from '../services/keluarga.service';
import {
  createKeluargaSchema,
  updateKeluargaSchema,
  queryKeluargaSchema,
  idParamSchema,
  createAnggotaSchema,
  updateAnggotaSchema,
  anggotaIdParamSchema,
} from '../dto/keluarga.dto';

const router = Router({ mergeParams: true });

/**
 * GET /api/keluarga - List all keluarga
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('keluarga.view'),
  asyncHandler(async (req, res) => {
    const query = queryKeluargaSchema.parse(req.query);
    const result = await keluargaService.findAll(query);
    return response.success(res, result.data, 'Keluarga list', result.meta);
  })
);

/**
 * GET /api/keluarga/:id - Get keluarga detail
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('keluarga.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const keluarga = await keluargaService.findById(id);
    return response.success(res, keluarga, 'Keluarga detail');
  })
);

/**
 * POST /api/keluarga - Create keluarga with kepala as anggota
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('keluarga.create'),
  asyncHandler(async (req, res) => {
    const data = createKeluargaSchema.parse(req.body);
    const keluarga = await keluargaService.create(
      data,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.created(res, keluarga, 'Keluarga berhasil dibuat');
  })
);

/**
 * PATCH /api/keluarga/:id - Update keluarga
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('keluarga.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateKeluargaSchema.parse(req.body);
    const keluarga = await keluargaService.update(
      id,
      data,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, keluarga, 'Keluarga berhasil diperbarui');
  })
);

/**
 * DELETE /api/keluarga/:id - Soft delete keluarga
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('keluarga.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await keluargaService.softDelete(
      id,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, null, 'Keluarga berhasil dihapus');
  })
);

/**
 * GET /api/keluarga/:id/anggota - List anggota
 */
router.get(
  '/:id/anggota',
  authenticateInternal(),
  authorize('keluarga.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const anggota = await keluargaService.getAnggota(id);
    return response.success(res, anggota, 'Daftar anggota keluarga');
  })
);

/**
 * POST /api/keluarga/:id/anggota - Add anggota
 */
router.post(
  '/:id/anggota',
  authenticateInternal(),
  authorize('keluarga.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = createAnggotaSchema.parse(req.body);
    const anggota = await keluargaService.addAnggota(
      id,
      data,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.created(res, anggota, 'Anggota berhasil ditambahkan');
  })
);

/**
 * PATCH /api/keluarga/:id/anggota/:anggotaId - Update anggota
 */
router.patch(
  '/:id/anggota/:anggotaId',
  authenticateInternal(),
  authorize('keluarga.update'),
  asyncHandler(async (req, res) => {
    const { id, anggotaId } = anggotaIdParamSchema.parse(req.params);
    const data = updateAnggotaSchema.parse(req.body);
    const anggota = await keluargaService.updateAnggota(
      id,
      anggotaId,
      data,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, anggota, 'Anggota berhasil diperbarui');
  })
);

/**
 * DELETE /api/keluarga/:id/anggota/:anggotaId - Remove anggota
 */
router.delete(
  '/:id/anggota/:anggotaId',
  authenticateInternal(),
  authorize('keluarga.update'),
  asyncHandler(async (req, res) => {
    const { id, anggotaId } = anggotaIdParamSchema.parse(req.params);
    await keluargaService.removeAnggota(
      id,
      anggotaId,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent']
    );
    return response.success(res, null, 'Anggota berhasil dihapus dari keluarga');
  })
);

/**
 * POST /api/keluarga/export - Export semua keluarga ke CSV
 */
router.post(
  '/export',
  authenticateInternal(),
  authorize('keluarga.view'),
  asyncHandler(async (_req, res) => {
    const csv = await keluargaService.exportToCsv();
    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="keluarga_${date}.csv"`);
    return res.send('﻿' + csv); // BOM for UTF-8
  })
);

/**
 * POST /api/keluarga/import - Import keluarga dari CSV
 */
router.post(
  '/import',
  authenticateInternal(),
  authorize('keluarga.create'),
  asyncHandler(async (req, res) => {
    const { csv } = req.body as { csv: string };
    if (!csv) {
      throw new Error('File CSV diperlukan');
    }

    const result = await keluargaService.importFromCsv(csv);

    return response.success(res, result, 'Import selesai');
  })
);

export default router;
