import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { authenticateInternal } from '../../middleware/index.js';
import { response } from '../../utils/response.js';

const router = Router();
router.use(authenticateInternal());

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

// _replySchema = z.object({
// const _replySchema = z.object({
//   jawaban: z.string().min(1),
// });

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

router.get('/', async (req, res) => {
  try {
    const { page, limit, search, kategori, status } = querySchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: any = {};

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
      data: data.map(k => ({
        ...k,
        dijawabPada: k.dijawabPada?.toISOString(),
        createdAt: k.createdAt?.toISOString(),
        updatedAt: k.updatedAt?.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('SaranAduan list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Statistics
// ============================================

router.get('/stats', async (_req, res) => {
  try {
    const [baru, diproses, selesai, ditolak, total] = await Promise.all([
      prisma.saranAduan.count({ where: { status: 'BARU' } }),
      prisma.saranAduan.count({ where: { status: 'DIPROSES' } }),
      prisma.saranAduan.count({ where: { status: 'SELESAI' } }),
      prisma.saranAduan.count({ where: { status: 'DITOLAK' } }),
      prisma.saranAduan.count(),
    ]);

    return response.success(res, {
      total,
      baru,
      diproses,
      selesai,
      ditolak,
    });
  } catch (err) {
    console.error('SaranAduan stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Create
// ============================================

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    const created = await prisma.saranAduan.create({
      data: {
        judul: data.judul,
        isi: data.isi,
        kategori: data.kategori,
        namaPengirim: data.namaPengirim || null,
        emailPengirim: data.emailPengirim || null,
        teleponPengirim: data.teleponPengirim || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        ...created,
        createdAt: created.createdAt?.toISOString(),
        updatedAt: created.updatedAt?.toISOString(),
      },
      message: 'Saran/aduan berhasil terkirim',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('SaranAduan create error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get One
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.saranAduan.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    return response.success(res, {
      ...item,
      dijawabPada: item.dijawabPada?.toISOString(),
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
    });
  } catch (err) {
    console.error('SaranAduan get error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Update Status / Reply
// ============================================

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const existing = await prisma.saranAduan.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
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
          dijawabPada: new Date(),
        }),
      },
    });

    return response.success(res, {
      ...updated,
      dijawabPada: updated.dijawabPada?.toISOString(),
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    }, 'Saran/aduan berhasil diperbarui');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('SaranAduan update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Delete
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.saranAduan.delete({ where: { id } });
    return response.success(res, null, 'Saran/aduan berhasil dihapus');
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    console.error('SaranAduan delete error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

export default router;
