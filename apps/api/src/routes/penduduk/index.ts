import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { offlineAccessRateLimiter } from '../../middleware/rate-limiter.middleware.js';
import { pendudukService } from '../../services/penduduk.service.js';
import {
  createPendudukSchema,
  updatePendudukSchema,
  queryPendudukSchema,
  idParamSchema,
} from '../../dto/penduduk.dto.js';

const router = Router();

/**
 * Validation schemas
 */
const createSchema = createPendudukSchema;
const updateSchema = updatePendudukSchema;
const querySchema = queryPendudukSchema;
const idSchema = idParamSchema;

/**
 * @route   GET /api/penduduk
 * @desc    Get all penduduks with pagination
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await pendudukService.findAll(query, {
      maskNik: false, // Admin gets full NIK
      maskContact: false,
    });
    return response.success(res, result.data, 'Penduduk list retrieved', result.meta);
  })
);

/**
 * @route   GET /api/penduduk/stats
 * @desc    Get penduduk statistics
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (_req, res) => {
    const stats = await pendudukService.getStats();
    return response.success(res, stats, 'Statistics retrieved');
  })
);

/**
 * @route   GET /api/penduduk/:id
 * @desc    Get penduduk by ID
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const penduduk = await pendudukService.findById(id, {
      maskNik: false,
      maskContact: false,
    });
    return response.success(res, penduduk, 'Penduduk retrieved');
  })
);

/**
 * @route   GET /api/penduduk/nik/:nik
 * @desc    Get penduduk by NIK
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/nik/:nik',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (req, res) => {
    const nik = req.params.nik;

    // Validate NIK format
    if (!/^\d{16}$/.test(nik)) {
      throw ApiError.badRequest('NIK must be exactly 16 digits');
    }

    const penduduk = await pendudukService.findByNik(nik, {
      maskNik: false,
      maskContact: false,
    });
    return response.success(res, penduduk, 'Penduduk retrieved');
  })
);

/**
 * @route   POST /api/penduduk
 * @desc    Create new penduduk
 * @access  Private (Admin with penduduk.create)
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('penduduk.create'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const actorId = req.user?.accountId;
    const penduduk = await pendudukService.create(data, actorId, req.ip, req.headers['user-agent']);
    return response.created(res, penduduk, 'Penduduk created successfully');
  })
);

/**
 * @route   PATCH /api/penduduk/:id
 * @desc    Update penduduk
 * @access  Private (Admin with penduduk.update)
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('penduduk.update'),
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const data = updateSchema.parse(req.body);
    const actorId = req.user?.accountId;
    const penduduk = await pendudukService.update(id, data, actorId, req.ip, req.headers['user-agent']);
    return response.success(res, penduduk, 'Penduduk updated successfully');
  })
);

/**
 * @route   DELETE /api/penduduk/:id
 * @desc    Soft delete penduduk
 * @access  Private (Admin with penduduk.delete)
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('penduduk.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const actorId = req.user?.accountId;
    await pendudukService.softDelete(id, actorId, req.ip, req.headers['user-agent']);
    return response.success(res, null, 'Penduduk deactivated successfully');
  })
);

/**
 * Validation schema for in-person physical KTP verification
 */
const offlineVerificationSchema = z.object({
  namaPetugas: z.string().min(3, 'Nama petugas verifikator wajib diisi'),
  nomorIdentitasFisik: z.string().min(16, 'Nomor KTP/KK fisik wajib 16 digit'),
  alasanVerifikasi: z.string().min(10, 'Alasan verifikasi fisik wajib diisi minimal 10 karakter (misal: Warga lansia tanpa smartphone/WA)'),
  dokumenFisikDiperiksa: z.literal(true, {
    errorMap: () => ({ message: 'Petugas wajib mencentang konfirmasi bahwa KTP fisik asli telah diperiksa langsung' }),
  }),
  verifikasiFisikDiLoket: z.literal(true, {
    errorMap: () => ({ message: 'Petugas wajib mengonfirmasi warga hadir langsung di loket pelayanan kantor desa' }),
  }),
});

