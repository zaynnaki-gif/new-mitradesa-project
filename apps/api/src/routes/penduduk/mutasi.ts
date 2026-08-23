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
  jenisMutasi: z.enum(['LAHIR', 'MATI', 'PINDAH_DATANG', 'PINDAH_PERGI']),
  tanggalMutasi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit'),
  namaLengkap: z.string().min(1).max(255),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tempatLahir: z.string().max(100).optional(),
  nikAyah: z.string().regex(/^\d{16}$/).optional(),
  nikIbu: z.string().regex(/^\d{16}$/).optional(),
  penyebabMati: z.string().max(255).optional(),
  alamatAsal: z.string().max(500).optional(),
  desaAsal: z.string().max(255).optional(),
  kecamatanAsal: z.string().max(255).optional(),
  kabupatenAsal: z.string().max(255).optional(),
  alamatTujuan: z.string().max(500).optional(),
  desaTujuan: z.string().max(255).optional(),
  kecamatanTujuan: z.string().max(255).optional(),
  kabupatenTujuan: z.string().max(255).optional(),
  keterangan: z.string().max(500).optional(),
  dokumenUrl: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  jenisMutasi: z.enum(['LAHIR', 'MATI', 'PINDAH_DATANG', 'PINDAH_PERGI']).optional(),
  tahun: z.coerce.number().int().optional(),
  tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================
// List with pagination & filters
// ============================================

