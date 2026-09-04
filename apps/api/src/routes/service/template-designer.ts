import { ApiError } from '../../utils/response.js';
import { Router, Request } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { templateDesignerService } from '../../services/template-designer.service.js';
import { dokumenDefinitionService, templateSuratService, templateVersionService } from '../../services/dokumen.service.js';
import {
  createTemplateSuratSchema,
  updateTemplateSuratSchema,
  queryTemplateSuratSchema,
  idParamSchema,
  ExtendedKopConfigSchema,
  ExtendedSignatureConfigSchema,
  ExtendedTemplateContentSchema,
} from '../../dto/service-document.dto.js';
import { validateTemplateBindings } from '../../utils/binding-resolver.js';

const router = Router();



/**
 * Get current user's account ID
 */
function getAccountId(req: Request): bigint {
  const accountId = req.user?.accountId;
  if (!accountId) {
    throw ApiError.unauthorized('Tidak ter-authentikasi');
  }
  return accountId;
}

// ============================================================
// Field Registry Endpoints
// ============================================================

/**
 * GET /api/template-designer/registry - Get field registry for designer
 */
router.get(
  '/registry',
  authenticateInternal(),
  asyncHandler(async (_req, res) => {
    const registry = templateDesignerService.getFieldRegistry();
    return response.success(res, registry, 'Field Registry');
  })
);

/**
 * GET /api/template-designer/numbering-tokens - Get numbering tokens
 */
router.get(
  '/numbering-tokens',
  authenticateInternal(),
  asyncHandler(async (req, res) => {
    const layananId = req.query.layananId;
    if (!layananId) {
      throw ApiError.badRequest('layananId wajib diisi');
    }
    const tokens = await templateDesignerService.getNumberingTokens(BigInt(layananId as string));
    return response.success(res, tokens, 'Numbering Tokens');
  })
);

// ============================================================
// Template CRUD with Designer Support
// ============================================================

/**
 * GET /api/template-designer/templates - List all templates with versions
 */
router.get(
  '/templates',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const query = queryTemplateSuratSchema.parse(req.query);
    const result = await templateSuratService.findAllWithVersions(query);
    return response.success(res, result.data, 'Daftar Template', result.meta);
  })
);

/**
 * GET /api/template-designer/templates/:id - Get template with all versions
 */
router.get(
  '/templates/:id',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const template = await templateSuratService.findByIdWithVersions(BigInt(id));
    if (!template) {
      throw ApiError.notFound('Template tidak ditemukan');
    }
    return response.success(res, template, 'Detail Template');
  })
);

/**
 * POST /api/template-designer/templates - Create new template with initial version
 */
router.post(
  '/templates',
  authenticateInternal(),
  authorize('template.create'),
  asyncHandler(async (req, res) => {
    const data = createTemplateSuratSchema.parse(req.body);
    const accountId = getAccountId(req);

    // Check if dokumen belongs to user's desa
    const dokumen = await dokumenDefinitionService.findByIdWithDesa(BigInt(data.dokumenId));
    if (!dokumen) {
      throw ApiError.notFound('Dokumen tidak ditemukan atau bukan milik desa ini');
    }

    const result = await templateDesignerService.createTemplateWithVersion({
      dokumenId: BigInt(data.dokumenId),
      nama: data.nama,
      slug: data.slug,
      deskripsi: data.deskripsi ?? undefined,
      createdBy: accountId,
    });

    return response.created(res, {
      ...result.template,
      latestVersion: result.version,
    }, 'Template berhasil dibuat');
  })
);

/**
 * PATCH /api/template-designer/templates/:id - Update template metadata
 */
router.patch(
  '/templates/:id',
  authenticateInternal(),
  authorize('template.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateTemplateSuratSchema.parse(req.body);
    const template = await templateSuratService.update(BigInt(id), data);
    return response.success(res, template, 'Template berhasil diperbarui');
  })
);

/**
 * POST /api/template-designer/templates/:id/duplicate - Duplicate template
 */
router.post(
  '/templates/:id/duplicate',
  authenticateInternal(),
  authorize('template.create'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { nama, slug } = req.body;

    if (!nama || !slug) {
      throw ApiError.badRequest('nama dan slug wajib diisi');
    }

    const accountId = getAccountId(req);
    const result = await templateDesignerService.duplicateTemplate(
      BigInt(id),
      nama,
      slug,
      accountId
    );

    return response.created(res, {
      ...result.template,
      latestVersion: result.version,
    }, 'Template berhasil diduplikasi');
  })
);

