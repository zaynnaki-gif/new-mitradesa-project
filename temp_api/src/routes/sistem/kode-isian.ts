import { Router, Request, Response } from 'express';
import { kodeIsianService } from '../../services/kode-isian.service.js';
import { authenticateInternal } from '../../middleware/index.js';
import { response, asyncHandler } from '../../utils/response.js';

const router = Router();
router.use(authenticateInternal());

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { kategori } = req.query;
  const result = await kodeIsianService.getKodeIsianList(kategori as string);
  return response.success(res, {
    data: result.map(item => ({
      ...item,
      id: item.id.toString(),
    }))
  });
}));

export default router;
