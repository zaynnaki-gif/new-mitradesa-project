import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { prisma } from '../../services/prisma.js';

const router = Router();

/**
 * GET /api/public/statistik
 * Get public village statistics (Desa Dalam Angka)
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // Count penduduk
    const totalPenduduk = await prisma.penduduk.count({
      where: {
        deletedAt: null,
      },
    });

    // Count laki-laki
    const totalLakiLaki = await prisma.penduduk.count({
      where: {
        jenisKelamin: 'L',
        deletedAt: null,
      },
    });

    // Count perempuan
    const totalPerempuan = await prisma.penduduk.count({
      where: {
        jenisKelamin: 'P',
        deletedAt: null,
      },
    });

    // Count keluarga (KK)
    const totalKeluarga = await prisma.keluarga.count({
      where: {
        deletedAt: null,
      },
    });

    // Distinct Dusun from Keluarga
    const distinctDusun = await prisma.keluarga.findMany({
      where: {
        dusun: { not: null },
        deletedAt: null,
      },
      select: {
        dusun: true,
      },
      distinct: ['dusun'],
    });

    // Distinct RT from Keluarga
    const distinctRt = await prisma.keluarga.findMany({
      where: {
        rt: { not: null },
        deletedAt: null,
      },
      select: {
        rt: true,
        rw: true,
        dusun: true,
      },
      distinct: ['rt', 'rw', 'dusun'],
    });

    // Distinct RW from Keluarga
    const distinctRw = await prisma.keluarga.findMany({
      where: {
        rw: { not: null },
        deletedAt: null,
      },
      select: {
        rw: true,
        dusun: true,
      },
      distinct: ['rw', 'dusun'],
    });

    const data = {
      penduduk: {
        total: totalPenduduk,
        lakiLaki: totalLakiLaki,
        perempuan: totalPerempuan,
      },
      keluarga: totalKeluarga,
      wilayah: {
        dusun: distinctDusun.length,
        rt: distinctRt.length,
        rw: distinctRw.length,
      }
    };

    return response.success(res, data, 'Statistik Desa');
  })
);

export default router;
