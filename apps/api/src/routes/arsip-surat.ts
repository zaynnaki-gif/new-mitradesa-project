import { Router } from 'express';
import { prisma } from '../services/prisma.js';
import { authenticateInternal, authorize } from '../middleware/index.js';
import { asyncHandler, response } from '../utils/response.js';

import { SuratMasukStatus, DisposisiStatus, Prisma } from '@prisma/client';
import { 
  GetSuratMasukSchema, 
  CreateSuratMasukSchema, 
  UpdateSuratMasukStatusSchema, 
  CreateDisposisiSchema, 
  UpdateDisposisiStatusSchema, 
  GetSuratKeluarSchema 
} from '../dto/arsip-surat.dto.js';

const router = Router();
router.use(authenticateInternal());

// --- Surat Masuk ---

// List Surat Masuk
router.get('/masuk', authorize('surat.view'), asyncHandler(async (req, res) => {
  const query = GetSuratMasukSchema.parse(req.query);

  const where: Prisma.SuratMasukWhereInput = { };
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { nomorSurat: { contains: query.search, mode: 'insensitive' } },
      { pengirim: { contains: query.search, mode: 'insensitive' } },
      { perihal: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  const page = Math.max(query.page, 1);
  const limit = Math.min(Math.max(query.limit, 1), 100);
  const skip = (page - 1) * limit;

  const [suratMasuk, total] = await Promise.all([
    prisma.suratMasuk.findMany({
      where,
      skip,
      take: limit,
      orderBy: { tanggalDiterima: 'desc' },
      include: {
        disposisi: true
      }
    }),
    prisma.suratMasuk.count({ where })
  ]);

  return response.success(res, {
    data: suratMasuk,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// Create Surat Masuk
router.post('/masuk', authorize('surat.manage'), asyncHandler(async (req, res) => {
  const data = CreateSuratMasukSchema.parse(req.body);

  const suratMasuk = await prisma.suratMasuk.create({
    data: {
      nomorSurat: data.nomorSurat,
      tanggalSurat: new Date(data.tanggalSurat),
      tanggalDiterima: new Date(data.tanggalDiterima),
      pengirim: data.pengirim,
      perihal: data.perihal,
      lampiran: data.lampiran,
      fileScanUrl: data.fileScanUrl,
      status: SuratMasukStatus.DITERIMA
    }
  });

  return res.status(201).json({ success: true, data: suratMasuk, message: 'Surat masuk berhasil ditambahkan' });
}));

// Update Surat Masuk Status (Diarsipkan, etc)
router.patch('/masuk/:id/status', authorize('surat.manage'), asyncHandler(async (req, res) => {
  const data = UpdateSuratMasukStatusSchema.parse(req.body);

  const suratMasuk = await prisma.suratMasuk.findFirst({
    where: { id: BigInt(req.params.id) }
  });

  if (!suratMasuk) {
    return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan' });
  }

  const updated = await prisma.suratMasuk.update({
    where: { id: suratMasuk.id },
    data: { status: data.status }
  });

  return res.json({ success: true, data: updated, message: 'Status surat masuk diperbarui' });
}));

// --- Disposisi ---

// Add Disposisi to Surat Masuk
router.post('/masuk/:id/disposisi', authorize('surat.manage'), asyncHandler(async (req, res) => {
  const data = CreateDisposisiSchema.parse(req.body);

  const suratMasuk = await prisma.suratMasuk.findFirst({
    where: { id: BigInt(req.params.id) }
  });

  if (!suratMasuk) {
    return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan' });
  }

  // Wrap in transaction to ensure consistency
  const disposisi = await prisma.$transaction(async (tx) => {
    const newDisposisi = await tx.disposisi.create({
      data: {
        suratMasukId: suratMasuk.id,
        tujuan: data.tujuan,
        instruksi: data.instruksi,
        tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : null,
        status: DisposisiStatus.PENDING
      }
    });

    if (suratMasuk.status === SuratMasukStatus.DITERIMA) {
      await tx.suratMasuk.update({
        where: { id: suratMasuk.id },
        data: { status: SuratMasukStatus.DIPROSES }
      });
    }
    return newDisposisi;
  });

  return res.status(201).json({ success: true, data: disposisi, message: 'Disposisi berhasil ditambahkan' });
}));

// Update Disposisi Status
router.patch('/disposisi/:id/status', authorize('surat.manage'), asyncHandler(async (req, res) => {
  const data = UpdateDisposisiStatusSchema.parse(req.body);

  const disposisi = await prisma.disposisi.findFirst({
    where: { id: BigInt(req.params.id) },
    include: { suratMasuk: true }
  });

  if (!disposisi) {
    return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan' });
  }

  const updated = await prisma.disposisi.update({
    where: { id: disposisi.id },
    data: { status: data.status }
  });

  return res.json({ success: true, data: updated, message: 'Status disposisi diperbarui' });
}));

// --- Surat Keluar (Generated Documents) ---

router.get('/keluar', authorize('surat.view'), asyncHandler(async (req, res) => {
  const query = GetSuratKeluarSchema.parse(req.query);

  const where: Prisma.InstanDokumenWhereInput = {
    dokumen: {
      layanan: {
      }
    }
  };

  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { nomorDokumen: { contains: query.search, mode: 'insensitive' } },
      { judul: { contains: query.search, mode: 'insensitive' } },
      { tujuan: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  const page = Math.max(query.page, 1);
  const limit = Math.min(Math.max(query.limit, 1), 100);
  const skip = (page - 1) * limit;

  const [suratKeluar, total] = await Promise.all([
    prisma.instanDokumen.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        dokumen: {
          select: { kode: true, nama: true }
        }
      }
    }),
    prisma.instanDokumen.count({ where })
  ]);

  return response.success(res, {
    data: suratKeluar,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// TTE Sign Dokumen
router.post('/keluar/:id/sign', authorize('surat.manage'), asyncHandler(async (req, res) => {
  const documentId = BigInt(req.params.id);

  const doc = await prisma.instanDokumen.findUnique({
    where: { id: documentId }
  });

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
  }

  if (doc.status === 'SIGNED' || doc.status === 'VERIFIED') {
    return res.status(400).json({ success: false, message: 'Dokumen sudah ditandatangani' });
  }

  const updated = await prisma.instanDokumen.update({
    where: { id: documentId },
    data: { status: 'SIGNED' }
  });

  return res.json({ success: true, data: updated, message: 'Dokumen berhasil ditandatangani (TTE)' });
}));

export default router;
