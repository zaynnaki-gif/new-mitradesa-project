import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { agendaService } from '../../services/agenda.service.js';
import {
  createAgendaSchema,
  updateAgendaSchema,
  queryAgendaSchema,
  idParamSchema,
} from '../../dto/agenda.dto.js';


const router = Router();

/**
 * GET /api/agenda - List all agenda
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('agenda.view'),
  asyncHandler(async (req, res) => {
    const query = queryAgendaSchema.parse(req.query);
    const result = await agendaService.findAll(query);
    return response.success(res, result.data, 'Daftar Agenda', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/agenda/:id - Get agenda by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('agenda.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const agenda = await agendaService.findById(BigInt(id));
    return response.success(res, agenda, 'Detail Agenda');
  })
);

/**
 * POST /api/agenda - Create new agenda
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('agenda.create'),
  asyncHandler(async (req, res) => {
    const data = createAgendaSchema.parse(req.body);
    const agenda = await agendaService.create(data);
    return response.created(res, agenda, 'Agenda berhasil dibuat');
  })
);

/**
 * PATCH /api/agenda/:id - Update agenda
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('agenda.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateAgendaSchema.parse(req.body);
    const agenda = await agendaService.update(BigInt(id), data);
    return response.success(res, agenda, 'Agenda berhasil diperbarui');
  })
);

/**
 * DELETE /api/agenda/:id - Delete agenda
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('agenda.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await agendaService.delete(BigInt(id));
    return response.success(res, null, 'Agenda berhasil dihapus');
  })
);

export default router;