// ============================================================
// Version Management
// ============================================================

/**
 * POST /api/template-designer/templates/:id/versions - Create new version
 */
router.post(
  '/templates/:id/versions',
  authenticateInternal(),
  authorize('template.create'),
  asyncHandler(async (req, res) => {
    const templateId = req.params.id;
    if (!templateId || !/^\d+$/.test(templateId)) {
      throw ApiError.badRequest('Template ID harus angka');
    }

    const body = req.body;
    const { content, kopConfig, signatureConfig, changelog } = body;

    // Validate content if provided
    if (content) {
      try {
        ExtendedTemplateContentSchema.parse(content);
      } catch (e) {
        throw ApiError.validation('Format content tidak valid');
      }

      const bindingValidation = validateTemplateBindings(content);
      if (!bindingValidation.valid) {
        throw ApiError.validation('Template mengandung binding tidak valid', bindingValidation.errors);
      }
    }

    // Validate kop config if provided
    if (kopConfig) {
      try {
        ExtendedKopConfigSchema.parse(kopConfig);
      } catch (e) {
        throw ApiError.validation('Format kop config tidak valid');
      }
    }

    // Validate signature config if provided
    if (signatureConfig) {
      try {
        ExtendedSignatureConfigSchema.parse(signatureConfig);
      } catch (e) {
        throw ApiError.validation('Format signature config tidak valid');
      }
    }

    const accountId = getAccountId(req);
    const version = await templateVersionService.createFromDesigner(
      BigInt(templateId),
      { content, kopConfig, signatureConfig, changelog },
      accountId
    );

    return response.created(res, version, 'Versi berhasil dibuat');
  })
);

/**
 * GET /api/template-designer/versions/:id - Get version by ID
 */
router.get(
  '/versions/:id',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const version = await templateVersionService.findByIdWithRelations(BigInt(id));
    if (!version) {
      throw ApiError.notFound('Versi tidak ditemukan');
    }
    return response.success(res, version, 'Detail Versi');
  })
);

/**
 * PATCH /api/template-designer/versions/:id - Update version (DRAFT only)
 */
router.patch(
  '/versions/:id',
  authenticateInternal(),
  authorize('template.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = req.body;
    const { content, kopConfig, signatureConfig, changelog } = body;

    // Validate content if provided
    if (content) {
      const bindingValidation = validateTemplateBindings(content);
      if (!bindingValidation.valid) {
        throw ApiError.validation('Template mengandung binding tidak valid', bindingValidation.errors);
      }
    }

    const version = await templateVersionService.updateFromDesigner(BigInt(id), {
      content,
      kopConfig,
      signatureConfig,
      changelog,
    });

    return response.success(res, version, 'Versi berhasil diperbarui');
  })
);

/**
 * POST /api/template-designer/versions/:id/validate - Validate template
 */
router.post(
  '/versions/:id/validate',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const validation = await templateDesignerService.validateTemplate(BigInt(id));
    return response.success(res, validation, 'Validasi Template');
  })
);

/**
 * POST /api/template-designer/versions/:id/preview - Generate preview
 */
router.post(
  '/versions/:id/preview',
  authenticateInternal(),
  authorize('template.preview'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { customData } = req.body || {};

    const preview = await templateDesignerService.generatePreview(BigInt(id), customData);
    return response.success(res, preview, 'Preview Template');
  })
);

/**
 * POST /api/template-designer/versions/:id/publish - Publish version
 */
router.post(
  '/versions/:id/publish',
  authenticateInternal(),
  authorize('template.publish'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);

    // Validate before publishing
    const validation = await templateDesignerService.validateTemplate(BigInt(id));
    if (!validation.valid) {
      throw ApiError.validation('Template tidak valid untuk dipublikasikan', validation.errors);
    }

    const version = await templateVersionService.publish(BigInt(id));
    return response.success(res, version, 'Versi berhasil dipublikasikan');
  })
);

/**
 * POST /api/template-designer/versions/:id/archive - Archive version
 */
router.post(
  '/versions/:id/archive',
  authenticateInternal(),
  authorize('template.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const version = await templateVersionService.archive(BigInt(id));
    return response.success(res, version, 'Versi berhasil diarsipkan');
  })
);

export default router;
