import { ApiError } from '../../utils/response.js';
import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import {
  dokumenDefinitionService,
  templateSuratService,
  templateVersionService,
  instanDokumenService,
  penandaTanganService,
} from '../../services/dokumen.service.js';
import { documentEngineService } from '../../services/document-engine.service.js';
import { prisma } from '../../services/prisma.js';
import {
  createDokumenDefinitionSchema,
  updateDokumenDefinitionSchema,
  queryDokumenDefinitionSchema,
  createTemplateSuratSchema,
  updateTemplateSuratSchema,
  queryTemplateSuratSchema,
  createTemplateVersionSchema,
  updateTemplateVersionSchema,
  queryTemplateVersionSchema,
  queryInstanDokumenSchema,
  createPenandaTanganSchema,
  updatePenandaTanganSchema,
  queryPenandaTanganSchema,
  idParamSchema,
} from '../../dto/service-document.dto.js';
import { validateTemplateBindings, BindingContext } from '../../utils/binding-resolver.js';

const router = Router();



/**
 * Get current user's account ID
 */
function getAccountId(req: Express.Request): bigint {
  const accountId = req.user?.accountId;
  if (!accountId) {
    throw ApiError.unauthorized('Tidak ter-authentikasi');
  }
  return accountId;
}

// ============================================================
// Dokumen Definition Routes
// ============================================================

/**
 * GET /api/documents - List all document definitions
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('document.view'),
  asyncHandler(async (req, res) => {
    const query = queryDokumenDefinitionSchema.parse(req.query);
    const result = await dokumenDefinitionService.findAll(query);
    return response.success(res, result.data, 'Daftar Dokumen', result.meta);
  })
);

/**
 * GET /api/documents/:id - Get document by ID
 */
router.get(
  '/:id',
  authenticateInternal(),
  authorize('document.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const dokumen = await dokumenDefinitionService.findById(BigInt(id));
    if (!dokumen) {
      throw ApiError.notFound('Dokumen tidak ditemukan');
    }
    return response.success(res, dokumen, 'Detail Dokumen');
  })
);

/**
 * POST /api/documents - Create document definition
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('document.create'),
  asyncHandler(async (req, res) => {
    const data = createDokumenDefinitionSchema.parse(req.body);
    const dokumen = await dokumenDefinitionService.create(data);
    return response.created(res, dokumen, 'Dokumen berhasil dibuat');
  })
);

/**
 * PATCH /api/documents/:id - Update document definition
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('document.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateDokumenDefinitionSchema.parse(req.body);
    const dokumen = await dokumenDefinitionService.update(BigInt(id), data);
    return response.success(res, dokumen, 'Dokumen berhasil diperbarui');
  })
);

// ============================================================
// Template Routes
// ============================================================

/**
 * GET /api/templates - List all templates
 */
router.get(
  '/templates',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const query = queryTemplateSuratSchema.parse(req.query);
    const result = await templateSuratService.findAll(query);
    return response.success(res, result.data, 'Daftar Template', result.meta);
  })
);

/**
 * GET /api/templates/:id - Get template by ID
 */
router.get(
  '/templates/:id',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const template = await templateSuratService.findById(BigInt(id));
    if (!template) {
      throw ApiError.notFound('Template tidak ditemukan');
    }
    return response.success(res, template, 'Detail Template');
  })
);

/**
 * POST /api/templates - Create template
 */
router.post(
  '/templates',
  authenticateInternal(),
  authorize('template.create'),
  asyncHandler(async (req, res) => {
    const data = createTemplateSuratSchema.parse(req.body);
    const template = await templateSuratService.create(data);
    return response.created(res, template, 'Template berhasil dibuat');
  })
);

/**
 * PATCH /api/templates/:id - Update template
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

// ============================================================
// Template Version Routes
// ============================================================

/**
 * GET /api/templates/:id/versions - Get versions for a template
 */
router.get(
  '/templates/:id/versions',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const templateId = req.params.id;
    if (!templateId || !/^\d+$/.test(templateId)) {
      throw ApiError.badRequest('Template ID harus angka');
    }
    const query = queryTemplateVersionSchema.parse(req.query);
    const queryWithTemplate = { ...query, templateId: parseInt(templateId) };
    const result = await templateVersionService.findByTemplate(
      BigInt(templateId),
      queryWithTemplate
    );
    return response.success(res, result.data, 'Daftar Versi', result.meta);
  })
);

/**
 * POST /api/templates/:id/versions - Create new version
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
    const data = createTemplateVersionSchema.parse(req.body);

    // Validate template bindings before saving
    const validation = validateTemplateBindings(data.content);
    if (!validation.valid) {
      throw ApiError.validation(
        'Template mengandung binding tidak valid',
        validation.errors
      );
    }

    const version = await templateVersionService.create(
      BigInt(templateId),
      data,
      getAccountId(req)
    );
    return response.created(res, version, 'Versi berhasil dibuat');
  })
);

/**
 * GET /api/versions/:id - Get version by ID
 */
