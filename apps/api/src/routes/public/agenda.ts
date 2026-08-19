import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { prisma } from '../../services/prisma.js';
import { z } from 'zod';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  status: z.enum(['MENDATANG', 'BERLANGSUNG', 'SELESAI', 'BATAL']).optional(),
});

const slugSchema = z.object({ slug: z.string().min(1) });

function computeDynamicStatus(
  _dbStatus: string,
  tanggalMulai: Date,
  tanggalSelesai: Date
): string {
  const now = new Date();
  if (now < tanggalMulai) return 'MENDATANG';
  if (now >= tanggalMulai && now <= tanggalSelesai) return 'BERLANGSUNG';
  return 'SELESAI';
}

function serializeAgenda(item: {
  id: bigint;
  desaId: bigint;
  status: string;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  [key: string]: unknown;
}) {
  return {
    ...item,
    id: item.id.toString(),
    desaId: item.desaId.toString(),
    status: computeDynamicStatus(item.status, item.tanggalMulai, item.tanggalSelesai),
  };
}

/**
 * GET /api/public/agenda - List active agenda
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, status } = querySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isAktif: true };

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
        { lokasi: { contains: search, mode: 'insensitive' } },
        { penyelenggara: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.agenda.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggalMulai: 'asc' },
      }),
      prisma.agenda.count({ where }),
    ]);

    const meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return response.success(
      res,
      data.map(serializeAgenda),
      'Daftar Agenda',
      meta as unknown as Record<string, unknown>
    );
  })
);

/**
 * GET /api/public/agenda/:slug - Get agenda detail by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = slugSchema.parse(req.params);

    const data = await prisma.agenda.findUnique({
      where: { slug, isAktif: true },
    });

    if (!data) {
      return response.notFound(res, 'Agenda tidak ditemukan');
    }

    return response.success(res, serializeAgenda(data), 'Detail Agenda');
  })
);

export default router;
