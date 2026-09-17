import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { transparansiService } from '../../services/transparansi.service.js';
import { idParamSchema } from '../../dto/transparansi.dto.js';
import { z } from 'zod';

const router = Router();

const createApbdesItemSchema = z.object({
  kategori: z.enum(['PENDAPATAN', 'BELANJA', 'PEMBIAYAAN']),
  kodeRekening: z.string().max(50).optional().nullable(),
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  anggaran: z.coerce.number().min(0).default(0),
  realization: z.coerce.number().min(0).default(0),
});

const updateApbdesItemSchema = z.object({
  kodeRekening: z.string().max(50).optional().nullable(),
  nama: z.string().min(1).max(255).optional(),
  anggaran: z.coerce.number().min(0).optional(),
  realization: z.coerce.number().min(0).optional(),
});

/**
 * GET /api/transparansi/:id/items - Get items for an APBDes
 */
router.get(
  '/:id/items',
  authenticateInternal(),
  authorize('transparansi.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const apbdes = await transparansiService.findById(BigInt(id));
    return response.success(res, apbdes.items, 'Rincian APBDes');
  })
);

/**
 * POST /api/transparansi/:id/items - Add item to APBDes
 */
router.post(
  '/:id/items',
  authenticateInternal(),
  authorize('transparansi.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = createApbdesItemSchema.parse(req.body) as { 
      kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN'; 
      nama: string; 
      anggaran: number; 
      realization: number 
    };
    const item = await transparansiService.addItem(BigInt(id), data);
    return response.created(res, item, 'Rincian berhasil ditambahkan');
  })
);

/**
 * PATCH /api/transparansi/:apbdesId/items/:itemId - Update an item
 */
router.patch(
  '/:apbdesId/items/:itemId',
  authenticateInternal(),
  authorize('transparansi.update'),
  asyncHandler(async (req, res) => {
    const { apbdesId, itemId } = z.object({
      apbdesId: z.string().regex(/^\d+$/),
      itemId: z.string().regex(/^\d+$/),
    }).parse(req.params);

    const data = updateApbdesItemSchema.parse(req.body);
    const item = await transparansiService.updateItem(BigInt(apbdesId), BigInt(itemId), data);
    return response.success(res, item, 'Rincian berhasil diperbarui');
  })
);

/**
 * DELETE /api/transparansi/:apbdesId/items/:itemId - Delete an item
 */
router.delete(
  '/:apbdesId/items/:itemId',
  authenticateInternal(),
  authorize('transparansi.update'),
  asyncHandler(async (req, res) => {
    const { apbdesId, itemId } = z.object({
      apbdesId: z.string().regex(/^\d+$/),
      itemId: z.string().regex(/^\d+$/),
    }).parse(req.params);

    await transparansiService.deleteItem(BigInt(apbdesId), BigInt(itemId));
    return response.success(res, null, 'Rincian berhasil dihapus');
  })
);

export default router;
