import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { blankoService, type BlankoInput } from '../../services/blanko.service.js';
import { authenticateInternal } from '../../middleware/index.js';
import { response, asyncHandler } from '../../utils/response.js';

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


// ============================================
// Routes
// ============================================

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await blankoService.getBlankoList();
  return response.success(res, {
    data: result.map(item => ({
      ...item,
      id: item.id.toString(),
    }))
  });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = BigInt(req.params.id);
  const result = await blankoService.getBlankoById(id);
  return response.success(res, {
    data: {
      ...result,
      id: result.id.toString(),
    }
  });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = blankoSchema.parse(req.body);
  const result = await blankoService.createBlanko(data as BlankoInput);
  return response.created(res, {
    data: {
      ...result,
      id: result.id.toString(),
    }
  });
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = BigInt(req.params.id);
  const data = blankoSchema.parse(req.body);
  const result = await blankoService.updateBlanko(id, data as BlankoInput);
  return response.success(res, {
    data: {
      ...result,
      id: result.id.toString(),
    }
  });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = BigInt(req.params.id);
  await blankoService.deleteBlanko(id);
  return response.success(res, { success: true });
}));

router.put('/:id/set-default', asyncHandler(async (req: Request, res: Response) => {
  const id = BigInt(req.params.id);
  const result = await blankoService.setDefaultBlanko(id);
  return response.success(res, {
    data: {
      ...result,
      id: result.id.toString(),
    }
  });
}));

export default router;
