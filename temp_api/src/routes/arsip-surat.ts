import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { authenticateInternal, authorize } from '../middleware/index.js';
import { response } from '../utils/response.js';
import { getInstanceContext } from '../config/instance.js';
import { SuratMasukStatus, DisposisiStatus, DocumentStatus, Prisma } from '@prisma/client';

const router = Router();
router.use(authenticateInternal());

// Validation schemas
const GetSuratMasukSchema = z.object({
  status: z.nativeEnum(SuratMasukStatus).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 10),
});

const CreateSuratMasukSchema = z.object({
  nomorSurat: z.string().min(1),
  tanggalSurat: z.string().datetime(),
  tanggalDiterima: z.string().datetime(),
  pengirim: z.string().min(1),
  perihal: z.string().min(1),
  lampiran: z.string().optional().nullable(),
  fileScanUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

const UpdateSuratMasukStatusSchema = z.object({
  status: z.nativeEnum(SuratMasukStatus),
});

const CreateDisposisiSchema = z.object({
  tujuan: z.string().min(1),
  instruksi: z.string().min(1),
  tanggalSelesai: z.string().datetime().optional().nullable(),
});

const UpdateDisposisiStatusSchema = z.object({
  status: z.nativeEnum(DisposisiStatus),
});

const GetSuratKeluarSchema = z.object({
  status: z.nativeEnum(DocumentStatus).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 10),
});

// --- Surat Masuk ---

// List Surat Masuk
router.get('/masuk', authorize('surat.view'), async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const query = GetSuratMasukSchema.parse(req.query);

    const where: Prisma.SuratMasukWhereInput = { desaId };
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Data tidak valid', errors: error.errors });
    }
    console.error('List SuratMasuk Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// Create Surat Masuk
router.post('/masuk', authorize('surat.manage'), async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const data = CreateSuratMasukSchema.parse(req.body);

    const suratMasuk = await prisma.suratMasuk.create({
      data: {
        desaId,
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Data tidak valid', errors: error.errors });
    }
    console.error('Create SuratMasuk Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// Update Surat Masuk Status (Diarsipkan, etc)
router.patch('/masuk/:id/status', authorize('surat.manage'), async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const data = UpdateSuratMasukStatusSchema.parse(req.body);

    const suratMasuk = await prisma.suratMasuk.findFirst({
      where: { id: BigInt(req.params.id), desaId }
    });

    if (!suratMasuk) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan' });
    }

    const updated = await prisma.suratMasuk.update({
      where: { id: suratMasuk.id },
      data: { status: data.status }
    });

    return res.json({ success: true, data: updated, message: 'Status surat masuk diperbarui' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Data tidak valid', errors: error.errors });
    }
    console.error('Update SuratMasuk Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// --- Disposisi ---

// Add Disposisi to Surat Masuk
router.post('/masuk/:id/disposisi', authorize('surat.manage'), async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const data = CreateDisposisiSchema.parse(req.body);

    const suratMasuk = await prisma.suratMasuk.findFirst({
      where: { id: BigInt(req.params.id), desaId }
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Data tidak valid', errors: error.errors });
    }
    console.error('Add Disposisi Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// Update Disposisi Status
router.patch('/disposisi/:id/status', authorize('surat.manage'), async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const data = UpdateDisposisiStatusSchema.parse(req.body);

    const disposisi = await prisma.disposisi.findFirst({
      where: { id: BigInt(req.params.id) },
      include: { suratMasuk: true }
    });

    if (!disposisi || disposisi.suratMasuk.desaId !== desaId) {
      return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan' });
    }

    const updated = await prisma.disposisi.update({
      where: { id: disposisi.id },
      data: { status: data.status }
    });

    return res.json({ success: true, data: updated, message: 'Status disposisi diperbarui' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Data tidak valid', errors: error.errors });
    }
    console.error('Update Disposisi Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// --- Surat Keluar (Generated Documents) ---

router.get('/keluar', authorize('surat.view'), async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const query = GetSuratKeluarSchema.parse(req.query);

    const where: Prisma.InstanDokumenWhereInput = {
      dokumen: {
        layanan: {
          desaId
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Data tidak valid', errors: error.errors });
    }
    console.error('List SuratKeluar Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

export default router;
