import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { getInstanceContext } from '../../config/instance.js';

const router = Router();
router.use(authenticateInternal());

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  nama: z.string().min(1).max(255),
  jenis: z.string().min(1).max(100),
  tahun: z.number().int().positive().min(2000).max(2100),
  periode: z.string().max(50).optional(),
  jumlahPenerima: z.number().int().nonnegative().default(0),
  jumlahDana: z.number().nonnegative().default(0),
});

const updateSchema = createSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  tahun: z.coerce.number().int().optional(),
  jenis: z.string().optional(),
});

// ============================================
// List with pagination & filters
// ============================================

router.get('/', authorize('pemerintahan.view'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();

  const { page, limit, search, tahun, jenis } = querySchema.parse(req.query);

  const skip = (page - 1) * limit;
  const where: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (desaId !== undefined) where.desaId = desaId;
  if (tahun) where.tahun = tahun;
  if (jenis) where.jenis = jenis;
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: 'insensitive' } },
      { jenis: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.bansos.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bansos.count({ where }),
  ]);

  return response.success(res, {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

// ============================================
// Statistics / Summary
// ============================================

router.get('/stats', authorize('pemerintahan.view'), asyncHandler(async (_req, res) => {
  const { desaId } = getInstanceContext();
  const currentYear = new Date().getFullYear();

  const whereBase = { desaId };

  // Summary per tahun
  const yearlySummary = await prisma.bansos.groupBy({
    by: ['tahun'],
    where: whereBase,
    _sum: { jumlahPenerima: true, jumlahDana: true },
    _count: true,
    orderBy: { tahun: 'desc' },
    take: 10,
  });

  // Summary tahun berjalan
  const currentYearData = await prisma.bansos.aggregate({
    where: { ...whereBase, tahun: currentYear },
    _sum: { jumlahPenerima: true, jumlahDana: true },
    _count: true,
  });

  return response.success(res, {
    tahunBerjalan: currentYear,
    summary: {
      totalProgram: currentYearData._count || 0,
      totalPenerima: currentYearData._sum?.jumlahPenerima || 0,
      totalDana: currentYearData._sum?.jumlahDana || 0,
    },
    yearly: yearlySummary.map(y => ({
      tahun: y.tahun,
      programCount: y._count,
      totalPenerima: y._sum?.jumlahPenerima || 0,
      totalDana: y._sum?.jumlahDana || 0,
    })),
  });
}));

// ============================================
// Create
// ============================================

router.post('/', authorize('pemerintahan.manage'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const data = createSchema.parse(req.body);

  const created = await prisma.bansos.create({
    data: {
      desaId,
      nama: data.nama,
      jenis: data.jenis,
      tahun: data.tahun,
      periode: data.periode,
      jumlahPenerima: data.jumlahPenerima,
      jumlahDana: data.jumlahDana,
    },
  });

  return response.created(res, created, 'Data bansos berhasil disimpan');
}));

// ============================================
// Get One
// ============================================

router.get('/:id', authorize('pemerintahan.view'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;
  const item = await prisma.bansos.findFirst({
    where: {
      id,
      desaId,
    },
  });

  if (!item) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  return response.success(res, item);
}));

// ============================================
// Update
// ============================================

router.patch('/:id', authorize('pemerintahan.manage'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.bansos.findFirst({
    where: {
      id,
      desaId,
    },
  });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  const updated = await prisma.bansos.update({
    where: { id },
    data: {
      ...(data.nama !== undefined && { nama: data.nama }),
      ...(data.jenis !== undefined && { jenis: data.jenis }),
      ...(data.tahun !== undefined && { tahun: data.tahun }),
      ...(data.periode !== undefined && { periode: data.periode }),
      ...(data.jumlahPenerima !== undefined && { jumlahPenerima: data.jumlahPenerima }),
      ...(data.jumlahDana !== undefined && { jumlahDana: data.jumlahDana }),
    },
  });

  return response.success(res, updated, 'Data bansos berhasil diperbarui');
}));

// ============================================
// Delete
// ============================================

router.delete('/:id', authorize('pemerintahan.manage'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;

  const existing = await prisma.bansos.findFirst({
    where: {
      id,
      desaId,
    },
  });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  await prisma.bansos.delete({ where: { id } });
  return response.success(res, null, 'Data bansos berhasil dihapus');
}));

export default router;
