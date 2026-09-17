import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { Prisma } from '@prisma/client';
import { authenticateInternal, authorize, publicSaranRateLimiter } from '../../middleware/index.js';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { getInstanceContext } from '../../config/instance.js';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  judul: z.string().min(1).max(255),
  isi: z.string().min(1),
  kategori: z.enum(['SARAN', 'ADUAN', 'ASPIRASI']),
  namaPengirim: z.string().max(255).optional(),
  emailPengirim: z.string().email().max(255).optional().or(z.literal('')),
  teleponPengirim: z.string().max(20).optional(),
});

// ============================================
// Public submission route (Citizens can submit complaints/suggestions freely)
// ============================================

router.post('/public', publicSaranRateLimiter, asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const data = createSchema.parse(req.body);

  const created = await prisma.saranAduan.create({
    data: {
      desaId,
      judul: data.judul,
      isi: data.isi,
      kategori: data.kategori,
      namaPengirim: data.namaPengirim || 'Warga (Anonim)',
      emailPengirim: data.emailPengirim || null,
      teleponPengirim: data.teleponPengirim || null,
      status: 'BARU',
    },
  });

  return response.created(res, {
    ...created,
    createdAt: created.createdAt?.toISOString(),
    updatedAt: created.updatedAt?.toISOString(),
  }, 'Saran atau aduan Anda berhasil dikirim dan akan ditindaklanjuti');
}));

// Protect all following routes with internal staff authentication
router.use(authenticateInternal());

const updateSchema = z.object({
  judul: z.string().min(1).max(255).optional(),
  isi: z.string().min(1).optional(),
  kategori: z.enum(['SARAN', 'ADUAN', 'ASPIRASI']).optional(),
  status: z.enum(['BARU', 'DIPROSES', 'SELESAI', 'DITOLAK']).optional(),
  namaPengirim: z.string().max(255).optional(),
  emailPengirim: z.string().email().max(255).optional().or(z.literal('')),
  teleponPengirim: z.string().max(20).optional(),
  jawaban: z.string().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  kategori: z.enum(['SARAN', 'ADUAN', 'ASPIRASI']).optional(),
  status: z.enum(['BARU', 'DIPROSES', 'SELESAI', 'DITOLAK']).optional(),
});

// ============================================
// List with pagination & filters
// ============================================

router.get('/', authorize('pemerintahan.view'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { page, limit, search, kategori, status } = querySchema.parse(req.query);

  const skip = (page - 1) * limit;
  const where: Prisma.SaranAduanWhereInput = { desaId };

  if (kategori) where.kategori = kategori;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { judul: { contains: search, mode: 'insensitive' } },
      { isi: { contains: search, mode: 'insensitive' } },
      { namaPengirim: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.saranAduan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.saranAduan.count({ where }),
  ]);

  return response.success(res, {
    data: data.map((k: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...k,
      dijawabPada: k.dijawabPada?.toISOString(),
      createdAt: k.createdAt?.toISOString(),
      updatedAt: k.updatedAt?.toISOString(),
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

// ============================================
// Statistics
// ============================================

router.get('/stats', authorize('pemerintahan.view'), asyncHandler(async (_req, res) => {
  const { desaId } = getInstanceContext();

  const whereBase: Prisma.SaranAduanWhereInput = { desaId };

  const [baru, diproses, selesai, ditolak, total] = await Promise.all([
    prisma.saranAduan.count({ where: { ...whereBase, status: 'BARU' } }),
    prisma.saranAduan.count({ where: { ...whereBase, status: 'DIPROSES' } }),
    prisma.saranAduan.count({ where: { ...whereBase, status: 'SELESAI' } }),
    prisma.saranAduan.count({ where: { ...whereBase, status: 'DITOLAK' } }),
    prisma.saranAduan.count({ where: whereBase }),
  ]);

  return response.success(res, {
    total,
    baru,
    diproses,
    selesai,
    ditolak,
  });
}));

// ============================================
// Create
// ============================================

router.post('/', authorize('pemerintahan.manage'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const data = createSchema.parse(req.body);

  const created = await prisma.saranAduan.create({
    data: {
      desaId,
      judul: data.judul,
      isi: data.isi,
      kategori: data.kategori,
      namaPengirim: data.namaPengirim || null,
      emailPengirim: data.emailPengirim || null,
      teleponPengirim: data.teleponPengirim || null,
    },
  });

  return response.created(res, {
    ...created,
    createdAt: created.createdAt?.toISOString(),
    updatedAt: created.updatedAt?.toISOString(),
  }, 'Saran/aduan berhasil terkirim');
}));

// ============================================
// Get One
// ============================================

router.get('/:id', authorize('pemerintahan.view'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;
  const item = await prisma.saranAduan.findFirst({
    where: {
      id,
      desaId,
    },
  });

  if (!item) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  return response.success(res, {
    ...item,
    dijawabPada: item.dijawabPada?.toISOString(),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  });
}));

// ============================================
// Update Status / Reply
// ============================================

router.patch('/:id', authorize('pemerintahan.manage'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.saranAduan.findFirst({
    where: {
      id,
      desaId,
    },
  });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  const updated = await prisma.saranAduan.update({
    where: { id },
    data: {
      ...(data.judul !== undefined && { judul: data.judul }),
      ...(data.isi !== undefined && { isi: data.isi }),
      ...(data.kategori !== undefined && { kategori: data.kategori }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.namaPengirim !== undefined && { namaPengirim: data.namaPengirim }),
      ...(data.emailPengirim !== undefined && { emailPengirim: data.emailPengirim }),
      ...(data.teleponPengirim !== undefined && { teleponPengirim: data.teleponPengirim }),
      ...(data.jawaban !== undefined && { 
        jawaban: data.jawaban,
        dijawabPada: data.jawaban ? new Date() : null 
      }),
    },
  });

  return response.success(res, {
    ...updated,
    dijawabPada: updated.dijawabPada?.toISOString(),
    createdAt: updated.createdAt?.toISOString(),
    updatedAt: updated.updatedAt?.toISOString(),
  }, 'Data saran/aduan berhasil diperbarui');
}));

// ============================================
// Delete
// ============================================

router.delete('/:id', authorize('pemerintahan.manage'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;

  const existing = await prisma.saranAduan.findFirst({
    where: {
      id,
      desaId,
    },
  });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  await prisma.saranAduan.delete({ where: { id } });
  return response.success(res, null, 'Data saran/aduan berhasil dihapus');
}));

export default router;
