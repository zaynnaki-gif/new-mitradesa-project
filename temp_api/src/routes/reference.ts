import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../utils/response.js';
import { authenticateInternal, authorize } from '../middleware/index.js';
import {
  refAgamaService,
  refGolDarahService,
  refStatusPerkawinanService,
  refHubunganKeluargaService,
  refStatusKependudukanService,
  refPendidikanService,
  refPekerjaanService,
  refJabatanPerangkatService,
  refStatusPerangkatService,
} from '../services/index.js';
import { z } from 'zod';

const router = Router();

// ============================================
// SHARED SCHEMAS
// ============================================
const createSchema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  nama: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  isAktif: z.boolean().default(true),
});

const updateSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  isAktif: z.boolean().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isAktif: z.coerce.boolean().optional(),
});

const kodeSchema = z.object({
  kode: z.string().min(1),
});

// ============================================
// AGAMA ROUTES
// ============================================
router.get(
  '/agama',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await refAgamaService.findAll(query);
    return response.success(res, result.data, 'Daftar Agama', result.meta);
  })
);

router.get(
  '/agama/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const agama = await refAgamaService.findByKode(params.kode);
    if (!agama) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: agama.id.toString(),
      kode: agama.kode,
      nama: agama.nama,
      isAktif: agama.isAktif,
      createdAt: agama.createdAt.toISOString(),
      updatedAt: agama.updatedAt.toISOString(),
    }, 'Detail Agama');
  })
);

router.post(
  '/agama',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const result = await refAgamaService.create(
      { kode: data.kode, nama: data.nama, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Agama berhasil dibuat');
  })
);

router.patch(
  '/agama/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = updateSchema.parse(req.body);
    const result = await refAgamaService.update(
      params.kode,
      { nama: body.nama, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Agama berhasil diperbarui');
  })
);

router.delete(
  '/agama/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refAgamaService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Agama berhasil dinonaktifkan');
  })
);

// ============================================
// GOLONGAN DARAH ROUTES
// ============================================
router.get(
  '/gol-darah',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await refGolDarahService.findAll(query);
    return response.success(res, result.data, 'Daftar Golongan Darah', result.meta);
  })
);

router.get(
  '/gol-darah/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const golDarah = await refGolDarahService.findByKode(params.kode);
    if (!golDarah) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: golDarah.id.toString(),
      kode: golDarah.kode,
      nama: golDarah.nama,
      createdAt: golDarah.createdAt.toISOString(),
      updatedAt: golDarah.updatedAt.toISOString(),
    }, 'Detail Golongan Darah');
  })
);

router.post(
  '/gol-darah',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = z.object({
      kode: z.string().min(1).max(5),
      nama: z.string().min(1).max(20),
    }).parse(req.body);
    const result = await refGolDarahService.create(
      { kode: data.kode, nama: data.nama },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Golongan Darah berhasil dibuat');
  })
);

router.patch(
  '/gol-darah/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = z.object({ nama: z.string().min(1).max(20).optional() }).parse(req.body);
    const result = await refGolDarahService.update(
      params.kode,
      { nama: body.nama },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Golongan Darah berhasil diperbarui');
  })
);

router.delete(
  '/gol-darah/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refGolDarahService.delete(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Golongan Darah berhasil dihapus');
  })
);

// ============================================
// STATUS PERKAWINAN ROUTES
// ============================================
router.get(
  '/status-kawin',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await refStatusPerkawinanService.findAll(query);
    return response.success(res, result.data, 'Daftar Status Perkawinan', result.meta);
  })
);

router.get(
  '/status-kawin/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const status = await refStatusPerkawinanService.findByKode(params.kode);
    if (!status) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: status.id.toString(),
      kode: status.kode,
      nama: status.nama,
      isAktif: status.isAktif,
      createdAt: status.createdAt.toISOString(),
      updatedAt: status.updatedAt.toISOString(),
    }, 'Detail Status Perkawinan');
  })
);

