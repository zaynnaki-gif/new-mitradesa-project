import { Router } from 'express';
import { prisma } from '../services/prisma.js';
import { authenticateInternal } from '../middleware/auth.middleware.js';
import { response } from '../utils/response.js';
import { getInstanceContext } from '../config/instance.js';

const router = Router();
router.use(authenticateInternal());

// --- Surat Masuk ---

// List Surat Masuk
router.get('/masuk', async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const { status, search } = req.query;

    const where: any = { desaId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nomorSurat: { contains: search as string, mode: 'insensitive' } },
        { pengirim: { contains: search as string, mode: 'insensitive' } },
        { perihal: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
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
    console.error('List SuratMasuk Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// Create Surat Masuk
router.post('/masuk', async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const { nomorSurat, tanggalSurat, tanggalDiterima, pengirim, perihal, lampiran, fileScanUrl } = req.body;

    const suratMasuk = await prisma.suratMasuk.create({
      data: {
        desaId,
        nomorSurat,
        tanggalSurat: new Date(tanggalSurat),
        tanggalDiterima: new Date(tanggalDiterima),
        pengirim,
        perihal,
        lampiran,
        fileScanUrl,
        status: 'DITERIMA'
      }
    });

    return res.status(201).json({ success: true, data: suratMasuk, message: 'Surat masuk berhasil ditambahkan' });
  } catch (error) {
    console.error('Create SuratMasuk Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// Update Surat Masuk Status (Diarsipkan, etc)
router.patch('/masuk/:id/status', async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const { status } = req.body;

    const suratMasuk = await prisma.suratMasuk.findFirst({
      where: { id: BigInt(req.params.id), desaId }
    });

    if (!suratMasuk) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan' });
    }

    const updated = await prisma.suratMasuk.update({
      where: { id: suratMasuk.id },
      data: { status }
    });

    return res.json({ success: true, data: updated, message: 'Status surat masuk diperbarui' });
  } catch (error) {
    console.error('Update SuratMasuk Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// --- Disposisi ---

// Add Disposisi to Surat Masuk
router.post('/masuk/:id/disposisi', async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const { tujuan, instruksi, tanggalSelesai } = req.body;

    const suratMasuk = await prisma.suratMasuk.findFirst({
      where: { id: BigInt(req.params.id), desaId }
    });

    if (!suratMasuk) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan' });
    }

    const disposisi = await prisma.disposisi.create({
      data: {
        suratMasukId: suratMasuk.id,
        tujuan,
        instruksi,
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
        status: 'PENDING'
      }
    });

    // Update status Surat Masuk if necessary
    await prisma.suratMasuk.update({
      where: { id: suratMasuk.id },
      data: { status: 'DIPROSES' }
    });

    return res.status(201).json({ success: true, data: disposisi, message: 'Disposisi berhasil ditambahkan' });
  } catch (error) {
    console.error('Add Disposisi Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// Update Disposisi Status
router.patch('/disposisi/:id/status', async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const { status } = req.body;

    const disposisi = await prisma.disposisi.findFirst({
      where: { id: BigInt(req.params.id) },
      include: { suratMasuk: true }
    });

    if (!disposisi || disposisi.suratMasuk.desaId !== desaId) {
      return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan' });
    }

    const updated = await prisma.disposisi.update({
      where: { id: disposisi.id },
      data: { status }
    });

    return res.json({ success: true, data: updated, message: 'Status disposisi diperbarui' });
  } catch (error) {
    console.error('Update Disposisi Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

// --- Surat Keluar (Generated Documents) ---

router.get('/keluar', async (req, res) => {
  try {
    const { desaId } = getInstanceContext();
    const { search, status } = req.query;

    const where: any = {
      dokumen: {
        layanan: {
          desaId
        }
      }
    };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nomorDokumen: { contains: search as string, mode: 'insensitive' } },
        { judul: { contains: search as string, mode: 'insensitive' } },
        { tujuan: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
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
    console.error('List SuratKeluar Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
  }
});

export default router;
