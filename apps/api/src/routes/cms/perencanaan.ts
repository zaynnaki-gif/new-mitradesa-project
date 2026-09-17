import { Router } from 'express';
import { response, asyncHandler } from '../../utils/response.js';
import { perencanaanService } from '../../services/perencanaan.service.js';
import { 
  rpjmdesSchema, 
  rpjmdesBidangSchema, 
  rkpdesSchema, 
  queryRpjmdesSchema 
} from '../../dto/perencanaan.dto.js';
import { authenticateInternal } from '../../middleware/auth.middleware.js';

const router = Router();

// Middleware auth
router.use(authenticateInternal());

// ==========================================
// RPJMDES
// ==========================================

/**
 * GET /api/perencanaan/rpjmdes
 * List all RPJMDes
 */
router.get('/rpjmdes', asyncHandler(async (req, res) => {
  const query = queryRpjmdesSchema.parse(req.query);
  const result = await perencanaanService.findAllRpjmdes(query);
  return response.success(res, result.data, 'Daftar RPJMDes', result.meta as unknown as Record<string, unknown>);
}));

/**
 * GET /api/perencanaan/rpjmdes/:id
 * Get RPJMDes by ID with its Bidang and RKPDes
 */
router.get('/rpjmdes/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rpjmdes = await perencanaanService.findRpjmdesById(BigInt(id));
  return response.success(res, rpjmdes, 'Detail RPJMDes');
}));

/**
 * POST /api/perencanaan/rpjmdes
 * Create new RPJMDes
 */
router.post('/rpjmdes', asyncHandler(async (req, res) => {
  const data = rpjmdesSchema.parse(req.body);
  const rpjmdes = await perencanaanService.createRpjmdes(data);
  return response.created(res, rpjmdes, 'RPJMDes berhasil dibuat');
}));

/**
 * PATCH /api/perencanaan/rpjmdes/:id
 * Update RPJMDes
 */
router.patch('/rpjmdes/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = rpjmdesSchema.partial().parse(req.body);
  const rpjmdes = await perencanaanService.updateRpjmdes(BigInt(id), data);
  return response.success(res, rpjmdes, 'Data RPJMDes berhasil diperbarui');
}));

/**
 * DELETE /api/perencanaan/rpjmdes/:id
 * Delete RPJMDes
 */
router.delete('/rpjmdes/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await perencanaanService.deleteRpjmdes(BigInt(id));
  return response.success(res, null, 'Data RPJMDes berhasil dihapus');
}));

// ==========================================
// RPJMDES BIDANG
// ==========================================

router.post('/rpjmdes/:id/bidang', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = rpjmdesBidangSchema.parse(req.body);
  const bidang = await perencanaanService.createBidang(BigInt(id), data);
  return response.created(res, bidang, 'Bidang RPJMDes berhasil ditambahkan');
}));

router.patch('/rpjmdes/:id/bidang/:bidangId', asyncHandler(async (req, res) => {
  const { id, bidangId } = req.params;
  const data = rpjmdesBidangSchema.partial().parse(req.body);
  const bidang = await perencanaanService.updateBidang(BigInt(id), BigInt(bidangId), data);
  return response.success(res, bidang, 'Bidang RPJMDes berhasil diperbarui');
}));

router.delete('/rpjmdes/:id/bidang/:bidangId', asyncHandler(async (req, res) => {
  const { id, bidangId } = req.params;
  await perencanaanService.deleteBidang(BigInt(id), BigInt(bidangId));
  return response.success(res, null, 'Bidang RPJMDes berhasil dihapus');
}));

// ==========================================
// RKPDES
// ==========================================

router.get('/rkpdes', asyncHandler(async (req, res) => {
  const { tahun } = req.query;
  const result = await perencanaanService.getAllRkpdes(tahun ? parseInt(tahun as string, 10) : new Date().getFullYear());
  return response.success(res, result, 'Daftar RKPDes');
}));

router.post('/rpjmdes/bidang/:bidangId/rkpdes', asyncHandler(async (req, res) => {
  const { bidangId } = req.params;
  const data = rkpdesSchema.parse({ ...req.body, rpjmdesBidangId: bidangId });
  const rkpdes = await perencanaanService.createRkpdes(BigInt(bidangId), data);
  return response.created(res, rkpdes, 'RKPDes berhasil ditambahkan');
}));

router.patch('/rpjmdes/bidang/:bidangId/rkpdes/:rkpdesId', asyncHandler(async (req, res) => {
  const { bidangId, rkpdesId } = req.params;
  const body = { ...req.body };
  if (!body.rpjmdesBidangId) {
    body.rpjmdesBidangId = bidangId;
  }
  const data = rkpdesSchema.partial().parse(body);
  const rkpdes = await perencanaanService.updateRkpdes(BigInt(bidangId), BigInt(rkpdesId), data);
  return response.success(res, rkpdes, 'RKPDes berhasil diperbarui');
}));

router.delete('/rpjmdes/bidang/:bidangId/rkpdes/:rkpdesId', asyncHandler(async (req, res) => {
  const { bidangId, rkpdesId } = req.params;
  await perencanaanService.deleteRkpdes(BigInt(bidangId), BigInt(rkpdesId));
  return response.success(res, null, 'RKPDes berhasil dihapus');
}));

export default router;
