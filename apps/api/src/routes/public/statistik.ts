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
        gubugId: { not: null },
        deletedAt: null,
      },
      select: {
        gubugId: true,
      },
      distinct: ['gubugId'],
    });

    // Distinct RT from Keluarga
    const distinctRt = await prisma.keluarga.findMany({
      where: {
        rtId: { not: null },
        deletedAt: null,
      },
      select: {
        rtId: true,
        rwId: true,
        gubugId: true,
      },
      distinct: ['rtId', 'rwId', 'gubugId'],
    });

    // Distinct RW from Keluarga
    const distinctRw = await prisma.keluarga.findMany({
      where: {
        rwId: { not: null },
        deletedAt: null,
      },
      select: {
        rwId: true,
        gubugId: true,
      },
      distinct: ['rwId', 'gubugId'],
    });

    // Count surat masuk
    const totalSuratMasuk = await prisma.suratMasuk.count();

    // Count surat keluar (PermintaanLayanan approved/completed)
    const totalSuratKeluar = await prisma.permintaanLayanan.count({
      where: { 
        status: { in: ['COMPLETED', 'APPROVED'] },
      },
    });

    const data = {
      surat: {
        masuk: totalSuratMasuk,
        keluar: totalSuratKeluar,
      },
      penduduk: {
        total: totalPenduduk,
        lakiLaki: totalLakiLaki,
        perempuan: totalPerempuan,
      },
      keluarga: totalKeluarga,
      wilayah: {
        gubugId: distinctDusun.length,
        rt: distinctRt.length,
        rw: distinctRw.length,
      }
    };

    return response.success(res, data, 'Statistik Desa');
  })
);

export default router;
