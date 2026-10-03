import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { response, asyncHandler, ApiError } from '../../utils/response.js';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticateInternal());

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  pendudukId: z.string().regex(/^\d+$/, 'ID harus angka').transform(s => BigInt(s)),
  namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi').max(255),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  telepon: z.string().max(20).optional(),
  alamat: z.string().max(500).optional(),
  trimester: z.number().int().min(1).max(4).optional().default(1),
  gubugId: z.string().max(100).optional(),
  rtId: z.string().max(10).optional(),
  rwId: z.string().max(10).optional(),
});

const updateSchema = createSchema.partial().omit({ pendudukId: true });

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  trimester: z.coerce.number().int().optional(),
});

// ============================================
// List with pagination & filters
// ============================================

router.get('/', authorize('kesehatan.view'), asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, trimester } = querySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Prisma.BumilWhereInput = {};
  if (search) {
    where.AND = [
      {
        OR: [
          { namaLengkap: { contains: search, mode: 'insensitive' } },
          { nik: { contains: search, mode: 'insensitive' } },
          { telepon: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }
  if (trimester) {
    where.trimester = trimester;
  }

  const [data, total] = await Promise.all([
    prisma.bumil.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bumil.count({ where }),
  ]);

  return response.success(res, {
    data: data.map(b => ({
      ...b,
      pendudukId: b.pendudukId.toString(),
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

// ============================================
// Stats
// ============================================

router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const [total, byTrimester] = await Promise.all([
    prisma.bumil.count(),
    prisma.bumil.groupBy({
      by: ['trimester'],
      _count: true,
    }),
  ]);

  return response.success(res, {
    total,
    byTrimester: byTrimester.map(t => ({
      trimester: t.trimester,
      count: t._count,
    })),
  });
}));

// ============================================
// Create
// ============================================

router.post('/', authorize('kesehatan.manage'), asyncHandler(async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);

  // Validate that penduduk belongs to this village
  const penduduk = await prisma.penduduk.findFirst({
    where: { id: data.pendudukId },
  });
  if (!penduduk) {
    throw ApiError.badRequest('Penduduk tidak ditemukan atau bukan warga desa ini');
  }

  // Check if already registered
  const existing = await prisma.bumil.findFirst({
    where: {
      OR: [
        { pendudukId: data.pendudukId },
        { nik: data.nik },
      ],
    },
  });

  if (existing) {
    throw ApiError.badRequest('Ibu hamil dengan NIK atau penduduk yang sama sudah terdaftar di desa ini');
  }

  const created = await prisma.bumil.create({
    data: {
      pendudukId: data.pendudukId,
      namaLengkap: data.namaLengkap,
      nik: data.nik,
      telepon: data.telepon,
      alamat: data.alamat,
      trimester: data.trimester,
      gubugId: data.gubugId ? BigInt(data.gubugId) : null,
      rtId: data.rtId ? BigInt(data.rtId) : null,
      rwId: data.rwId ? BigInt(data.rwId) : null,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  return res.status(201).json({
    success: true,
    data: { ...created, pendudukId: created.pendudukId.toString() },
    message: 'Data ibu hamil berhasil ditambahkan',
  });
}));

// ============================================
// Get One
// ============================================

router.get('/:id', authorize('kesehatan.view'), asyncHandler(async (req: Request, res: Response) => {
  const { id: idStr } = req.params;
  const id = BigInt(idStr);
  const item = await prisma.bumil.findFirst({ where: { id } });
  if (!item) {
    throw ApiError.notFound('Data tidak ditemukan');
  }
  return response.success(res, { ...item, pendudukId: item.pendudukId.toString() });
}));

// ============================================
// Update
// ============================================

router.patch('/:id', authorize('kesehatan.manage'), asyncHandler(async (req: Request, res: Response) => {
  const { id: idStr } = req.params;
  const id = BigInt(idStr);
  const data = updateSchema.parse(req.body);

  const existing = await prisma.bumil.findFirst({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  const updated = await prisma.bumil.update({
    where: { id },
    data: {
      ...(data.namaLengkap !== undefined && { namaLengkap: data.namaLengkap }),
      ...(data.nik !== undefined && { nik: data.nik }),
      ...(data.telepon !== undefined && { telepon: data.telepon }),
      ...(data.alamat !== undefined && { alamat: data.alamat }),
      ...(data.trimester !== undefined && { trimester: data.trimester }),
      ...(data.gubugId !== undefined && { gubugId: data.gubugId ? BigInt(data.gubugId) : null }),
      ...(data.rtId !== undefined && { rtId: data.rtId ? BigInt(data.rtId) : null }),
      ...(data.rwId !== undefined && { rwId: data.rwId ? BigInt(data.rwId) : null }),
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  return response.success(res, {
    ...updated,
    pendudukId: updated.pendudukId.toString(),
    message: 'Data ibu hamil berhasil diperbarui',
  });
}));

// ============================================
// Delete
// ============================================

router.delete('/:id', authorize('kesehatan.manage'), asyncHandler(async (req: Request, res: Response) => {
  const { id: idStr } = req.params;
  const id = BigInt(idStr);
  const existing = await prisma.bumil.findFirst({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }
  await prisma.bumil.delete({ where: { id } });
  return response.success(res, null, 'Data ibu hamil berhasil dihapus');
}));

export default router;