router.get(
  '/versions/:id',
  authenticateInternal(),
  authorize('template.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const version = await templateVersionService.findById(BigInt(id));
    if (!version) {
      throw ApiError.notFound('Versi tidak ditemukan');
    }
    return response.success(res, version, 'Detail Versi');
  })
);

/**
 * PATCH /api/versions/:id - Update version
 */
router.patch(
  '/versions/:id',
  authenticateInternal(),
  authorize('template.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateTemplateVersionSchema.parse(req.body);

    // Validate bindings if content is being updated
    if (data.content) {
      const validation = validateTemplateBindings(data.content);
      if (!validation.valid) {
        throw ApiError.validation(
          'Template mengandung binding tidak valid',
          validation.errors
        );
      }
    }

    const version = await templateVersionService.update(BigInt(id), data);
    return response.success(res, version, 'Versi berhasil diperbarui');
  })
);

/**
 * POST /api/versions/:id/publish - Publish version
 */
router.post(
  '/versions/:id/publish',
  authenticateInternal(),
  authorize('template.publish'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const version = await templateVersionService.publish(BigInt(id));
    return response.success(res, version, 'Versi berhasil dipublikasikan');
  })
);

/**
 * POST /api/versions/:id/archive - Archive version
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

// ============================================================
// Document Instance Routes
// ============================================================

/**
 * GET /api/documents-instance - List all document instances
 */
router.get(
  '/instances',
  authenticateInternal(),
  authorize('document.view'),
  asyncHandler(async (req, res) => {
    const query = queryInstanDokumenSchema.parse(req.query);
    const result = await instanDokumenService.findAll(query);
    return response.success(res, result.data, 'Daftar Dokumen Instance', result.meta);
  })
);

/**
 * GET /api/documents-instance/:id - Get document instance by ID
 */
router.get(
  '/instances/:id',
  authenticateInternal(),
  authorize('document.view'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const dokumen = await instanDokumenService.findById(BigInt(id));
    if (!dokumen) {
      throw ApiError.notFound('Dokumen tidak ditemukan');
    }
    return response.success(res, dokumen, 'Detail Dokumen');
  })
);

/**
 * POST /api/documents-instance - Generate new document instance
 */
router.post(
  '/instances',
  authenticateInternal(),
  authorize('document.generate'),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const { dokumenId, templateVersionId, permintaanId, judul, requestData } = body;

    if (!dokumenId || !templateVersionId || !judul) {
      throw ApiError.badRequest('dokumenId, templateVersionId, dan judul wajib diisi');
    }

    const dokumen = await instanDokumenService.generate(
      { dokumenId, templateVersionId, permintaanId, judul, requestData }
    );
    return response.created(res, dokumen, 'Dokumen berhasil dibuat');
  })
);

// ============================================================
// Signatory Routes
// ============================================================

/**
 * GET /api/signatories - List all signatories
 */
router.get(
  '/signatories',
  authenticateInternal(),
  authorize('document.sign'),
  asyncHandler(async (req, res) => {
    const query = queryPenandaTanganSchema.parse(req.query);
    const result = await penandaTanganService.findAll(query);
    return response.success(res, result.data, 'Daftar Penanda Tangan', result.meta);
  })
);

/**
 * GET /api/signatories/:id - Get signatory by ID
 */
router.get(
  '/signatories/:id',
  authenticateInternal(),
  authorize('document.sign'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const penandaTangan = await penandaTanganService.findById(BigInt(id));
    if (!penandaTangan) {
      throw ApiError.notFound('Penanda Tangan tidak ditemukan');
    }
    return response.success(res, penandaTangan, 'Detail Penanda Tangan');
  })
);

/**
 * POST /api/signatories - Create signatory
 */
router.post(
  '/signatories',
  authenticateInternal(),
  authorize('document.sign'),
  asyncHandler(async (req, res) => {
    const data = createPenandaTanganSchema.parse(req.body);
    const penandaTangan = await penandaTanganService.create(data);
    return response.created(res, penandaTangan, 'Penanda Tangan berhasil dibuat');
  })
);

/**
 * PATCH /api/signatories/:id - Update signatory
 */
router.patch(
  '/signatories/:id',
  authenticateInternal(),
  authorize('document.sign'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updatePenandaTanganSchema.parse(req.body);
    const penandaTangan = await penandaTanganService.update(
      BigInt(id),
      data
    );
    return response.success(res, penandaTangan, 'Penanda Tangan berhasil diperbarui');
  })
);

/**
 * DELETE /api/signatories/:id - Delete signatory
 */
router.delete(
  '/signatories/:id',
  authenticateInternal(),
  authorize('document.sign'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await penandaTanganService.delete(BigInt(id));
    return response.success(res, null, 'Penanda Tangan berhasil dihapus');
  })
);

// ============================================================
// Public Routes (No Auth)
// ============================================================

/**
 * GET /api/public/verify/:token - Verify document by token (public)
 */
