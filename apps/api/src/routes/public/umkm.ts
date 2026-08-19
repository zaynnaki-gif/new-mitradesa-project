import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { prisma } from '../../services/prisma.js';
import { z } from 'zod';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  kategori: z.string().optional(),
});

const slugSchema = z.object({ slug: z.string().min(1) });

/**
 * GET /api/public/umkm - List active UMKM
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, kategori } = querySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isAktif: true };

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
        { pemilik: { contains: search, mode: 'insensitive' } },
        { kategori: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (kategori) {
      where.kategori = kategori;
    }

    const [data, total] = await Promise.all([
      prisma.umkm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nama: true,
          slug: true,
          deskripsi: true,
          kategori: true,
          gambarUrl: true,
          harga: true,
          kontak: true,
          pemilik: true,
          createdAt: true,
        },
      }),
      prisma.umkm.count({ where }),
    ]);

    const meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return response.success(res, data, 'Daftar UMKM', meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/public/umkm/:slug - Get UMKM detail by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = slugSchema.parse(req.params);

    const data = await prisma.umkm.findUnique({
      where: { slug, isAktif: true },
    });

    if (!data) {
      return response.notFound(res, 'UMKM tidak ditemukan');
    }

    return response.success(res, data, 'Detail UMKM');
  })
);

export default router;
