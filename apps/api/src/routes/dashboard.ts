import { Router, Request, Response } from 'express';
import { asyncHandler, response } from '../utils/response.js';
import { authenticateInternal } from '../middleware/index.js';
import { prisma } from '../services/prisma.js';


const router = Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Authenticated)
 */
router.get(
  '/stats',
  authenticateInternal(),
  asyncHandler(async (_req: Request, res: Response) => {
    // Fetch all stats in parallel
    const [
      requestsNew,
      requestsProcessing,
      requestsPendingApproval,
      requestsCompleted,
      documentsTotal,
      documentsSigned,
      beritaPublished,
      beritaDraft,
      halamanPublished,
      mediaTotal,
      umkmTotal,
      agendaTotal,
      completedRequestsSLA,
    ] = await Promise.all([
      // Request stats
      prisma.permintaanLayanan.count({
        where: { status: 'SUBMITTED', deletedAt: null },
      }),
      prisma.permintaanLayanan.count({
        where: { status: 'PROCESSING', deletedAt: null },
      }),
      prisma.permintaanLayanan.count({
        where: { status: 'VERIFICATION', deletedAt: null },
      }),
      prisma.permintaanLayanan.count({
        where: { status: 'COMPLETED', deletedAt: null },
      }),
      // Document stats
      prisma.instanDokumen.count({
        where: { templateVersion: { template: { dokumen: { layanan: { } } } } },
      }),
      prisma.instanDokumen.count({
        where: { status: 'SIGNED', templateVersion: { template: { dokumen: { layanan: { } } } } },
      }),
      // Content stats
      prisma.berita.count({ where: { penulis: { perangkatDesa: { } }, status: 'PUBLISHED' } }),
      prisma.berita.count({ where: { penulis: { perangkatDesa: { } }, status: 'DRAFT' } }),
      prisma.halaman.count({ where: { status: 'PUBLISHED' } }),
      prisma.media.count({ where: { uploadedBy: { perangkatDesa: { } } } }),
      // UMKM stats — uses isAktif boolean (no status enum)
      prisma.umkm.count({ where: { isAktif: true } }),
      // Agenda stats — active = MENDATANG or BERLANGSUNG
      prisma.agenda.count({ where: { isAktif: true, status: { in: ['MENDATANG', 'BERLANGSUNG'] } } }),
      // SLA Stats (Recent completed requests)
      prisma.permintaanLayanan.findMany({
        where: { status: 'COMPLETED', completedAt: { not: null }, submittedAt: { not: null } },
        select: { submittedAt: true, completedAt: true },
        take: 100,
        orderBy: { completedAt: 'desc' }
      }),
    ]);

    // Calculate Average SLA (in hours)
    let averageSlaHours = 0;
    if (completedRequestsSLA.length > 0) {
      const totalHours = completedRequestsSLA.reduce((acc, req) => {
        if (!req.submittedAt || !req.completedAt) return acc;
        const diffMs = req.completedAt.getTime() - req.submittedAt.getTime();
        return acc + (diffMs / (1000 * 60 * 60));
      }, 0);
      averageSlaHours = Math.round((totalHours / completedRequestsSLA.length) * 10) / 10;
    }

    return response.success(res, {
      requests: {
        new: requestsNew,
        processing: requestsProcessing,
        pendingApproval: requestsPendingApproval,
        completed: requestsCompleted,
      },
      documents: {
        total: documentsTotal,
        signed: documentsSigned,
      },
      content: {
        beritaPublished,
        beritaDraft,
        halamanPublished,
        mediaTotal,
        umkmTotal,
        agendaTotal,
      },
      sla: {
        averageSlaHours,
        totalSampled: completedRequestsSLA.length,
      }
    });
  })
);

/**
 * @route   GET /api/dashboard/recent-activity
 * @desc    Get recent activity for dashboard
 * @access  Private (Authenticated)
 */
router.get(
  '/recent-activity',
  authenticateInternal(),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(String(req.query.limit || '10')), 50);

    // Fetch recent requests
    const recentRequests = await prisma.permintaanLayanan.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        layanan: { select: { nama: true, kode: true } },
        creator: { select: { username: true } },
      },
    });

    return response.success(res, recentRequests);
  })
);

/**
 * @route   GET /api/dashboard/executive
 * @desc    Executive dashboard for Pimpinan (Kepala Desa)
 * @access  Private (PIMPINAN role)
 */
router.get(
  '/executive',
  authenticateInternal(),
  asyncHandler(async (_req: Request, res: Response) => {
    // Fetch all executive data in parallel
    const [
      totalPenduduk,
      suratMenungguTTD,
      suratMasukPending,
      apbdes
    ] = await Promise.all([
      // 1. Total Penduduk
      prisma.penduduk.count({
        where: { }
      }),
      // 2. Surat Menunggu Tanda Tangan
      prisma.instanDokumen.count({
        where: {
          templateVersion: { template: { dokumen: { layanan: { } } } },
          status: 'PENDING_SIGNATURE'
        }
      }),
      // 3. Surat Masuk belum didisposisi (Status NEW atau PENDING)
      prisma.suratMasuk.count({
        where: {
          status: { in: ['DITERIMA', 'DIPROSES'] }
        }
      }),
      // 4. Realisasi APBDes (Total Anggaran vs Realisasi)
      prisma.apbdes.findFirst({
        where: { },
        orderBy: { tahun: 'desc' },
        include: {
          items: true
        }
      })
    ]);

    let realisasiAPBDes = 0;
    let totalAnggaranAPBDes = 0;

    if (apbdes) {
      apbdes.items.forEach(item => {
        if (item.kategori === 'BELANJA') {
          totalAnggaranAPBDes += Number(item.anggaran || 0);
          realisasiAPBDes += Number(item.realization || 0);
        }
      });
    }

    return response.success(res, {
      totalPenduduk,
      suratMenungguTTD,
      suratMasukPending,
      apbdes: {
        tahun: apbdes?.tahun || new Date().getFullYear(),
        totalAnggaran: totalAnggaranAPBDes,
        realisasi: realisasiAPBDes,
        persentaseRealisasi: totalAnggaranAPBDes > 0 
          ? (realisasiAPBDes / totalAnggaranAPBDes) * 100 
          : 0
      }
    }, 'Data Dashboard Executive berhasil diambil');
  })
);

export default router;