router.post(
  '/status-kawin',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const result = await refStatusPerkawinanService.create(
      { kode: data.kode, nama: data.nama, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Status Perkawinan berhasil dibuat');
  })
);

router.patch(
  '/status-kawin/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = updateSchema.parse(req.body);
    const result = await refStatusPerkawinanService.update(
      params.kode,
      { nama: body.nama, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Status Perkawinan berhasil diperbarui');
  })
);

router.delete(
  '/status-kawin/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refStatusPerkawinanService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Status Perkawinan berhasil dinonaktifkan');
  })
);

// ============================================
// HUBUNGAN KELUARGA ROUTES
// ============================================
const hubunganSchema = z.object({
  kode: z.string().min(1).max(20),
  nama: z.string().min(1).max(50),
  kategori: z.string().min(1).max(20),
  isAktif: z.boolean().default(true),
});

const hubunganUpdateSchema = z.object({
  nama: z.string().min(1).max(50).optional(),
  kategori: z.string().min(1).max(20).optional(),
  isAktif: z.boolean().optional(),
});

const hubunganQuerySchema = querySchema.extend({
  kategori: z.string().optional(),
});

router.get(
  '/hubungan-keluarga',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = hubunganQuerySchema.parse(req.query);
    const result = await refHubunganKeluargaService.findAll(query);
    return response.success(res, result.data, 'Daftar Hubungan Keluarga', result.meta);
  })
);

router.get(
  '/hubungan-keluarga/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const hubungan = await refHubunganKeluargaService.findByKode(params.kode);
    if (!hubungan) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: hubungan.id.toString(),
      kode: hubungan.kode,
      nama: hubungan.nama,
      kategori: hubungan.kategori,
      isAktif: hubungan.isAktif,
      createdAt: hubungan.createdAt.toISOString(),
      updatedAt: hubungan.updatedAt.toISOString(),
    }, 'Detail Hubungan Keluarga');
  })
);

router.post(
  '/hubungan-keluarga',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = hubunganSchema.parse(req.body);
    const result = await refHubunganKeluargaService.create(
      { kode: data.kode, nama: data.nama, kategori: data.kategori, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Hubungan Keluarga berhasil dibuat');
  })
);

router.patch(
  '/hubungan-keluarga/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = hubunganUpdateSchema.parse(req.body);
    const result = await refHubunganKeluargaService.update(
      params.kode,
      { nama: body.nama, kategori: body.kategori, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Hubungan Keluarga berhasil diperbarui');
  })
);

router.delete(
  '/hubungan-keluarga/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refHubunganKeluargaService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Hubungan Keluarga berhasil dinonaktifkan');
  })
);

// ============================================
// STATUS KEPENDUDUKAN ROUTES
// ============================================
router.get(
  '/status-kependudukan',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await refStatusKependudukanService.findAll(query);
    return response.success(res, result.data, 'Daftar Status Kependudukan', result.meta);
  })
);

router.get(
  '/status-kependudukan/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const status = await refStatusKependudukanService.findByKode(params.kode);
    if (!status) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: status.id.toString(),
      kode: status.kode,
      nama: status.nama,
      isAktif: status.isAktif,
      createdAt: status.createdAt.toISOString(),
      updatedAt: status.updatedAt.toISOString(),
    }, 'Detail Status Kependudukan');
  })
);

router.post(
  '/status-kependudukan',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const result = await refStatusKependudukanService.create(
      { kode: data.kode, nama: data.nama, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Status Kependudukan berhasil dibuat');
  })
);

router.patch(
  '/status-kependudukan/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = updateSchema.parse(req.body);
    const result = await refStatusKependudukanService.update(
      params.kode,
      { nama: body.nama, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Status Kependudukan berhasil diperbarui');
  })
);

router.delete(
  '/status-kependudukan/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refStatusKependudukanService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Status Kependudukan berhasil dinonaktifkan');
  })
);