router.get(
  '/public/verify/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const dokumen = await instanDokumenService.findByVerificationToken(token);

    if (!dokumen) {
      throw ApiError.notFound('Dokumen tidak ditemukan');
    }

    if (dokumen.status === 'REVOKED') {
      return res.status(400).json({
        success: false,
        message: 'Dokumen ini telah dicabut (Revoked).',
        data: {
          nomorDokumen: dokumen.nomorDokumen,
          status: dokumen.status,
          judul: dokumen.judul
        }
      });
    }

    return response.success(res, {
      nomorDokumen: dokumen.nomorDokumen,
      judul: dokumen.judul,
      tujuan: dokumen.tujuan,
      status: dokumen.status,
      generatedAt: dokumen.generatedAt,
      signedAt: dokumen.signedAt,
      fileUrl: dokumen.fileUrl,
      signature: dokumen.signature ? {
        penandatangan: dokumen.signature.penandatangan?.nama,
        jabatan: dokumen.signature.penandatangan?.jabatan
      } : null
    }, 'Verifikasi Dokumen');
  })
);

// ============================================================
// Document Generation Routes (Phase 4.5)
// ============================================================

/**
 * POST /api/documents/generate
 * Generate a document from template with PDF
 */
router.post(
  '/generate',
  authenticateInternal(),
  authorize('document.generate'),
  asyncHandler(async (req, res) => {
    const { templateVersionId, context, judul, permintaanId } = req.body;

    if (!templateVersionId) {
      throw ApiError.badRequest('templateVersionId wajib diisi');
    }

    if (!context || typeof context !== 'object') {
      throw ApiError.badRequest('context wajib diisi');
    }

    if (!judul || typeof judul !== 'string') {
      throw ApiError.badRequest('judul wajib diisi');
    }

    const result = await documentEngineService.generateDocument({
      templateVersionId: BigInt(templateVersionId),
      context: context as BindingContext,
      judul,
      permintaanId: permintaanId ? BigInt(permintaanId) : undefined,
      generatePdf: true,
    });

    return response.created(res, result, 'Dokumen berhasil dibuat');
  })
);

/**
 * POST /api/documents/generate/preview
 * Generate document preview (no storage)
 */
router.post(
  '/generate/preview',
  authenticateInternal(),
  authorize('document.generate'),
  asyncHandler(async (req, res) => {
    const { templateVersionId, context } = req.body;

    if (!templateVersionId) {
      throw ApiError.badRequest('templateVersionId wajib diisi');
    }

    // Load template
    const version = await templateVersionService.findByIdWithRelations(BigInt(templateVersionId));
    if (!version) {
      throw ApiError.notFound('Template versi tidak ditemukan');
    }

    // Validate for generation
    const validation = await documentEngineService.validateForGeneration(BigInt(templateVersionId));
    if (!validation.valid) {
      throw ApiError.validation('Template tidak valid untuk generate', validation.errors);
    }

    // Generate preview PDF
    try {
      const pdfBuffer = await documentEngineService.generatePdfFromContent(
        version.content as Record<string, unknown>,
        context as BindingContext,
        version.kopConfig as Record<string, unknown>,
        version.signatureConfig as Record<string, unknown>
      );

      // Return as base64
      const base64 = pdfBuffer.toString('base64');

      return response.success(res, {
        pdf: base64,
        validation,
        format: 'base64',
      }, 'Preview berhasil dibuat');
    } catch (error) {
      console.error('Preview generation failed:', error);
      throw ApiError.internal('Gagal membuat preview');
    }
  })
);

/**
 * POST /api/documents/validate
 * Validate template for generation
 */
router.post(
  '/validate',
  authenticateInternal(),
  authorize('document.generate'),
  asyncHandler(async (req, res) => {
    const { templateVersionId } = req.body;

    if (!templateVersionId) {
      throw ApiError.badRequest('templateVersionId wajib diisi');
    }

    const validation = await documentEngineService.validateForGeneration(BigInt(templateVersionId));
    return response.success(res, validation, 'Validasi Template');
  })
);

/**
 * POST /api/documents/:id/sign
 * Sign a document
 */
router.post(
  '/:id/sign',
  authenticateInternal(),
  authorize('document.sign'),
  asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const { penandatanganId, tandaTanganUrl } = req.body;

    if (!penandatanganId) {
      throw ApiError.badRequest('penandatanganId wajib diisi');
    }

    const document = await instanDokumenService.findById(id);
    if (!document) {
      throw ApiError.notFound('Dokumen tidak ditemukan');
    }

    // Check if already signed
    if (document.signature) {
      throw ApiError.conflict('Dokumen sudah ditandatangani');
    }

    // Create signature record
    await prisma.dokumenSignature.create({
      data: {
        dokumenId: id,
        penandatanganId: BigInt(penandatanganId),
        tandaTanganUrl: tandaTanganUrl,
        tandaTanganType: 'IMAGE',
      },
    });

    // Update document status
    await instanDokumenService.updateStatus(id, 'SIGNED');

    const updated = await instanDokumenService.findById(id);
    return response.success(res, updated, 'Dokumen berhasil ditandatangani');
  })
);

export default router;
