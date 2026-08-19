/**
 * Citizen Service Request Routes
 *
 * Public endpoints for citizens to submit and track service requests.
 * Uses simplified authentication (OTP or tracking number).
 */

import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { Prisma, RequestStatus } from '@prisma/client';
import { prisma } from '../../services/prisma.js';
import { generateRequestNumber } from '../../utils/numbering.js';
import { citizenRequestRateLimiter } from '../../middleware/index.js';
import { getInstanceContext } from '../../config/instance.js';

const router = Router();

/**
 * Validate field definitions for a service
 */
async function validateRequestFields(
  layananId: bigint,
  fields: Record<string, unknown>
): Promise<{ valid: boolean; errors: Array<{ field: string; message: string }> }> {
  const errors: Array<{ field: string; message: string }> = [];

  // Get field definitions for this service
  const fieldDefinitions = await prisma.fieldDefinition.findMany({
    where: { layananId },
    orderBy: { orderIndex: 'asc' },
  });

  // Build field map for quick lookup
  const fieldMap = new Map<string, typeof fieldDefinitions[0]>();
  for (const field of fieldDefinitions) {
    fieldMap.set(field.key, field);
  }

  // Check for missing required fields
  for (const fieldDef of fieldDefinitions) {
    if (fieldDef.required) {
      const value = fields[fieldDef.key];
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errors.push({
          field: fieldDef.key,
          message: `${fieldDef.label} wajib diisi`,
        });
      }
    }
  }

  // Validate NIK format if present, and check database
  for (const [key, value] of Object.entries(fields)) {
    const fieldDef = fieldMap.get(key);
    if (fieldDef && fieldDef.type === 'NIK' && typeof value === 'string') {
      if (!/^\d{16}$/.test(value)) {
        errors.push({ field: key, message: 'NIK harus 16 digit angka' });
      } else {
        const { desaId } = getInstanceContext();
        const penduduk = await prisma.penduduk.findFirst({
          where: { nik: value, desaId },
          select: { isAktif: true }
        });
        
        if (!penduduk || !penduduk.isAktif) {
          errors.push({ field: key, message: 'NIK tidak valid atau bukan penduduk aktif' });
        }
      }
    }
    if (fieldDef && fieldDef.type === 'EMAIL' && typeof value === 'string' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ field: key, message: 'Format email tidak valid' });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create a public service request
 */
async function createPublicRequest(
  layananId: bigint,
  fields: Record<string, unknown>,
  catatan?: string
) {
  const { desaId } = getInstanceContext();
  // Get layanan info to determine desaId
  const layanan = await prisma.layanan.findFirst({
    where: { id: layananId, desaId },
    select: { id: true, desaId: true, kode: true, nama: true, isActive: true },
  });

  if (!layanan) {
    throw ApiError.notFound('Layanan tidak ditemukan');
  }

  if (!layanan.isActive) {
    throw ApiError.badRequest('Layanan tidak tersedia');
  }

  // Generate request number
  const nomorPermintaan = await generateRequestNumber(
    prisma,
    layanan.desaId,
    layanan.kode
  );

  // Create the request
  const request = await prisma.permintaanLayanan.create({
    data: {
      layananId: layananId,
      desaId: layanan.desaId,
      nomorPermintaan,
      status: RequestStatus.SUBMITTED,
      dataJson: fields as Prisma.InputJsonValue,
      catatan,
      submittedAt: new Date(),
    },
    include: {
      layanan: { select: { nama: true, kode: true } },
    },
  });

  return request;
}

/**
 * Find request by nomor for public tracking
 */
async function findByNomorPublic(nomorPermintaan: string) {
  const { desaId } = getInstanceContext();
  const request = await prisma.permintaanLayanan.findFirst({
    where: { nomorPermintaan, desaId },
    include: {
      layanan: { select: { nama: true, kode: true } },
      dokumen: {
        select: {
          id: true,
          nomorDokumen: true,
          status: true,
          verificationToken: true,
        },
      },
    },
  });

  if (!request) {
    return null;
  }

  return {
    nomorPermintaan: request.nomorPermintaan,
    status: request.status,
    layanan: request.layanan,
    createdAt: request.createdAt,
    submittedAt: request.submittedAt,
    processedAt: request.processedAt,
    completedAt: request.completedAt,
    catatan: request.catatan,
    dokumen: request.dokumen.length > 0 ? request.dokumen : undefined,
  };
}

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

    // Validate against field definitions
    const validation = await validateRequestFields(layananIdBig, fields);

    if (!validation.valid) {
      throw ApiError.validation('Validasi formulir gagal', validation.errors.map(e => e.message));
    }

    // Create the request
    const request = await createPublicRequest(layananIdBig, fields, catatan);

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

    const request = await findByNomorPublic(decodeURIComponent(nomor));

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

    const { desaId } = getInstanceContext();
    const penduduk = await prisma.penduduk.findFirst({
      where: { nik, desaId },
      select: {
        namaLengkap: true,
        isAktif: true,
        desaId: true,
        desa: { select: { nama: true } },
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
      nama: maskName(penduduk.namaLengkap),
      desa: penduduk.desa?.nama || '',
    }, 'NIK valid');
  })
);

export default router;
