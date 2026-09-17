import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { prisma } from '../../services/prisma.js';
import { z } from 'zod';

const router = Router();

const querySchema = z.object({
  tahun: z.coerce.number().optional(),
});

/**
 * GET /api/public/transparansi/apbdes - Get APBDes data (latest or by year)
 */
router.get(
  '/apbdes',
  asyncHandler(async (req, res) => {
    const { tahun } = querySchema.parse(req.query);

    const where: Record<string, unknown> = { isAktif: true };
    if (tahun) {
      where.tahun = tahun;
    }

    const data = await prisma.apbdes.findFirst({
      where,
      include: { items: true },
      orderBy: { tahun: 'desc' },
    });

    if (!data) {
      return response.notFound(res, 'Data APBDes tidak ditemukan');
    }

    const serializedData = {
      ...data,
      id: data.id.toString(),
      desaId: data.desaId.toString(),
      items: data.items.map(item => ({
        ...item,
        id: item.id.toString(),
        apbdesId: item.apbdesId.toString(),
      })),
    };

    return response.success(res, serializedData, 'Data Transparansi APBDes');
  })
);

/**
 * GET /api/public/transparansi/apbdes/years - Get list of available APBDes years
 */
router.get(
  '/apbdes/years',
  asyncHandler(async (_req, res) => {
    const records = await prisma.apbdes.findMany({
      where: { isAktif: true },
      select: { tahun: true },
      orderBy: { tahun: 'desc' },
    });

    const years = records.map(r => r.tahun);
    return response.success(res, years, 'Daftar Tahun APBDes');
  })
);

export default router;
