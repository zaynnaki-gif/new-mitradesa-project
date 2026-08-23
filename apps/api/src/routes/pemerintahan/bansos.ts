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

router.get('/', async (req, res) => {
  try {
    const { page, limit, search, tahun, jenis } = querySchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: any = {};

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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Bansos list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Statistics / Summary
// ============================================

router.get('/stats', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Summary per tahun
    const yearlySummary = await prisma.bansos.groupBy({
      by: ['tahun'],
      _sum: { jumlahPenerima: true, jumlahDana: true },
      _count: true,
      orderBy: { tahun: 'desc' },
      take: 10,
    });

    // Summary tahun berjalan
    const currentYearData = await prisma.bansos.aggregate({
      where: { tahun: currentYear },
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
  } catch (err) {
    console.error('Bansos stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Create
// ============================================

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    const created = await prisma.bansos.create({
      data: {
        nama: data.nama,
        jenis: data.jenis,
        tahun: data.tahun,
        periode: data.periode,
        jumlahPenerima: data.jumlahPenerima,
        jumlahDana: data.jumlahDana,
      },
    });

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Data bansos berhasil disimpan',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Bansos create error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get One
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.bansos.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    return response.success(res, item);
  } catch (err) {
    console.error('Bansos get error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Update
// ============================================

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const existing = await prisma.bansos.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Bansos update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Delete
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bansos.delete({ where: { id } });
    return response.success(res, null, 'Data bansos berhasil dihapus');
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    console.error('Bansos delete error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

export default router;
