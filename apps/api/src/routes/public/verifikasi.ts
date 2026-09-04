import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { prisma } from '../../services/prisma.js';

const router = Router();

/**
 * @route   GET /api/public/verifikasi/:token
 * @desc    Get public document verification details
 * @access  Public
 */
router.get(
  '/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const document = await prisma.instanDokumen.findFirst({
      where: { verificationToken: token },
      include: {
        dokumen: {
          select: {
            nama: true,
            kode: true,
            deskripsi: true,
            layanan: { select: { nama: true } }
          }
        },
        permintaan: {
          select: {
            dataJson: true,
            nomorPermintaan: true,
            submittedAt: true,
          }
        },
        signature: {
          include: {
            penandatangan: {
              select: {
                nama: true,
                jabatan: true,
                nip: true,
              }
            }
          }
        }
      }
    });

    if (!document) {
      throw ApiError.notFound('Dokumen tidak ditemukan atau token tidak valid');
    }

    // Prepare safe response (omit sensitive full json, just return identity)
    // Extract NIK and Nama if available
    let pemohon: { nama?: string; nik?: string } = {};
    if (document.permintaan?.dataJson) {
      const data = document.permintaan.dataJson as Record<string, unknown>;
      // Mask NIK
      const nikRaw = Object.values(data).find(v => typeof v === 'string' && /^\d{16}$/.test(v)) as string;
      if (nikRaw) {
        pemohon.nik = `${nikRaw.substring(0, 4)}********${nikRaw.substring(12)}`;
      }
      
      // Look for Nama field
      const nameKey = Object.keys(data).find(k => k.toLowerCase().includes('nama'));
      if (nameKey) {
        const nameRaw = data[nameKey];
        if (typeof nameRaw === 'string') {
           pemohon.nama = nameRaw.split(' ').map(w => w.length > 1 ? w[0] + '*'.repeat(w.length - 1) : w).join(' ');
        }
      }
    }

    return response.success(res, {
      nomorDokumen: document.nomorDokumen,
      tanggal: document.createdAt,
      jenisSurat: document.dokumen.nama,
      layanan: document.dokumen.layanan?.nama,
      status: document.status,
      pemohon,
      penandatangan: document.signature?.penandatangan ? {
        nama: document.signature.penandatangan.nama,
        jabatan: document.signature.penandatangan.jabatan,
        nip: document.signature.penandatangan.nip,
      } : null,
      fileUrl: document.fileUrl
    }, 'Dokumen valid');
  })
);

export default router;
