import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { halamanService } from '../../services/halaman.service.js';
import { ApiError } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const slugParamSchema = z.object({
  slug: z.string().min(1),
});

/**
 * GET /api/public/halaman/:slug - Get published halaman by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = slugParamSchema.parse(req.params);

    try {
      const result = await halamanService.findPublishedBySlug(slug);
      return response.success(res, result, 'Detail Halaman');
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return response.notFound(res, 'Halaman tidak ditemukan');
      }
      throw err;
    }
  })
);

export default router;
