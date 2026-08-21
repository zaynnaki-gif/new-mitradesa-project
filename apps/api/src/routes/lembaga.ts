import { Router } from 'express';
import { asyncHandler, response } from '../utils/response';
import { authenticateInternal, authorize } from '../middleware/index';
import { lembagaService } from '../services/lembaga.service';

const router = Router();

router.get(
  '/',
  authenticateInternal(),
  authorize('lembaga.view'),
  asyncHandler(async (req, res) => {
    const result = await lembagaService.findAll(req.query as any);
    return response.success(res, result.data, 'Daftar lembaga', result.meta);
  })
);

router.get(
  '/:id',
  authenticateInternal(),
  authorize('lembaga.view'),
  asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const data = await lembagaService.findById(id);
    return response.success(res, data);
  })
);

router.post(
  '/',
  authenticateInternal(),
  authorize('lembaga.create'),
  asyncHandler(async (req, res) => {
    const data = await lembagaService.create(
      req.body,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent'] as string
    );
    return response.created(res, data, 'Lembaga berhasil dibuat');
  })
);

router.patch(
  '/:id',
  authenticateInternal(),
  authorize('lembaga.update'),
  asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const data = await lembagaService.update(
      id,
      req.body,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent'] as string
    );
    return response.success(res, data, 'Lembaga berhasil diperbarui');
  })
);

router.delete(
  '/:id',
  authenticateInternal(),
  authorize('lembaga.delete'),
  asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    await lembagaService.delete(
      id,
      req.user?.accountId,
      req.ip,
      req.headers['user-agent'] as string
    );
    return response.success(res, null, 'Lembaga berhasil dihapus');
  })
);

export default router;
