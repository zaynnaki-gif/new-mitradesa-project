import { ApiError } from '../../utils/response.js';
import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { potensiService } from '../../services/potensi.service.js';
import { queryPotensiSchema } from '../../dto/potensi.dto.js';

const router = Router();

/**
 * GET /api/public/potensi - List published potensi desa
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = queryPotensiSchema.parse(req.query);
    // Only fetch active potensi for public
    const result = await potensiService.findAll({ ...query, isAktif: true });
    
    return response.success(res, result.data, 'Berhasil mengambil data potensi', result.meta);
  })
);

/**
 * GET /api/public/potensi/:slug - Get potensi desa by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    if (!slug) throw ApiError.badRequest('Slug tidak boleh kosong');

    const potensi = await potensiService.findBySlug(slug);
    
    if (!potensi.isAktif) {
      throw ApiError.notFound('Potensi Desa tidak ditemukan atau tidak aktif');
    }

    return response.success(res, potensi);
  })
);

export default router;
