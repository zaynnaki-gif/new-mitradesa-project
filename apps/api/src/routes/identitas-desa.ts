import { z } from 'zod';
import { asyncHandler, response, ApiError } from '../utils/response';
import { authenticateInternal, authorize } from '../middleware/index';
import { identitasDesaService } from '../services/identitas-desa.service';

const router = require('express').Router();

// Validation schema
const updateIdentitasDesaSchema = z.object({
  namaDesa: z.string().min(1).max(100).optional(),
  singkatanDesa: z.string().max(20).optional(),
  kodeDesa: z.string().max(10).optional(),
  alamat: z.string().optional(),
  kodepos: z.string().max(10).optional(),
  telepon: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logoDesaUrl: z.string().url().optional(),
  logoKabupatenUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  kepalaDesa: z.string().max(100).optional(),
  sekretarisDesa: z.string().max(100).optional(),
});

/**
 * @route   GET /api/identitas
 * @desc    Get village identity
 * @access  Public
 */
router.get('/', asyncHandler(async (_req, res) => {
  const identitas = await identitasDesaService.getIdentitasDesa();
  if (!identitas) {
    throw ApiError.notFound('Village identity not found');
  }
  return response.success(res, identitas);
}));

/**
 * @route   PUT /api/identitas
 * @desc    Update village identity
 * @access  Private (Admin)
 */
router.put(
  '/',
  authenticateInternal(),
  authorize('identitas.update'),
  asyncHandler(async (req, res) => {
    const data = updateIdentitasDesaSchema.parse(req.body);
    const identitas = await identitasDesaService.updateIdentitasDesa(data);
    return response.success(res, identitas, 'Village identity updated successfully');
  })
);

export default router;
