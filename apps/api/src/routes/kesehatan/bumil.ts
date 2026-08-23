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

router.get('/', async (req, res) => {
  try {
    const { page, limit, search, trimester } = querySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { namaLengkap: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
        { telepon: { contains: search, mode: 'insensitive' } },
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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Bumil list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Stats
// ============================================

router.get('/stats', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Bumil stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Create
// ============================================

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    // Check if already registered
    const existing = await prisma.bumil.findFirst({
      where: { OR: [
        { pendudukId: data.pendudukId },
        { nik: data.nik },
      ]},
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ibu hamil dengan NIK atau penduduk yang sama sudah terdaftar',
      });
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
      } as any,
    });

    return res.status(201).json({
      success: true,
      data: { ...created, pendudukId: created.pendudukId.toString() },
      message: 'Data ibu hamil berhasil ditambahkan',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Bumil create error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get One
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.bumil.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    return response.success(res, { ...item, pendudukId: item.pendudukId.toString() });
  } catch (err) {
    console.error('Bumil get error:', err);
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

    const existing = await prisma.bumil.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
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
      } as any,
    });

    return response.success(res, {
      ...updated,
      pendudukId: updated.pendudukId.toString(),
      message: 'Data ibu hamil berhasil diperbarui',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Bumil update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Delete
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bumil.delete({ where: { id } });
    return response.success(res, null, 'Data ibu hamil berhasil dihapus');
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    console.error('Bumil delete error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

export default router;
