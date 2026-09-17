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
      return response.success(res, null, 'Data APBDes tidak ditemukan');
    }

    const serializedData = {
      ...data,
      id: data.id.toString(),
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

/**
 * GET /api/public/transparansi/rpjmdes - Get active RPJMDes with its Bidang and RKPDes
 */
router.get(
  '/rpjmdes',
  asyncHandler(async (_req, res) => {
    const data = await prisma.rpjmdes.findFirst({
      where: { status: 'AKTIF' },
      include: {
        bidangs: {
          include: {
            rkpdes: {
              orderBy: { tahun: 'asc' }
            }
          }
        }
      }
    });

    if (!data) {
      return response.success(res, null, 'Data RPJMDes aktif tidak ditemukan');
    }

    const serializedData = {
      ...data,
      id: data.id.toString(),
      bidangs: data.bidangs.map(b => ({
        ...b,
        id: b.id.toString(),
        rpjmdesId: b.rpjmdesId.toString(),
        rkpdes: b.rkpdes.map(r => ({
          ...r,
          id: r.id.toString(),
          rpjmdesBidangId: r.rpjmdesBidangId.toString(),
          apbdesItemId: r.apbdesItemId?.toString() || null,
        }))
      }))
    };

    return response.success(res, serializedData, 'Data Transparansi RPJMDes');
  })
);

export default router;
