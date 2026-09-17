import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { votingService } from '../../services/voting.service.js';
import { prisma } from '../../services/prisma.js';
import { z } from 'zod';

const router = Router();

/**
 * @route GET /api/public/voting
 * @desc  Daftar semua acara voting
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Only return voting events that are not DRAFT for public, or we can just fetch all?
    // Let's use the service but filter manually
    const data = await votingService.findAll();
    // Return them in public format
    const formatted = data.map(v => ({
      id: v.id,
      judul: v.judul,
      deskripsi: v.deskripsi,
      waktuMulai: v.waktuMulai,
      waktuSelesai: v.waktuSelesai,
      status: v.status,
      kandidat: v.kandidats
    }));
    return response.success(res, formatted);
  })
);

/**
 * @route GET /api/public/voting/:id
 * @desc  Detail voting
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await votingService.findById(BigInt(req.params.id));
    return response.success(res, data);
  })
);

/**
 * @route POST /api/public/voting/:id/vote
 * @desc  Berikan suara (public)
 */
router.post(
  '/:id/vote',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      nik: z.string().min(16).max(16),
      kandidatId: z.string()
    });
    
    const input = schema.parse(req.body);
    
    // Validasi NIK
    const penduduk = await prisma.penduduk.findUnique({ where: { nik: input.nik } });
    if (!penduduk) {
      throw new ApiError(404, 'NOT_FOUND', 'NIK tidak terdaftar');
    }

    const data = await votingService.castVote(BigInt(req.params.id), {
      kandidatId: BigInt(input.kandidatId),
      pendudukId: penduduk.id
    });
    
    return response.success(res, data, 'Suara berhasil direkam');
  })
);

export default router;
