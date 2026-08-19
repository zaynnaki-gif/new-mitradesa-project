import { z } from 'zod';
import { asyncHandler, response, ApiError } from '../utils/response';
import { authenticateInternal, authorize } from '../middleware/index';
import { wilayahService } from '../services/wilayah.service';

const router = require('express').Router();

// Input types for validation
interface CreateProvinsiInput { kode: string; nama: string }
interface CreateKabupatenInput { provinsiId: number; kode: string; nama: string }
interface CreateKecamatanInput { kabupatenId: number; kode: string; nama: string }
interface CreateDesaInput { kecamatanId: number; kode: string; nama: string }

// Validation schemas
const createProvinsiSchema = z.object({
  kode: z.string().min(1).max(10),
  nama: z.string().min(1).max(100),
});

const createKabupatenSchema = z.object({
  provinsiId: z.number().int().positive(),
  kode: z.string().min(1).max(10),
  nama: z.string().min(1).max(100),
});

const createKecamatanSchema = z.object({
  kabupatenId: z.number().int().positive(),
  kode: z.string().min(1).max(10),
  nama: z.string().min(1).max(100),
});

const createDesaSchema = z.object({
  kecamatanId: z.number().int().positive(),
  kode: z.string().min(1).max(10),
  nama: z.string().min(1).max(100),
});

/**
 * @route   GET /api/wilayah/provinsi
 * @desc    Get all provinces
 * @access  Public
 */
router.get('/provinsi', asyncHandler(async (_req, res) => {
  const provinces = await wilayahService.getProvinsiAll();
  return response.success(res, provinces);
}));

/**
 * @route   GET /api/wilayah/provinsi/:id
 * @desc    Get province by ID
 * @access  Public
 */
router.get('/provinsi/:id', asyncHandler(async (req, res) => {
  const province = await wilayahService.getProvinsiById(parseInt(req.params.id));
  if (!province) {
    throw ApiError.notFound('Province not found');
  }
  return response.success(res, province);
}));

/**
 * @route   POST /api/wilayah/provinsi
 * @desc    Create province
 * @access  Private (Admin)
 */
router.post(
  '/provinsi',
  authenticateInternal(),
  authorize('wilayah.create'),
  asyncHandler(async (req, res) => {
    const data = createProvinsiSchema.parse(req.body) as CreateProvinsiInput;
    const province = await wilayahService.createProvinsi(data);
    return response.created(res, province, 'Province created successfully');
  })
);

/**
 * @route   PUT /api/wilayah/provinsi/:id
 * @desc    Update province
 * @access  Private (Admin)
 */
router.put(
  '/provinsi/:id',
  authenticateInternal(),
  authorize('wilayah.update'),
  asyncHandler(async (req, res) => {
    const province = await wilayahService.updateProvinsi(
      parseInt(req.params.id),
      req.body
    );
    if (!province) {
      throw ApiError.notFound('Province not found');
    }
    return response.success(res, province, 'Province updated successfully');
  })
);

/**
 * @route   DELETE /api/wilayah/provinsi/:id
 * @desc    Delete province
 * @access  Private (Admin)
 */
router.delete(
  '/provinsi/:id',
  authenticateInternal(),
  authorize('wilayah.delete'),
  asyncHandler(async (req, res) => {
    await wilayahService.deleteProvinsi(parseInt(req.params.id));
    return response.success(res, null, 'Province deleted successfully');
  })
);

/**
 * @route   GET /api/wilayah/kabupaten
 * @desc    Get all regencies
 * @access  Public
 */
router.get('/kabupaten', asyncHandler(async (req, res) => {
  const { provinsiId } = req.query;
  const regencies = await wilayahService.getKabupatenAll(
    provinsiId ? parseInt(provinsiId as string) : undefined
  );
  return response.success(res, regencies);
}));

/**
 * @route   GET /api/wilayah/kabupaten/:id
 * @desc    Get regency by ID
 * @access  Public
 */
router.get('/kabupaten/:id', asyncHandler(async (req, res) => {
  const regency = await wilayahService.getKabupatenById(parseInt(req.params.id));
  if (!regency) {
    throw ApiError.notFound('Regency not found');
  }
  return response.success(res, regency);
}));

/**
 * @route   POST /api/wilayah/kabupaten
 * @desc    Create regency
 * @access  Private (Admin)
 */
router.post(
  '/kabupaten',
  authenticateInternal(),
  authorize('wilayah.create'),
  asyncHandler(async (req, res) => {
    const data = createKabupatenSchema.parse(req.body) as CreateKabupatenInput;
    const regency = await wilayahService.createKabupaten(data);
    return response.created(res, regency, 'Regency created successfully');
  })
);

/**
 * @route   PUT /api/wilayah/kabupaten/:id
 * @desc    Update regency
 * @access  Private (Admin)
 */
