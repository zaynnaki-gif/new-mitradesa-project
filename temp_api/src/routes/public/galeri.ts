import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { mediaService } from '../../services/media.service.js';
import { z } from 'zod';

const router = Router();

const queryMediaSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  fileType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']).optional(),
  kategori: z.string().optional(),
  urutan: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/public/galeri - List public media (images etc)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = queryMediaSchema.parse(req.query);
    // Overwrite fileType to only show images for galeri if not specified
    if (!query.fileType) {
      query.fileType = 'IMAGE';
    }
    const result = await mediaService.findAll(query);
    return response.success(res, result.data, 'Daftar Galeri', result.meta as unknown as Record<string, unknown>);
  })
);

export default router;
