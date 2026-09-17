import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { usulanService } from '../../services/usulan.service.js';
import { prisma } from '../../services/prisma.js';
import { z } from 'zod';

const router = Router();

/**
 * @route GET /api/public/usulan
 * @desc  Daftar semua usulan online
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [_total, data] = await Promise.all([
      prisma.usulanOnline.count({ where: { status: { not: 'DITOLAK' } } }),
      prisma.usulanOnline.findMany({
        where: { status: { not: 'DITOLAK' } },
        orderBy: { createdAt: 'desc' },
        include: { penduduk: { select: { namaLengkap: true } } }
      })
    ]);
    
    const formatted = data.map(u => ({
      id: u.id.toString(),
      judul: u.judulUsulan,
      deskripsi: u.deskripsi,
      status: u.status,
      dukungan: u.dukungan,
      penduduk: u.penduduk ? { nama: u.penduduk.namaLengkap } : null,
      createdAt: u.createdAt.toISOString()
    }));

    return response.success(res, formatted);
  })
);

/**
 * @route POST /api/public/usulan
 * @desc  Buat usulan baru (public)
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      nik: z.string().min(16).max(16),
      judul: z.string().min(3),
      deskripsi: z.string().min(10)
    });
    
    const input = schema.parse(req.body);
    
    // Find penduduk by NIK
    const penduduk = await prisma.penduduk.findUnique({ where: { nik: input.nik } });
    if (!penduduk) {
      throw new ApiError(404, 'NOT_FOUND', 'NIK tidak ditemukan di database kependudukan desa.');
    }

    const data = await usulanService.create({
      pendudukId: penduduk.id,
      judulUsulan: input.judul,
      deskripsi: input.deskripsi
    }, undefined, req.ip, req.headers['user-agent']);
    
    return response.created(res, data, 'Usulan berhasil dibuat');
  })
);

/**
 * @route POST /api/public/usulan/:id/dukung
 * @desc  Tambah dukungan untuk usulan (public)
 */
router.post(
  '/:id/dukung',
  asyncHandler(async (req, res) => {
    const { nik } = z.object({ nik: z.string().min(16).max(16) }).parse(req.body);
    
    // Validasi penduduk
    const penduduk = await prisma.penduduk.findUnique({ where: { nik } });
    if (!penduduk) {
      throw new ApiError(404, 'NOT_FOUND', 'NIK tidak terdaftar');
    }

    // Optional: Validasi jika sudah mendukung sebelumnya (bisa buat tabel UsulanDukungan jika perlu, tapi untuk MVP kita bypass / biarkan)
    // Untuk saat ini, asumsikan bisa di-klik.

    const data = await usulanService.dukung(BigInt(req.params.id));
    return response.success(res, data, 'Dukungan berhasil ditambahkan');
  })
);

export default router;
