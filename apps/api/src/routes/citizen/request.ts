/**
 * Citizen Service Request Routes
 *
 * Public endpoints for citizens to submit and track service requests.
 * Uses simplified authentication (OTP or tracking number).
 */

import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { prisma } from '../../services/prisma.js';
import { citizenRequestRateLimiter, authenticateCitizen } from '../../middleware/index.js';


const router = Router();

import { permintaanLayananService } from '../../services/permintaan-layanan.service.js';

/**
 * POST /api/citizen/request
 * Submit a new service request (public endpoint)
 * Rate limited to prevent spam
 */
router.post(
  '/request',
  citizenRequestRateLimiter,
  asyncHandler(async (req, res) => {
    const { layananId, fields, catatan } = req.body;

    // Validate required fields
    if (!layananId) {
      throw ApiError.badRequest('ID Layanan wajib diisi');
    }

    if (!fields || typeof fields !== 'object') {
      throw ApiError.badRequest('Data formulir wajib diisi');
    }

    const layananIdBig = BigInt(layananId);

    // Call service to validate (Zod) and create request
    let request: any;
    try {
      request = await permintaanLayananService.createPublic(layananIdBig, fields, catatan);
    } catch (error: any) {
      // Forward Zod validation errors safely
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.badRequest(error.message || 'Gagal membuat permintaan layanan');
    }

    // Look up resident if NIK is in fields or from citizen session token
    let pendudukId: bigint | null = null;
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const citizenToken = authHeader.substring(7);
      const session = await prisma.citizenSession.findUnique({
        where: { token: citizenToken },
        select: { pendudukId: true },
      });
      if (session) {
        pendudukId = session.pendudukId;
      }
    }

    if (!pendudukId) {
      // Attempt to find NIK from fields payload
      const nikVal = Object.values(fields).find(v => typeof v === 'string' && /^\d{16}$/.test(v)) as string | undefined;
      if (nikVal) {
        const resident = await prisma.penduduk.findFirst({
          where: { nik: nikVal }
        });
        if (resident) {
          pendudukId = resident.id;
        }
      }
    }

    // Link pendudukId and trigger notification if we found a matching citizen
    if (pendudukId) {
      request = await prisma.permintaanLayanan.update({
        where: { id: request.id },
        data: { pendudukId },
        include: {
          layanan: { select: { nama: true, kode: true } },
          penduduk: true,
        },
      });

      // Notify resident on submission if phone available
      if (request.penduduk?.telepon) {
        const { notificationService } = await import('../../services/notification.service.js');
        notificationService.notifyRequestStatusChanged(
          request.penduduk.telepon,
          request.nomorPermintaan,
          request.layanan.nama,
          request.status,
          'Permohonan surat berhasil diajukan dan sedang menunggu verifikasi operator.'
        ).catch(err => console.error('Failed to send submission WA notification:', err));
      }
    }

    return response.created(res, {
      nomorPermintaan: request.nomorPermintaan,
      status: request.status,
      message: 'Permintaan berhasil diajukan. Gunakan nomor permintaan untuk melacak status.',
    }, 'Permintaan berhasil diajukan');
  })
);

/**
 * GET /api/citizen/request/:nomor
 * Track a service request by nomor permintaan (public)
 */
router.get(
  '/request/:nomor',
  asyncHandler(async (req, res) => {
    const { nomor } = req.params;

    const request = await permintaanLayananService.findByNomorPublic(decodeURIComponent(nomor));

    if (!request) {
      throw ApiError.notFound('Permintaan tidak ditemukan');
    }

    return response.success(res, request, 'Detail Permintaan');
  })
);

/**
 * POST /api/citizen/validate-nik
 * Validates a NIK against the database and returns masked identity if active.
 */
router.post(
  '/validate-nik',
  citizenRequestRateLimiter,
  asyncHandler(async (req, res) => {
    const { nik } = req.body;

    if (!nik || typeof nik !== 'string' || !/^\d{16}$/.test(nik)) {
      throw ApiError.badRequest('NIK harus 16 digit angka');
    }
    const penduduk = await prisma.penduduk.findFirst({
      where: { nik },
      select: {
        namaLengkap: true,
        isAktif: true
      },
    });

    if (!penduduk) {
      // Don't expose whether they exist but are inactive vs don't exist
      throw ApiError.notFound('NIK tidak terdaftar sebagai penduduk aktif.');
    }

    if (!penduduk.isAktif) {
      throw ApiError.badRequest('Status penduduk tidak aktif.');
    }

    // Mask the name: Budi Santoso -> B*** S******
    const maskName = (name: string) => {
      return name
        .split(' ')
        .map(word => {
          if (word.length <= 1) return word;
          return word[0] + '*'.repeat(word.length - 1);
        })
        .join(' ');
    };

    return response.success(res, {
      valid: true,
      nama: maskName(penduduk.namaLengkap)
    }, 'NIK valid');
  })
);

/**
 * GET /api/citizen/history
 * Fetch request history for the authenticated citizen
 */
router.get(
  '/history',
  authenticateCitizen(),
  asyncHandler(async (req, res) => {
    const pendudukId = req.user?.pendudukId;
    if (!pendudukId) {
      throw ApiError.unauthorized('Sesi warga tidak valid');
    }
    const requests = await prisma.permintaanLayanan.findMany({
      where: {
        pendudukId: BigInt(pendudukId),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        layanan: {
          select: {
            nama: true,
            kode: true,
          },
        },
      },
    });

    return response.success(
      res,
      requests.map((r) => ({
        id: r.id.toString(),
        nomorPermintaan: r.nomorPermintaan,
        status: r.status,
        layanan: r.layanan,
        catatan: r.catatan,
        createdAt: r.createdAt,
      })),
      'Riwayat Layanan'
    );
  })
);

export default router;
