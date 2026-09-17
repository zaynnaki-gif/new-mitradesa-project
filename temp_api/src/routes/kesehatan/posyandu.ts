import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { response, asyncHandler, ApiError } from '../../utils/response.js';
import { getInstanceContext } from '../../config/instance.js';

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

router.get('/', authorize('kesehatan.view'), asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, kategori, tanggalMulai, tanggalSelesai } = querySchema.parse(req.query);
  const { desaId } = getInstanceContext();

  const skip = (page - 1) * limit;
  const where: any = { desaId }; // eslint-disable-line @typescript-eslint/no-explicit-any

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
}));

// ============================================
// Create
// ============================================

router.post('/', authorize('kesehatan.manage'), asyncHandler(async (req: Request, res: Response) => {
  const { desaId } = getInstanceContext();
  const data = createSchema.parse(req.body);

  // Validate penduduk belongs to village
  const penduduk = await prisma.penduduk.findFirst({
    where: { id: data.pendudukId, desaId },
  });
  if (!penduduk) {
    throw ApiError.badRequest('Penduduk tidak ditemukan atau bukan warga desa ini');
  }

  // Automatic WHO Z-Score calculation for BALITA
  let calculatedStatusGizi = data.statusGizi;
  if (data.kategori === 'BALITA' && (data.beratBadan || data.panjangBadan)) {
    const tglLahir = penduduk.tanggalLahir ? new Date(penduduk.tanggalLahir) : null;
    const tglKunjungan = new Date(data.tanggalKunjungan);
    let ageMonths = 12; // default if birthdate unavailable
    if (tglLahir) {
      const diffMs = tglKunjungan.getTime() - tglLahir.getTime();
      ageMonths = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
    }

    const { calculateZScores } = await import('../../utils/who-growth.js');
    const zResult = calculateZScores({
      ageInMonths: ageMonths,
      gender: (penduduk.jenisKelamin === 'P' ? 'P' : 'L'),
      weightKg: data.beratBadan,
      heightCm: data.panjangBadan,
    });
    calculatedStatusGizi = calculatedStatusGizi || zResult.summary;
  }

  const created = await prisma.posyanduKunjungan.create({
    data: {
      desaId,
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
      statusGizi: calculatedStatusGizi,
      imunisasi: data.imunisasi,
      vitamin: data.vitamin,
      catatan: data.catatan,
    },
  });
  return res.status(201).json({ success: true, data: { ...created, pendudukId: created.pendudukId.toString() } });
}));

// ============================================
// Get One
// ============================================

router.get('/:id', authorize('kesehatan.view'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { desaId } = getInstanceContext();
  const item = await prisma.posyanduKunjungan.findFirst({ where: { id, desaId } });
  if (!item) throw ApiError.notFound('Data tidak ditemukan');
  return response.success(res, { ...item, pendudukId: item.pendudukId.toString() });
}));

// ============================================
// Update
// ============================================

router.patch('/:id', authorize('kesehatan.manage'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { desaId } = getInstanceContext();
  const data = updateSchema.parse(req.body);
  const existing = await prisma.posyanduKunjungan.findFirst({ where: { id, desaId } });
  if (!existing) throw ApiError.notFound('Data tidak ditemukan');

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
}));

// ============================================
// Delete
// ============================================

router.delete('/:id', authorize('kesehatan.manage'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { desaId } = getInstanceContext();
  const existing = await prisma.posyanduKunjungan.findFirst({ where: { id, desaId } });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }
  await prisma.posyanduKunjungan.delete({ where: { id } });
  return response.success(res, null, 'Kunjungan berhasil dihapus');
}));

export default router;
