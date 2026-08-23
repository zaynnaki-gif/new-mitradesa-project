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
  tanggalKunjungan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  kategori: z.enum(['IBU_HAMIL', 'BALITA', 'LANSIA', 'UMUM']),
  mingguKehamilan: z.number().int().positive().optional(),
  tekananDarah: z.string().max(20).optional(),
  beratBadanIbu: z.number().positive().optional(),
  tekananDarahUmum: z.string().max(20).optional(),
  gulaDarah: z.number().positive().optional(),
  beratBadan: z.number().positive().optional(),
  panjangBadan: z.number().positive().optional(),
  lingkarKepala: z.number().positive().optional(),
  statusGizi: z.string().optional(),
  imunisasi: z.string().max(255).optional(),
  vitamin: z.string().max(255).optional(),
  catatan: z.string().max(1000).optional(),
});

const updateSchema = createSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  kategori: z.enum(['IBU_HAMIL', 'BALITA', 'LANSIA', 'UMUM']).optional(),
  tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================
// List with pagination & filters
// ============================================

router.get('/', async (req, res) => {
  try {
    const { page, limit, kategori, tanggalMulai, tanggalSelesai } = querySchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (kategori) where.kategori = kategori;
    if (tanggalMulai || tanggalSelesai) {
      where.tanggalKunjungan = {};
      if (tanggalMulai) where.tanggalKunjungan.gte = new Date(tanggalMulai);
      if (tanggalSelesai) where.tanggalKunjungan.lte = new Date(tanggalSelesai);
    }

    const [data, total] = await Promise.all([
      prisma.posyanduKunjungan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.posyanduKunjungan.count({ where }),
    ]);

    return response.success(res, {
      data: data.map(k => ({
        ...k,
        pendudukId: k.pendudukId.toString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Posyandu list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Create
// ============================================

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const created = await prisma.posyanduKunjungan.create({
      data: {
        pendudukId: data.pendudukId,
        tanggalKunjungan: new Date(data.tanggalKunjungan),
        kategori: data.kategori,
        mingguKehamilan: data.mingguKehamilan,
        beratBadanIbu: data.beratBadanIbu,
        tekananDarah: data.tekananDarahUmum ?? data.tekananDarah,
        gulaDarah: data.gulaDarah,
        beratBadan: data.beratBadan,
        panjangBadan: data.panjangBadan,
        lingkarKepala: data.lingkarKepala,
        statusGizi: data.statusGizi,
        imunisasi: data.imunisasi,
        vitamin: data.vitamin,
        catatan: data.catatan,
      },
    });
    return res.status(201).json({ success: true, data: { ...created, pendudukId: created.pendudukId.toString() } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Posyandu create error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get One
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.posyanduKunjungan.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    return response.success(res, { ...item, pendudukId: item.pendudukId.toString() });
  } catch (err) {
    console.error('Posyandu get error:', err);
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
    const existing = await prisma.posyanduKunjungan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const updated = await prisma.posyanduKunjungan.update({
      where: { id },
      data: {
        ...(data.pendudukId !== undefined && { pendudukId: data.pendudukId }),
        ...(data.tanggalKunjungan !== undefined && { tanggalKunjungan: new Date(data.tanggalKunjungan) }),
        ...(data.kategori !== undefined && { kategori: data.kategori }),
        ...(data.mingguKehamilan !== undefined && { mingguKehamilan: data.mingguKehamilan }),
        ...(data.tekananDarah !== undefined && { tekananDarah: data.tekananDarah }),
        ...(data.beratBadanIbu !== undefined && { beratBadanIbu: data.beratBadanIbu }),
        ...(data.gulaDarah !== undefined && { gulaDarah: data.gulaDarah }),
        ...(data.beratBadan !== undefined && { beratBadan: data.beratBadan }),
        ...(data.panjangBadan !== undefined && { panjangBadan: data.panjangBadan }),
        ...(data.lingkarKepala !== undefined && { lingkarKepala: data.lingkarKepala }),
        ...(data.statusGizi !== undefined && { statusGizi: data.statusGizi }),
        ...(data.imunisasi !== undefined && { imunisasi: data.imunisasi }),
        ...(data.vitamin !== undefined && { vitamin: data.vitamin }),
        ...(data.catatan !== undefined && { catatan: data.catatan }),
      },
    });

    return response.success(res, { ...updated, pendudukId: updated.pendudukId.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Posyandu update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Delete
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.posyanduKunjungan.delete({ where: { id } });
    return response.success(res, null, 'Kunjungan berhasil dihapus');
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    console.error('Posyandu delete error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

export default router;
