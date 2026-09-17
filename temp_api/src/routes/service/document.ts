import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { ApiError } from '../../utils/response.js';
import { Router, Request } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';
import { setPinRateLimiter } from '../../middleware/rate-limiter.middleware.js';
import {
  dokumenDefinitionService,
  templateSuratService,
  templateVersionService,
  instanDokumenService,
  penandaTanganService,
} from '../../services/dokumen.service.js';
import { documentEngineService } from '../../services/document-engine.service.js';
import { notificationService } from '../../services/notification.service.js';
import { config } from '../../config/index.js';
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
  createDokumenSignatureSchema,
  idParamSchema,
} from '../../dto/service-document.dto.js';
import { validateTemplateBindings, BindingContext } from '../../utils/binding-resolver.js';

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
  '/:id(\\d+)',
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
  '/:id(\\d+)',
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

    let downloadUrl = dokumen.fileUrl;
    if (dokumen.fileUrl && dokumen.fileUrl.includes('/uploads/')) {
      const { generateDocumentAccessToken } = await import('../../utils/doc-token.js');
      const docPath = dokumen.fileUrl.split('/uploads/')[1];
      if (docPath) {
        const token = generateDocumentAccessToken(docPath, 15, 'download');
        const sep = dokumen.fileUrl.includes('?') ? '&' : '?';
        downloadUrl = `${dokumen.fileUrl}${sep}doc_token=${token}`;
      }
    }

    return response.success(res, { ...dokumen, downloadUrl }, 'Detail Dokumen');
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
  ['/signatories', '/penanda-tangan'],
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
  ['/signatories/:id', '/penanda-tangan/:id'],
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
  ['/signatories', '/penanda-tangan'],
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
  ['/signatories/:id', '/penanda-tangan/:id'],
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
 * POST /api/signatories/:id/set-pin - Self-service PIN setting by the authenticated official
 */
router.post(
  ['/signatories/:id/set-pin', '/penanda-tangan/:id/set-pin'],
  authenticateInternal(),
  authorize('document.sign'),
  setPinRateLimiter,
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const callerAccountId = req.user?.accountId;
    if (!callerAccountId) {
      throw ApiError.unauthorized('Sesi pengguna tidak valid');
    }

    const { pin, oldPin } = z.object({
      pin: z.string().min(4, 'PIN minimal 4 angka/karakter').max(32),
      oldPin: z.string().optional(),
    }).parse(req.body);

    const signatory = await penandaTanganService.findById(BigInt(id));
    if (!signatory) {
      throw ApiError.notFound('Profil penanda tangan tidak ditemukan');
    }

    // Official must be authorized as this signatory or be an admin/developer
    const isSuperAdmin = req.user?.roles?.some(r => r === 'ADMIN' || r === 'DEVELOPER');
    if (signatory.accountId && signatory.accountId !== callerAccountId && !isSuperAdmin) {
      throw ApiError.forbidden('Anda hanya dapat mengatur PIN untuk profil pejabat Anda sendiri');
    }

    // If signatory already has a PIN and caller is setting a new PIN (and not admin override), verify old PIN
    if (signatory.pinHash && !isSuperAdmin) {
      if (!oldPin) {
        throw ApiError.badRequest('PIN lama wajib disertakan untuk perubahan PIN');
      }
      const isOldPinValid = await bcrypt.compare(oldPin, signatory.pinHash);
      if (!isOldPinValid) {
        throw ApiError.unauthorized('PIN lama tidak cocok');
      }
    }

    // Update with new hashed PIN and link to caller's account if not linked
    const updated = await penandaTanganService.update(BigInt(id), {
      pin,
      accountId: signatory.accountId || callerAccountId,
    });

    return response.success(res, { id: updated.id.toString(), nama: updated.nama, hasPin: true }, 'PIN penandatangan berhasil diatur secara mandiri');
  })
);

/**
 * DELETE /api/signatories/:id - Delete signatory
 */
