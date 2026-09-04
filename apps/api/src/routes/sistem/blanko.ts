import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { blankoService, type BlankoInput } from '../../services/blanko.service.js';
import { authenticateInternal } from '../../middleware/index.js';
import { response, asyncHandler, ApiError } from '../../utils/response.js';

const router = Router();
router.use(authenticateInternal());

// ============================================
// Validation Schemas
// ============================================

const blankoSchema = z.object({
  nama: z.string().min(1).max(255),
  paperSize: z.enum(['A4', 'F4']).default('F4'),
  margin: z.record(z.unknown()).optional(),
  layout: z.record(z.unknown()).optional(),
  isDefault: z.boolean().optional().default(false),
});

// Helper
const getDesaId = (req: Request) => {
  // @ts-ignore
  if (!req.user?.desaId) throw ApiError.unauthorized('Desa ID tidak ditemukan');
  // @ts-ignore
  return BigInt(req.user.desaId);
};

// ============================================
// Routes
// ============================================

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const desaId = getDesaId(req);
  const result = await blankoService.getBlankoList(desaId);
  return response.success(res, {
    data: result.map(item => ({
      ...item,
      id: item.id.toString(),
      desaId: item.desaId.toString(),
    }))
  });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const desaId = getDesaId(req);
  const id = BigInt(req.params.id);
  const result = await blankoService.getBlankoById(id, desaId);
  return response.success(res, {
    data: {
      ...result,
      id: result.id.toString(),
      desaId: result.desaId.toString(),
    }
  });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const desaId = getDesaId(req);
  const data = blankoSchema.parse(req.body);
  const result = await blankoService.createBlanko(desaId, data as BlankoInput);
  return response.created(res, {
    data: {
      ...result,
      id: result.id.toString(),
      desaId: result.desaId.toString(),
    }
  });
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const desaId = getDesaId(req);
  const id = BigInt(req.params.id);
  const data = blankoSchema.parse(req.body);
  const result = await blankoService.updateBlanko(id, desaId, data as BlankoInput);
  return response.success(res, {
    data: {
      ...result,
      id: result.id.toString(),
      desaId: result.desaId.toString(),
    }
  });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const desaId = getDesaId(req);
  const id = BigInt(req.params.id);
  await blankoService.deleteBlanko(id, desaId);
  return response.success(res, { success: true });
}));

router.put('/:id/set-default', asyncHandler(async (req: Request, res: Response) => {
  const desaId = getDesaId(req);
  const id = BigInt(req.params.id);
  const result = await blankoService.setDefaultBlanko(id, desaId);
  return response.success(res, {
    data: {
      ...result,
      id: result.id.toString(),
      desaId: result.desaId.toString(),
    }
  });
}));

export default router;