/**
 * @route   POST /api/penduduk/:id/offline-access
 * @desc    Generate a temporary authenticated citizen access link after in-person physical KTP verification
 * @access  Private (Staff with penduduk.update)
 */
router.post(
  '/:id/offline-access',
  authenticateInternal(),
  authorize('penduduk.update'),
  offlineAccessRateLimiter,
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const body = offlineVerificationSchema.parse(req.body);

    const actorId = req.user?.accountId;
    const penduduk = await pendudukService.findById(id);
    if (!penduduk || !penduduk.isAktif) {
      throw ApiError.notFound('Penduduk tidak ditemukan atau tidak aktif');
    }

    // Verify physical identity card matches target resident NIK
    if (body.nomorIdentitasFisik !== penduduk.nik) {
      throw ApiError.badRequest('Nomor identitas fisik yang diperiksa tidak cocok dengan NIK data kependudukan');
    }

    const crypto = await import('crypto');
    const sessionToken = 'offline_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours temporary session

    const prisma = (await import('../../services/prisma.js')).prisma;
    await prisma.$transaction(async (tx) => {
      await tx.citizenSession.create({
        data: {
          pendudukId: BigInt(id),
          token: sessionToken,
          expiresAt,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'citizen_session',
          entityId: BigInt(id),
          action: 'CREATE',
          actorId,
          actorType: 'USER',
          reason: body.alasanVerifikasi,
          metadata: {
            channel: 'OFFLINE_VERIFICATION',
            namaPetugas: body.namaPetugas,
            nomorIdentitasFisik: body.nomorIdentitasFisik,
            alasan: body.alasanVerifikasi,
            wargaNik: penduduk.nik,
            wargaNama: penduduk.namaLengkap,
            ipPetugas: req.ip,
            verifiedAt: new Date().toISOString(),
          },
        },
      });
    });

    return response.created(
      res,
      {
        token: sessionToken,
        tokenType: 'Bearer',
        expiresAt: expiresAt.toISOString(),
        expiresInHours: 8,
        namaLengkap: penduduk.namaLengkap,
        nik: penduduk.nik,
      },
      'Akses sementara warga berhasil diterbitkan via verifikasi fisik kantor desa'
    );
  })
);

/**
 * @route   GET /api/penduduk/offline-access/audit
 * @desc    Audit trail of all offline access sessions issued by staff
 * @access  Private (Admin with penduduk.view)
 */
router.get(
  '/offline-access/audit',
  authenticateInternal(),
  authorize('penduduk.view'),
  asyncHandler(async (req, res) => {
    const prisma = (await import('../../services/prisma.js')).prisma;
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: 'citizen_session',
        action: 'CREATE',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return response.success(res, logs, 'Riwayat penerbitan akses offline warga berhasil dimuat');
  })
);

/**
 * @route   POST /api/penduduk/offline-access/:token/revoke
 * @desc    Emergency revoke of an issued offline citizen session
 * @access  Private (Staff with penduduk.update)
 */
router.post(
  '/offline-access/:token/revoke',
  authenticateInternal(),
  authorize('penduduk.update'),
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const prisma = (await import('../../services/prisma.js')).prisma;

    const session = await prisma.citizenSession.findUnique({
      where: { token },
    });

    if (!session) {
      throw ApiError.notFound('Sesi akses offline tidak ditemukan');
    }

    await prisma.citizenSession.delete({
      where: { token },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'citizen_session',
        entityId: session.pendudukId,
        action: 'DELETE',
        actorId: req.user?.accountId,
        actorType: 'USER',
        reason: 'Pencabutan darurat sesi offline oleh petugas',
        metadata: { tokenRevoked: token, revokedAt: new Date().toISOString() },
      },
    });

    return response.success(res, null, 'Sesi akses offline warga berhasil dicabut');
  })
);

export default router;