router.delete(
  ['/signatories/:id', '/penanda-tangan/:id'],
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

    let pemohon: { nama?: string; nik?: string } = {};
    const rawData = dokumen.dataSnapshot as Record<string, unknown> | null;
    if (rawData && typeof rawData === 'object') {
      const nikRaw = Object.values(rawData).find(v => typeof v === 'string' && /^\d{16}$/.test(v)) as string;
      if (nikRaw) {
        pemohon.nik = `${nikRaw.substring(0, 4)}********${nikRaw.substring(12)}`;
      }
      const nameKey = Object.keys(rawData).find(k => k.toLowerCase().includes('nama'));
      if (nameKey) {
        const nameRaw = rawData[nameKey];
        if (typeof nameRaw === 'string') {
          pemohon.nama = nameRaw;
        }
      }
    }

    const pt = dokumen.signature?.penandatangan;
    const rawFoto = (pt as any)?.account?.perangkatDesa?.fotoUrl || null;
    let signatoryFotoUrl = rawFoto;
    if (rawFoto && !rawFoto.startsWith('http://') && !rawFoto.startsWith('https://')) {
      const apiBase = config.apiUrl || 'http://localhost:3001';
      signatoryFotoUrl = `${apiBase.replace(/\/$/, '')}${rawFoto.startsWith('/') ? '' : '/'}${rawFoto}`;
    }

    const penandatanganData = pt ? {
      nama: pt.nama,
      jabatan: pt.jabatan,
      nip: pt.nip || undefined,
      fotoUrl: signatoryFotoUrl,
    } : null;

    return response.success(res, {
      nomorDokumen: dokumen.nomorDokumen,
      jenisSurat: dokumen.dokumen?.nama || dokumen.judul,
      layanan: dokumen.dokumen?.layanan?.nama || 'Pelayanan Umum',
      tanggal: (dokumen.signedAt || dokumen.createdAt)?.toISOString(),
      judul: dokumen.judul,
      tujuan: dokumen.tujuan,
      status: dokumen.status,
      generatedAt: dokumen.generatedAt,
      signedAt: dokumen.signedAt,
      fileUrl: dokumen.fileUrl,
      pemohon,
      penandatangan: penandatanganData,
      signature: pt ? {
        penandatangan: pt.nama,
        jabatan: pt.jabatan
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
    const { penandatanganId, tandaTanganUrl, pin } = createDokumenSignatureSchema.parse(req.body);

    const callerAccountId = req.user?.accountId;
    if (!callerAccountId) {
      throw ApiError.unauthorized('Sesi pengguna tidak valid');
    }

    const document = await instanDokumenService.findById(id);
    if (!document) {
      throw ApiError.notFound('Dokumen tidak ditemukan');
    }

    // Check if already signed
    if (document.signature) {
      throw ApiError.conflict('Dokumen sudah ditandatangani');
    }

    // MIS-07 / GAP-06: Verify Signatory existence and active status
    const penandatangan = await prisma.penandaTangan.findUnique({
      where: { id: BigInt(penandatanganId) },
    });
    if (!penandatangan || !penandatangan.isActive) {
      throw ApiError.badRequest('Pejabat penandatangan tidak valid atau tidak aktif');
    }

    // MIS-07 / GAP-06: Verify Account Association
    if (penandatangan.accountId && penandatangan.accountId !== callerAccountId) {
      throw ApiError.forbidden(
        'Anda tidak memiliki otorisasi untuk menandatangani dokumen atas nama pejabat ini (akun login tidak sesuai)'
      );
    }

    // MIS-07 / GAP-06: Verify Personal PIN if configured for this signatory
    if (penandatangan.pinHash) {
      if (!pin) {
        throw ApiError.badRequest('PIN personal pejabat penandatangan wajib diisi');
      }
      const isPinValid = await bcrypt.compare(pin, penandatangan.pinHash);
      if (!isPinValid) {
        throw ApiError.unauthorized('PIN personal penandatangan salah');
      }
    }

    const effectiveSignatureUrl = tandaTanganUrl || penandatangan.tandaTanganUrl;
    if (!effectiveSignatureUrl) {
      throw ApiError.badRequest('Gambar tanda tangan pejabat belum diset');
    }

    // Create signature record
    await prisma.dokumenSignature.create({
      data: {
        dokumenId: id,
        penandatanganId: BigInt(penandatanganId),
        tandaTanganUrl: effectiveSignatureUrl,
        tandaTanganType: 'IMAGE',
      },
    });

    // Update document status
    await instanDokumenService.updateStatus(id, 'SIGNED');

    // Regenerate PDF with signature stamp if template and content snapshot exist
    try {
      const fullDoc = await prisma.instanDokumen.findUnique({
        where: { id },
        include: {
          templateVersion: {
            include: {
              template: {
                include: { blanko: true },
              },
            },
          },
        },
      });

      if (fullDoc && fullDoc.contentSnapshot && fullDoc.dataSnapshot) {
        const { getStorageProvider } = await import('../../services/storage/index.js');
        const storage = getStorageProvider();

        const pdfBuffer = await documentEngineService.generatePdfFromContent(
          fullDoc.contentSnapshot,
          fullDoc.dataSnapshot as Record<string, unknown>,
          fullDoc.templateVersion?.kopConfig as Record<string, unknown> | undefined,
          fullDoc.templateVersion?.signatureConfig as Record<string, unknown> | undefined,
          fullDoc.templateVersion?.template?.blanko,
          {
            signatureImageUrl: effectiveSignatureUrl || undefined,
            verificationToken: fullDoc.verificationToken || undefined,
            nomorDokumen: fullDoc.nomorDokumen,
            judul: fullDoc.judul,
          }
        );

        const randomSuffix = crypto.randomUUID();
        const safeSlug = fullDoc.nomorDokumen.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const oldFileUrl = fullDoc.fileUrl;

        const storageFile = await storage.upload(pdfBuffer, {
          folder: 'documents',
          filename: `${safeSlug}-${randomSuffix}-signed.pdf`,
          contentType: 'application/pdf',
        });

        try {
          await prisma.instanDokumen.update({
            where: { id },
            data: { fileUrl: storageFile.url },
          });
        } catch (dbUpdateErr) {
          // Rollback newly uploaded file on database failure to prevent orphaned storage
          await storage.delete(storageFile.key).catch((delErr) => {
            console.error('Failed to rollback orphaned signed file after DB update failure:', delErr);
          });
          throw dbUpdateErr;
        }

        // Clean up old draft/unsigned file from storage if present
        if (oldFileUrl && oldFileUrl.includes('/uploads/')) {
          const oldKey = oldFileUrl.split('/uploads/')[1];
          if (oldKey) {
            await storage.delete(oldKey).catch((delErr) => {
              console.warn('Failed to cleanup old unsigned PDF:', delErr);
            });
          }
        }
      }
    } catch (pdfErr) {
      console.error('Failed to regenerate signed PDF:', pdfErr);
    }

    const updated = await instanDokumenService.findById(id);

    // MIS-03 / GAP-02: Non-blocking WhatsApp Notification
    if (updated?.permintaan?.id) {
      try {
        const reqItem = await prisma.permintaanLayanan.findUnique({
          where: { id: updated.permintaan.id },
          include: { penduduk: true },
        });
        if (reqItem?.penduduk?.telepon) {
          const baseUrl = config.publicWebUrl;
          const verifyUrl = `${baseUrl.replace(/\/+$/, '')}/verifikasi/${updated.verificationToken || ''}`;
          void notificationService.notifyDocumentSigned(
            reqItem.penduduk.telepon,
            updated.nomorDokumen,
            verifyUrl
          ).catch((waErr) => console.error('Gagal kirim notifikasi WA dokumen ditandatangani:', waErr));
        }
      } catch (waErr) {
        console.warn('Gagal memproses notifikasi WA dokumen signed:', waErr);
      }
    }

    return response.success(res, updated, 'Dokumen berhasil ditandatangani');
  })
);

/**
 * POST /api/documents/:id/revoke
 * Revoke an official document with mandatory audit reason
 */
router.post(
  '/:id/revoke',
  authenticateInternal(),
  authorize('document.sign', 'document.generate'),
  asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const { reason } = z.object({
      reason: z.string().min(5, 'Alasan pencabutan minimal 5 karakter'),
    }).parse(req.body);

    const callerAccountId = req.user?.accountId;
    const document = await instanDokumenService.findById(id);
    if (!document) {
      throw ApiError.notFound('Dokumen tidak ditemukan');
    }

    if (document.status === 'REVOKED') {
      throw ApiError.badRequest('Dokumen ini sudah dalam status dicabut (REVOKED)');
    }

    // Update document status to REVOKED
    const updated = await prisma.instanDokumen.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    // Create immutable audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'document',
        entityId: id,
        action: 'UPDATE',
        actorId: callerAccountId ? BigInt(callerAccountId) : undefined,
        actorType: 'USER',
        reason: `Pencabutan Dokumen Resmi: ${reason}`,
        beforeData: { status: document.status },
        afterData: { status: 'REVOKED', reason },
        metadata: {
          nomorDokumen: document.nomorDokumen,
          revokedAt: new Date().toISOString(),
          reason,
        },
      },
    });

    // Notify citizen if linked to request
    if (document.permintaan?.id) {
      try {
        const reqItem = await prisma.permintaanLayanan.findUnique({
          where: { id: document.permintaan.id },
          include: { penduduk: true, layanan: true },
        });
        if (reqItem?.penduduk?.telepon) {
          void notificationService.sendWhatsApp(
            reqItem.penduduk.telepon,
            `*Pemberitahuan Pencabutan Dokumen*\n\n` +
            `Surat resmi dengan nomor *${document.nomorDokumen}* telah *DICABUT* oleh pemerintah desa.\n\n` +
            `*Alasan:* ${reason}\n\n` +
            `Dokumen tersebut kini sudah tidak berlaku lagi.\n\n` +
            `Terima kasih,\n*Pemerintah Desa*`
          ).catch((waErr) => console.error('Gagal kirim notifikasi WA pencabutan dokumen:', waErr));
        }
      } catch (waErr) {
        console.warn('Gagal memproses notifikasi WA pencabutan:', waErr);
      }
    }

    return response.success(res, updated, 'Dokumen berhasil dicabut');
  })
);

