import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma.js';
import { Prisma } from '@prisma/client';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { getInstanceContext } from '../../config/instance.js';

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
  // Additional fields for linking to Keluarga and full profile upon LAHIR/PINDAH_DATANG
  noKk: z.string().regex(/^\d{16}$/).optional(),
  keluargaId: z.coerce.string().optional(),
  hubunganKeluarga: z.string().max(50).optional(),
  agama: z.string().max(50).optional(),
  pekerjaan: z.string().max(100).optional(),
  statusPerkawinan: z.string().max(50).optional(),
  alamat: z.string().optional(),
  rtId: z.coerce.string().optional(),
  rwId: z.coerce.string().optional(),
  gubugId: z.coerce.string().optional(),
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

router.get('/', authorize('penduduk.view'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { page, limit, search, jenisMutasi, tahun, tanggalMulai, tanggalSelesai } = querySchema.parse(req.query);

  const skip = (page - 1) * limit;
  const where: Prisma.MutasiPendudukWhereInput = { desaId };

  if (desaId !== undefined) where.desaId = desaId;
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
    data: data.map((k: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...k,
      tanggalMutasi: k.tanggalMutasi?.toISOString(),
      tanggalLahir: k.tanggalLahir?.toISOString(),
      createdAt: k.createdAt?.toISOString(),
      updatedAt: k.updatedAt?.toISOString(),
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

// ============================================
// Statistics
// ============================================

router.get('/stats', authorize('penduduk.view'), asyncHandler(async (_req, res) => {
  const { desaId } = getInstanceContext();
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01`);
  const endOfYear = new Date(`${currentYear}-12-31`);

  const whereBase: Prisma.MutasiPendudukWhereInput = {
    desaId,
    tanggalMutasi: { gte: startOfYear, lte: endOfYear },
  };

  const [lahir, mati, pindahDatang, pindahPergi] = await Promise.all([
    prisma.mutasiPenduduk.count({
      where: {
        ...whereBase,
        jenisMutasi: 'LAHIR',
      },
    }),
    prisma.mutasiPenduduk.count({
      where: {
        ...whereBase,
        jenisMutasi: 'MATI',
      },
    }),
    prisma.mutasiPenduduk.count({
      where: {
        ...whereBase,
        jenisMutasi: 'PINDAH_DATANG',
      },
    }),
    prisma.mutasiPenduduk.count({
      where: {
        ...whereBase,
        jenisMutasi: 'PINDAH_PERGI',
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
}));

// ============================================
// Create
// ============================================

router.post('/', authorize('penduduk.create'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const data = createSchema.parse(req.body);

  const created = await prisma.$transaction(async (tx) => {
    const mutasi = await tx.mutasiPenduduk.create({
      data: {
        desaId,
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

    if (data.jenisMutasi === 'MATI' || data.jenisMutasi === 'PINDAH_PERGI') {
      const penduduk = await tx.penduduk.findFirst({
        where: {
          nik: data.nik,
          desaId,
        },
      });
      if (penduduk) {
        await tx.penduduk.update({
          where: { id: penduduk.id },
          data: {
            isAktif: false,
            statusKepindahan: data.jenisMutasi,
          }
        });
      }
    } else if (data.jenisMutasi === 'LAHIR' || data.jenisMutasi === 'PINDAH_DATANG') {
      // Target Keluarga if provided via keluargaId or noKk
      let targetKeluarga = null;
      if (data.keluargaId) {
        targetKeluarga = await tx.keluarga.findFirst({
          where: { id: BigInt(data.keluargaId), desaId },
        });
      } else if (data.noKk) {
        targetKeluarga = await tx.keluarga.findFirst({
          where: { noKk: data.noKk, desaId },
        });
      } else if (data.nikAyah || data.nikIbu) {
        // Fallback: look up parent family KK
        const parent = await tx.penduduk.findFirst({
          where: {
            nik: { in: [data.nikAyah, data.nikIbu].filter(Boolean) as string[] },
            desaId,
          },
          include: { anggotaKeluarga: { include: { keluarga: true } } },
        });
        if (parent?.anggotaKeluarga?.[0]?.keluarga) {
          targetKeluarga = parent.anggotaKeluarga[0].keluarga;
        }
      }

      // Administrative Rule: Bayi lahir WAJIB dikaitkan ke Kartu Keluarga orang tua/keluarga tujuan
      if (data.jenisMutasi === 'LAHIR' && !targetKeluarga) {
        throw ApiError.badRequest(
          'Mutasi LAHIR wajib menyertakan keluarga tujuan (noKk, keluargaId, atau NIK orang tua yang terdaftar dalam KK) agar bayi tidak tercatat sebagai kepala keluarga mandiri.'
        );
      }

      // Find or create Penduduk record for LAHIR / PINDAH_DATANG
      let penduduk = await tx.penduduk.findFirst({
        where: {
          nik: data.nik,
          desaId,
        },
      });

      const birthDate = data.tanggalLahir ? new Date(data.tanggalLahir) : new Date(data.tanggalMutasi);
      const gender = data.jenisKelamin || 'L';
      const birthplace = data.tempatLahir || (targetKeluarga?.alamat || 'Desa');
      const defaultStatusKawin = data.statusPerkawinan || (data.jenisMutasi === 'LAHIR' ? 'BELUM KAWIN' : 'BELUM KAWIN');
      const defaultHubungan = data.hubunganKeluarga || (data.jenisMutasi === 'LAHIR' ? 'ANAK' : 'FAMILI LAIN');

      if (!penduduk) {
        penduduk = await tx.penduduk.create({
          data: {
            desaId,
            nik: data.nik,
            namaLengkap: data.namaLengkap,
            tempatLahir: birthplace,
            tanggalLahir: birthDate,
            jenisKelamin: gender,
            agama: data.agama || 'Islam',
            pekerjaan: data.pekerjaan || (data.jenisMutasi === 'LAHIR' ? 'Belum Bekerja' : '-'),
            statusPerkawinan: defaultStatusKawin,
            hubunganKeluarga: defaultHubungan,
            alamat: data.alamat || targetKeluarga?.alamat || data.alamatTujuan || data.desaTujuan || null,
            nikAyah: data.nikAyah || null,
            nikIbu: data.nikIbu || null,
            gubugId: data.gubugId ? BigInt(data.gubugId) : targetKeluarga?.gubugId || null,
            rwId: data.rwId ? BigInt(data.rwId) : targetKeluarga?.rwId || null,
            rtId: data.rtId ? BigInt(data.rtId) : targetKeluarga?.rtId || null,
            isAktif: true,
            statusKepindahan: data.jenisMutasi,
          },
        });
      } else {
        // Reactivate if previously inactive
        penduduk = await tx.penduduk.update({
          where: { id: penduduk.id },
          data: {
            namaLengkap: data.namaLengkap,
            tempatLahir: birthplace,
            tanggalLahir: birthDate,
            jenisKelamin: gender,
            isAktif: true,
            statusKepindahan: data.jenisMutasi,
            nikAyah: data.nikAyah || penduduk.nikAyah,
            nikIbu: data.nikIbu || penduduk.nikIbu,
          },
        });
      }

      // Link to Keluarga if a target Keluarga is found
      if (targetKeluarga && penduduk) {
        const existingAnggota = await tx.anggotaKeluarga.findUnique({
          where: {
            keluargaId_pendudukId: {
              keluargaId: targetKeluarga.id,
              pendudukId: penduduk.id,
            },
          },
        });

        if (!existingAnggota) {
          await tx.anggotaKeluarga.create({
            data: {
              keluargaId: targetKeluarga.id,
              pendudukId: penduduk.id,
              hubungan: defaultHubungan,
              isAktif: true,
            },
          });
        }
      }
    }

    return mutasi;
  });

  return response.created(res, {
    ...created,
    tanggalMutasi: created.tanggalMutasi?.toISOString(),
    tanggalLahir: created.tanggalLahir?.toISOString(),
    createdAt: created.createdAt?.toISOString(),
    updatedAt: created.updatedAt?.toISOString(),
  }, 'Data mutasi berhasil disimpan');
}));

// ============================================
// Get One
// ============================================

router.get('/:id', authorize('penduduk.view'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;
  const item = await prisma.mutasiPenduduk.findFirst({
    where: {
      id,
      desaId,
    },
  });

  if (!item) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  return response.success(res, {
    ...item,
    tanggalMutasi: item.tanggalMutasi?.toISOString(),
    tanggalLahir: item.tanggalLahir?.toISOString(),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  });
}));

// ============================================
// Update
// ============================================

router.patch('/:id', authorize('penduduk.update'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.mutasiPenduduk.findFirst({
    where: {
      id,
      desaId,
    },
  });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
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
}));

// ============================================
// Delete
// ============================================

router.delete('/:id', authorize('penduduk.delete'), asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  const { id } = req.params;

  const existing = await prisma.mutasiPenduduk.findFirst({
    where: {
      id,
      desaId,
    },
  });
  if (!existing) {
    throw ApiError.notFound('Data tidak ditemukan');
  }

  await prisma.mutasiPenduduk.delete({ where: { id } });
  return response.success(res, null, 'Data mutasi berhasil dihapus');
}));

export default router;
