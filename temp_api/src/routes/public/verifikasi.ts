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
                account: {
                  select: {
                    perangkatDesa: {
                      select: {
                        fotoUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw ApiError.notFound('Dokumen tidak ditemukan atau token tidak valid');
    }

    // Prepare safe response (omit sensitive full json, just return identity)
    // Extract NIK and Nama if available
    // Extract pemohon identity from permintaan or directly from dataSnapshot
    let pemohon: { nama?: string; nik?: string } = {};
    const rawData = (document.permintaan?.dataJson || document.dataSnapshot) as Record<string, unknown> | null;
    if (rawData && typeof rawData === 'object') {
      const nikRaw = Object.values(rawData).find(v => typeof v === 'string' && /^\d{16}$/.test(v)) as string;
      if (nikRaw) {
        pemohon.nik = `${nikRaw.substring(0, 4)}********${nikRaw.substring(12)}`;
      }
      
      const nameKey = Object.keys(rawData).find(k => k.toLowerCase().includes('nama'));
      if (nameKey) {
        const nameRaw = rawData[nameKey];
        if (typeof nameRaw === 'string') {
          pemohon.nama = nameRaw.split(' ').map(w => w.length > 1 ? w[0] + '*'.repeat(w.length - 1) : w).join(' ');
        }
      }
    }

    let downloadUrl: string | null = document.fileUrl;
    if (document.status === 'REVOKED') {
      downloadUrl = null;
    } else if (document.fileUrl && document.fileUrl.includes('/uploads/')) {
      const { generateDocumentAccessToken } = await import('../../utils/doc-token.js');
      const docPath = document.fileUrl.split('/uploads/')[1];
      if (docPath) {
        const docToken = generateDocumentAccessToken(docPath, 15, 'download');
        const sep = document.fileUrl.includes('?') ? '&' : '?';
        downloadUrl = `${document.fileUrl}${sep}doc_token=${docToken}`;
      }
    }

    const rawFoto = document.signature?.penandatangan?.account?.perangkatDesa?.fotoUrl || null;
    let signatoryFotoUrl = rawFoto;
    if (rawFoto && !rawFoto.startsWith('http://') && !rawFoto.startsWith('https://')) {
      const { config } = await import('../../config/index.js');
      const apiBase = config.apiUrl || 'http://localhost:3001';
      signatoryFotoUrl = `${apiBase.replace(/\/$/, '')}${rawFoto.startsWith('/') ? '' : '/'}${rawFoto}`;
    }

    return response.success(res, {
      nomorDokumen: document.nomorDokumen,
      tanggal: (document.signedAt || document.createdAt).toISOString(),
      jenisSurat: document.dokumen.nama,
      layanan: document.dokumen.layanan?.nama,
      status: document.status,
      pemohon,
      penandatangan: document.signature?.penandatangan ? {
        nama: document.signature.penandatangan.nama,
        jabatan: document.signature.penandatangan.jabatan,
        nip: document.signature.penandatangan.nip,
        fotoUrl: signatoryFotoUrl,
      } : null,
      fileUrl: downloadUrl
    }, 'Dokumen valid');
  })
);

export default router;