// ============================================================
// Export Routes
// ============================================================

/**
 * GET /api/documents/export/register
 * Export document register to XLSX
 */
router.get(
  '/export/register',
  authenticateInternal(),
  authorize('document.view'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, layananId, status, format = 'xlsx' } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      layananId: layananId ? BigInt(layananId as string) : undefined,
      status: status as string | undefined,
      format: format as 'xlsx' | 'csv',
    };

    const { exportDokumenRegisterXlsx, exportDokumenRegisterCsv } = await import(
      '../../services/export-register.service.js'
    );

    const filename = `register-dokumen-${new Date().toISOString().split('T')[0]}`;

    if (options.format === 'csv') {
      const csv = await exportDokumenRegisterCsv(options);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    } else {
      const xlsx = await exportDokumenRegisterXlsx(options);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(xlsx);
    }
  })
);

/**
 * GET /api/documents/export/permintaan
 * Export service request register to XLSX
 */
router.get(
  '/export/permintaan',
  authenticateInternal(),
  authorize('document.view'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, layananId, status, format = 'xlsx' } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      layananId: layananId ? BigInt(layananId as string) : undefined,
      status: status as string | undefined,
      format: format as 'xlsx' | 'csv',
    };

    const { exportPermintaanRegisterXlsx } = await import(
      '../../services/export-register.service.js'
    );

    const filename = `register-permintaan-${new Date().toISOString().split('T')[0]}`;

    const xlsx = await exportPermintaanRegisterXlsx(options);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(xlsx);
  })
);

export default router;