// ============================================
// PENDIDIKAN ROUTES
// ============================================
const pendidikanCreateSchema = z.object({
  kode: z.string().min(1).max(10),
  nama: z.string().min(1).max(100),
  jenjang: z.number().int().min(0),
  isAktif: z.boolean().default(true),
});

const pendidikanUpdateSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  jenjang: z.number().int().min(0).optional(),
  isAktif: z.boolean().optional(),
});

router.get(
  '/pendidikan',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await refPendidikanService.findAll(query);
    return response.success(res, result.data, 'Daftar Pendidikan', result.meta);
  })
);

router.get(
  '/pendidikan/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const pendidikan = await refPendidikanService.findByKode(params.kode);
    if (!pendidikan) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: pendidikan.id.toString(),
      kode: pendidikan.kode,
      nama: pendidikan.nama,
      jenjang: pendidikan.jenjang,
      isAktif: pendidikan.isAktif,
      createdAt: pendidikan.createdAt.toISOString(),
      updatedAt: pendidikan.updatedAt.toISOString(),
    }, 'Detail Pendidikan');
  })
);

router.post(
  '/pendidikan',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = pendidikanCreateSchema.parse(req.body);
    const result = await refPendidikanService.create(
      { kode: data.kode, nama: data.nama, jenjang: data.jenjang, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Pendidikan berhasil dibuat');
  })
);

router.patch(
  '/pendidikan/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = pendidikanUpdateSchema.parse(req.body);
    const result = await refPendidikanService.update(
      params.kode,
      { nama: body.nama, jenjang: body.jenjang, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Pendidikan berhasil diperbarui');
  })
);

router.delete(
  '/pendidikan/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refPendidikanService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Pendidikan berhasil dinonaktifkan');
  })
);

// ============================================
// PEKERJAAN ROUTES
// ============================================
const pekerjaanCreateSchema = z.object({
  kode: z.string().min(1).max(10),
  nama: z.string().min(1).max(100),
  kategori: z.string().max(50).optional(),
  isAktif: z.boolean().default(true),
});

const pekerjaanUpdateSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  kategori: z.string().max(50).optional(),
  isAktif: z.boolean().optional(),
});

const pekerjaanQuerySchema = querySchema.extend({
  kategori: z.string().optional(),
});

router.get(
  '/pekerjaan',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = pekerjaanQuerySchema.parse(req.query);
    const result = await refPekerjaanService.findAll(query);
    return response.success(res, result.data, 'Daftar Pekerjaan', result.meta);
  })
);

router.get(
  '/pekerjaan/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const pekerjaan = await refPekerjaanService.findByKode(params.kode);
    if (!pekerjaan) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: pekerjaan.id.toString(),
      kode: pekerjaan.kode,
      nama: pekerjaan.nama,
      kategori: pekerjaan.kategori,
      isAktif: pekerjaan.isAktif,
      createdAt: pekerjaan.createdAt.toISOString(),
      updatedAt: pekerjaan.updatedAt.toISOString(),
    }, 'Detail Pekerjaan');
  })
);

router.post(
  '/pekerjaan',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = pekerjaanCreateSchema.parse(req.body);
    const result = await refPekerjaanService.create(
      { kode: data.kode, nama: data.nama, kategori: data.kategori, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Pekerjaan berhasil dibuat');
  })
);

router.patch(
  '/pekerjaan/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = pekerjaanUpdateSchema.parse(req.body);
    const result = await refPekerjaanService.update(
      params.kode,
      { nama: body.nama, kategori: body.kategori, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Pekerjaan berhasil diperbarui');
  })
);

router.delete(
  '/pekerjaan/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refPekerjaanService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Pekerjaan berhasil dinonaktifkan');
  })
);

// ============================================
// JABATAN PERANGKAT ROUTES
// ============================================
const jabatanCreateSchema = z.object({
  kode: z.string().min(1).max(20),
  nama: z.string().min(1).max(100),
  kategori: z.string().min(1).max(50),
  urutan: z.number().int().default(0),
  isAktif: z.boolean().default(true),
});

const jabatanUpdateSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  kategori: z.string().min(1).max(50).optional(),
  urutan: z.number().int().optional(),
  isAktif: z.boolean().optional(),
});

const jabatanQuerySchema = querySchema.extend({
  kategori: z.string().optional(),
});

router.get(
  '/jabatan-perangkat',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = jabatanQuerySchema.parse(req.query);
    const result = await refJabatanPerangkatService.findAll(query);
    return response.success(res, result.data, 'Daftar Jabatan Perangkat', result.meta);
  })
);

router.get(
  '/jabatan-perangkat/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const jabatan = await refJabatanPerangkatService.findByKode(params.kode);
    if (!jabatan) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: jabatan.id.toString(),
      kode: jabatan.kode,
      nama: jabatan.nama,
      kategori: jabatan.kategori,
      urutan: jabatan.urutan,
      isAktif: jabatan.isAktif,
      createdAt: jabatan.createdAt.toISOString(),
      updatedAt: jabatan.updatedAt.toISOString(),
    }, 'Detail Jabatan Perangkat');
  })
);

router.post(
  '/jabatan-perangkat',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = jabatanCreateSchema.parse(req.body);
    const result = await refJabatanPerangkatService.create(
      { kode: data.kode, nama: data.nama, kategori: data.kategori, urutan: data.urutan, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Jabatan Perangkat berhasil dibuat');
  })
);

router.patch(
  '/jabatan-perangkat/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = jabatanUpdateSchema.parse(req.body);
    const result = await refJabatanPerangkatService.update(
      params.kode,
      { nama: body.nama, kategori: body.kategori, urutan: body.urutan, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Jabatan Perangkat berhasil diperbarui');
  })
);

router.delete(
  '/jabatan-perangkat/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refJabatanPerangkatService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Jabatan Perangkat berhasil dinonaktifkan');
  })
);

// ============================================
// STATUS PERANGKAT ROUTES
// ============================================
router.get(
  '/status-perangkat',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await refStatusPerangkatService.findAll(query);
    return response.success(res, result.data, 'Daftar Status Perangkat', result.meta);
  })
);

router.get(
  '/status-perangkat/:kode',
  authenticateInternal(),
  authorize('reference.view'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const status = await refStatusPerangkatService.findByKode(params.kode);
    if (!status) throw ApiError.notFound('Data tidak ditemukan');
    return response.success(res, {
      id: status.id.toString(),
      kode: status.kode,
      nama: status.nama,
      isAktif: status.isAktif,
      createdAt: status.createdAt.toISOString(),
      updatedAt: status.updatedAt.toISOString(),
    }, 'Detail Status Perangkat');
  })
);

router.post(
  '/status-perangkat',
  authenticateInternal(),
  authorize('reference.create'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const result = await refStatusPerangkatService.create(
      { kode: data.kode, nama: data.nama, isAktif: data.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.created(res, result, 'Status Perangkat berhasil dibuat');
  })
);

router.patch(
  '/status-perangkat/:kode',
  authenticateInternal(),
  authorize('reference.update'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    const body = updateSchema.parse(req.body);
    const result = await refStatusPerangkatService.update(
      params.kode,
      { nama: body.nama, isAktif: body.isAktif },
      req.user?.accountId, req.ip, req.headers['user-agent'] as string
    );
    return response.success(res, result, 'Status Perangkat berhasil diperbarui');
  })
);

router.delete(
  '/status-perangkat/:kode',
  authenticateInternal(),
  authorize('reference.delete'),
  asyncHandler(async (req, res) => {
    const params = kodeSchema.parse(req.params);
    await refStatusPerangkatService.deactivate(params.kode, req.user?.accountId, req.ip, req.headers['user-agent'] as string);
    return response.success(res, null, 'Status Perangkat berhasil dinonaktifkan');
  })
);

export default router;
