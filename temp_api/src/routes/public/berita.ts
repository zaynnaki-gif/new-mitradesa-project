import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { beritaService } from '../../services/berita.service.js';
import { queryBeritaSchema } from '../../dto/cms.dto.js';
import { z } from 'zod';

const router = Router();

const slugParamSchema = z.object({
  slug: z.string().min(1),
});

/**
 * GET /api/public/berita - List published berita
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = queryBeritaSchema.parse(req.query);
    const result = await beritaService.findPublished(query);
    return response.success(res, result.data, 'Daftar Berita', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/public/berita/:slug - Get published berita by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = slugParamSchema.parse(req.params);

    try {
      const result = await beritaService.findPublishedBySlug(slug);
      return response.success(res, result, 'Detail Berita');
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return response.notFound(res, 'Berita tidak ditemukan');
      }
      throw err;
    }
  })
);

export default router;