router.get('/', async (req, res) => {
  try {
    const { page, limit, search, jenisMutasi, tahun, tanggalMulai, tanggalSelesai } = querySchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (jenisMutasi) where.jenisMutasi = jenisMutasi;
    if (tahun) {
      const startOfYear = new Date(`${tahun}-01-01`);
      const endOfYear = new Date(`${tahun}-12-31`);
      where.tanggalMutasi = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }
    if (tanggalMulai || tanggalSelesai) {
      where.tanggalMutasi = {
        ...(typeof where.tanggalMutasi === 'object' ? where.tanggalMutasi : {}),
        ...(tanggalMulai && { gte: new Date(tanggalMulai) }),
        ...(tanggalSelesai && { lte: new Date(tanggalSelesai) }),
      };
    }
    if (search) {
      where.OR = [
        { nik: { contains: search, mode: 'insensitive' } },
        { namaLengkap: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.mutasiPenduduk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mutasiPenduduk.count({ where }),
    ]);

    return response.success(res, {
      data: data.map(k => ({
        ...k,
        tanggalMutasi: k.tanggalMutasi?.toISOString(),
        tanggalLahir: k.tanggalLahir?.toISOString(),
        createdAt: k.createdAt?.toISOString(),
        updatedAt: k.updatedAt?.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Mutasi list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Statistics
// ============================================

router.get('/stats', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfYear = new Date(`${currentYear}-12-31`);

    const [lahir, mati, pindahDatang, pindahPergi] = await Promise.all([
      prisma.mutasiPenduduk.count({
        where: {
          jenisMutasi: 'LAHIR',
          tanggalMutasi: { gte: startOfYear, lte: endOfYear },
        },
      }),
      prisma.mutasiPenduduk.count({
        where: {
          jenisMutasi: 'MATI',
          tanggalMutasi: { gte: startOfYear, lte: endOfYear },
        },
      }),
      prisma.mutasiPenduduk.count({
        where: {
          jenisMutasi: 'PINDAH_DATANG',
          tanggalMutasi: { gte: startOfYear, lte: endOfYear },
        },
      }),
      prisma.mutasiPenduduk.count({
        where: {
          jenisMutasi: 'PINDAH_PERGI',
          tanggalMutasi: { gte: startOfYear, lte: endOfYear },
        },
      }),
    ]);

    return response.success(res, {
      tahun: currentYear,
      lahir,
      mati,
      pindahDatang,
      pindahPergi,
      netto: (lahir + pindahDatang) - (mati + pindahPergi),
    });
  } catch (err) {
    console.error('Mutasi stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Create
// ============================================

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    const created = await prisma.mutasiPenduduk.create({
      data: {
        jenisMutasi: data.jenisMutasi,
        tanggalMutasi: new Date(data.tanggalMutasi),
        nik: data.nik,
        namaLengkap: data.namaLengkap,
        jenisKelamin: data.jenisKelamin,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
        tempatLahir: data.tempatLahir,
        nikAyah: data.nikAyah,
        nikIbu: data.nikIbu,
        penyebabMati: data.penyebabMati,
        alamatAsal: data.alamatAsal,
        desaAsal: data.desaAsal,
        kecamatanAsal: data.kecamatanAsal,
        kabupatenAsal: data.kabupatenAsal,
        alamatTujuan: data.alamatTujuan,
        desaTujuan: data.desaTujuan,
        kecamatanTujuan: data.kecamatanTujuan,
        kabupatenTujuan: data.kabupatenTujuan,
        keterangan: data.keterangan,
        dokumenUrl: data.dokumenUrl,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        ...created,
        tanggalMutasi: created.tanggalMutasi?.toISOString(),
        tanggalLahir: created.tanggalLahir?.toISOString(),
        createdAt: created.createdAt?.toISOString(),
        updatedAt: created.updatedAt?.toISOString(),
      },
      message: 'Data mutasi berhasil disimpan',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Mutasi create error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Get One
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.mutasiPenduduk.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    return response.success(res, {
      ...item,
      tanggalMutasi: item.tanggalMutasi?.toISOString(),
      tanggalLahir: item.tanggalLahir?.toISOString(),
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
    });
  } catch (err) {
    console.error('Mutasi get error:', err);
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

    const existing = await prisma.mutasiPenduduk.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    const updated = await prisma.mutasiPenduduk.update({
      where: { id },
      data: {
        ...(data.jenisMutasi !== undefined && { jenisMutasi: data.jenisMutasi }),
        ...(data.tanggalMutasi !== undefined && { tanggalMutasi: new Date(data.tanggalMutasi) }),
        ...(data.nik !== undefined && { nik: data.nik }),
        ...(data.namaLengkap !== undefined && { namaLengkap: data.namaLengkap }),
        ...(data.jenisKelamin !== undefined && { jenisKelamin: data.jenisKelamin }),
        ...(data.tanggalLahir !== undefined && { tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null }),
        ...(data.tempatLahir !== undefined && { tempatLahir: data.tempatLahir }),
        ...(data.nikAyah !== undefined && { nikAyah: data.nikAyah }),
        ...(data.nikIbu !== undefined && { nikIbu: data.nikIbu }),
        ...(data.penyebabMati !== undefined && { penyebabMati: data.penyebabMati }),
        ...(data.alamatAsal !== undefined && { alamatAsal: data.alamatAsal }),
        ...(data.desaAsal !== undefined && { desaAsal: data.desaAsal }),
        ...(data.kecamatanAsal !== undefined && { kecamatanAsal: data.kecamatanAsal }),
        ...(data.kabupatenAsal !== undefined && { kabupatenAsal: data.kabupatenAsal }),
        ...(data.alamatTujuan !== undefined && { alamatTujuan: data.alamatTujuan }),
        ...(data.desaTujuan !== undefined && { desaTujuan: data.desaTujuan }),
        ...(data.kecamatanTujuan !== undefined && { kecamatanTujuan: data.kecamatanTujuan }),
        ...(data.kabupatenTujuan !== undefined && { kabupatenTujuan: data.kabupatenTujuan }),
        ...(data.keterangan !== undefined && { keterangan: data.keterangan }),
        ...(data.dokumenUrl !== undefined && { dokumenUrl: data.dokumenUrl }),
      },
    });

    return response.success(res, {
      ...updated,
      tanggalMutasi: updated.tanggalMutasi?.toISOString(),
      tanggalLahir: updated.tanggalLahir?.toISOString(),
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    }, 'Data mutasi berhasil diperbarui');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', error: err.errors });
    }
    console.error('Mutasi update error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ============================================
// Delete
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.mutasiPenduduk.delete({ where: { id } });
    return response.success(res, null, 'Data mutasi berhasil dihapus');
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    console.error('Mutasi delete error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

export default router;