router.put(
  '/kabupaten/:id',
  authenticateInternal(),
  authorize('wilayah.update'),
  asyncHandler(async (req, res) => {
    const regency = await wilayahService.updateKabupaten(parseInt(req.params.id), req.body);
    if (!regency) {
      throw ApiError.notFound('Regency not found');
    }
    return response.success(res, regency, 'Regency updated successfully');
  })
);

/**
 * @route   DELETE /api/wilayah/kabupaten/:id
 * @desc    Delete regency
 * @access  Private (Admin)
 */
router.delete(
  '/kabupaten/:id',
  authenticateInternal(),
  authorize('wilayah.delete'),
  asyncHandler(async (req, res) => {
    await wilayahService.deleteKabupaten(parseInt(req.params.id));
    return response.success(res, null, 'Regency deleted successfully');
  })
);

/**
 * @route   GET /api/wilayah/kecamatan
 * @desc    Get all districts
 * @access  Public
 */
router.get('/kecamatan', asyncHandler(async (req, res) => {
  const { kabupatenId } = req.query;
  const districts = await wilayahService.getKecamatanAll(
    kabupatenId ? parseInt(kabupatenId as string) : undefined
  );
  return response.success(res, districts);
}));

/**
 * @route   GET /api/wilayah/kecamatan/:id
 * @desc    Get district by ID
 * @access  Public
 */
router.get('/kecamatan/:id', asyncHandler(async (req, res) => {
  const district = await wilayahService.getKecamatanById(parseInt(req.params.id));
  if (!district) {
    throw ApiError.notFound('District not found');
  }
  return response.success(res, district);
}));

/**
 * @route   POST /api/wilayah/kecamatan
 * @desc    Create district
 * @access  Private (Admin)
 */
router.post(
  '/kecamatan',
  authenticateInternal(),
  authorize('wilayah.create'),
  asyncHandler(async (req, res) => {
    const data = createKecamatanSchema.parse(req.body) as CreateKecamatanInput;
    const district = await wilayahService.createKecamatan(data);
    return response.created(res, district, 'District created successfully');
  })
);

/**
 * @route   PUT /api/wilayah/kecamatan/:id
 * @desc    Update district
 * @access  Private (Admin)
 */
router.put(
  '/kecamatan/:id',
  authenticateInternal(),
  authorize('wilayah.update'),
  asyncHandler(async (req, res) => {
    const district = await wilayahService.updateKecamatan(parseInt(req.params.id), req.body);
    if (!district) {
      throw ApiError.notFound('District not found');
    }
    return response.success(res, district, 'District updated successfully');
  })
);

/**
 * @route   DELETE /api/wilayah/kecamatan/:id
 * @desc    Delete district
 * @access  Private (Admin)
 */
router.delete(
  '/kecamatan/:id',
  authenticateInternal(),
  authorize('wilayah.delete'),
  asyncHandler(async (req, res) => {
    await wilayahService.deleteKecamatan(parseInt(req.params.id));
    return response.success(res, null, 'District deleted successfully');
  })
);

/**
 * @route   GET /api/wilayah/desa
 * @desc    Get all villages
 * @access  Public
 */
router.get('/desa', asyncHandler(async (req, res) => {
  const { kecamatanId } = req.query;
  const villages = await wilayahService.getDesaAll(
    kecamatanId ? parseInt(kecamatanId as string) : undefined
  );
  return response.success(res, villages);
}));

/**
 * @route   GET /api/wilayah/desa/:id
 * @desc    Get village by ID
 * @access  Public
 */
router.get('/desa/:id', asyncHandler(async (req, res) => {
  const village = await wilayahService.getDesaById(parseInt(req.params.id));
  if (!village) {
    throw ApiError.notFound('Village not found');
  }
  return response.success(res, village);
}));

/**
 * @route   POST /api/wilayah/desa
 * @desc    Create village
 * @access  Private (Admin)
 */
router.post(
  '/desa',
  authenticateInternal(),
  authorize('wilayah.create'),
  asyncHandler(async (req, res) => {
    const data = createDesaSchema.parse(req.body) as CreateDesaInput;
    const village = await wilayahService.createDesa(data);
    return response.created(res, village, 'Village created successfully');
  })
);

/**
 * @route   PUT /api/wilayah/desa/:id
 * @desc    Update village
 * @access  Private (Admin)
 */
router.put(
  '/desa/:id',
  authenticateInternal(),
  authorize('wilayah.update'),
  asyncHandler(async (req, res) => {
    const village = await wilayahService.updateDesa(parseInt(req.params.id), req.body);
    if (!village) {
      throw ApiError.notFound('Village not found');
    }
    return response.success(res, village, 'Village updated successfully');
  })
);

/**
 * @route   DELETE /api/wilayah/desa/:id
 * @desc    Delete village
 * @access  Private (Admin)
 */
router.delete(
  '/desa/:id',
  authenticateInternal(),
  authorize('wilayah.delete'),
  asyncHandler(async (req, res) => {
    await wilayahService.deleteDesa(parseInt(req.params.id));
    return response.success(res, null, 'Village deleted successfully');
  })
);

export default router;
