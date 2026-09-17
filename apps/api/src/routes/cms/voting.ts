import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { votingService } from '../../services/voting.service.js';
import {
  createVotingSchema,
  updateVotingSchema,
  createKandidatSchema,
  castVoteSchema,
} from '../../dto/usulan-voting.dto.js';
import { authenticateInternal } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';


const router = Router();

// ============================================================
// Voting CRUD (Admin)
// ============================================================

/**
 * @route GET /api/cms/voting
 * @desc  Daftar semua voting
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('voting.view'),
  asyncHandler(async (_req, res) => {
    const data = await votingService.findAll();
    return response.success(res, data, 'Daftar voting');
  })
);

/**
 * @route GET /api/cms/voting/:id
 * @desc  Detail voting
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await votingService.findById(BigInt(req.params.id));
    return response.success(res, data);
  })
);

/**
 * @route GET /api/cms/voting/:id/hasil
 * @desc  Rekap hasil voting (realtime)
 */
router.get(
  '/:id/hasil',
  asyncHandler(async (req, res) => {
    const data = await votingService.getHasil(BigInt(req.params.id));
    return response.success(res, data, 'Hasil voting');
  })
);

/**
 * @route POST /api/cms/voting
 * @desc  Buat voting baru
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('voting.create'),
  asyncHandler(async (req, res) => {
    const input = createVotingSchema.parse(req.body);
    const data = await votingService.create(input, req.user?.accountId, req.ip, req.headers['user-agent']);
    return response.created(res, data, 'Voting berhasil dibuat');
  })
);

/**
 * @route PUT /api/cms/voting/:id
 * @desc  Update voting
 */
router.put(
  '/:id',
  authenticateInternal(),
  authorize('voting.update'),
  asyncHandler(async (req, res) => {
    const input = updateVotingSchema.parse(req.body);
    const data = await votingService.update(BigInt(req.params.id), input, req.user?.accountId, req.ip, req.headers['user-agent']);
    return response.success(res, data, 'Voting berhasil diperbarui');
  })
);

/**
 * @route DELETE /api/cms/voting/:id
 * @desc  Hapus voting
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('voting.delete'),
  asyncHandler(async (req, res) => {
    await votingService.remove(BigInt(req.params.id), req.user?.accountId, req.ip, req.headers['user-agent']);
    return response.success(res, null, 'Voting berhasil dihapus');
  })
);

// ============================================================
// Kandidat
// ============================================================

/**
 * @route POST /api/cms/voting/:id/kandidat
 * @desc  Tambah kandidat ke voting
 */
router.post(
  '/:id/kandidat',
  authenticateInternal(),
  authorize('voting.create'),
  asyncHandler(async (req, res) => {
    const input = createKandidatSchema.parse(req.body);
    const data = await votingService.addKandidat(BigInt(req.params.id), input, req.user?.accountId);
    return response.created(res, data, 'Kandidat berhasil ditambahkan');
  })
);

/**
 * @route DELETE /api/cms/voting/:id/kandidat/:kandidatId
 * @desc  Hapus kandidat dari voting
 */
router.delete(
  '/:id/kandidat/:kandidatId',
  authenticateInternal(),
  authorize('voting.delete'),
  asyncHandler(async (req, res) => {
    await votingService.removeKandidat(BigInt(req.params.id), BigInt(req.params.kandidatId));
    return response.success(res, null, 'Kandidat berhasil dihapus');
  })
);

/**
 * @route POST /api/cms/voting/:id/kandidat/:kandidatId/apbdes
 * @desc  Jadikan RKPDes kandidat ini sebagai item APBDes
 */
router.post(
  '/:id/kandidat/:kandidatId/apbdes',
  authenticateInternal(),
  authorize('voting.update'), // Only people who can update voting (admin) can do this
  asyncHandler(async (req, res) => {
    const data = await votingService.jadikanApbdes(BigInt(req.params.id), BigInt(req.params.kandidatId), req.user?.accountId, req.ip, req.headers['user-agent']);
    return response.success(res, data, 'Program berhasil dimasukkan ke APBDes');
  })
);

// ============================================================
// Cast Vote (Warga)
// ============================================================

/**
 * @route POST /api/cms/voting/:id/vote
 * @desc  Cast suara untuk warga
 */
router.post(
  '/:id/vote',
  asyncHandler(async (req, res) => {
    const input = castVoteSchema.parse(req.body);
    const data = await votingService.castVote(BigInt(req.params.id), input);
    return response.created(res, data, 'Suara berhasil diberikan');
  })
);

export default router;
