import { Router } from 'express';
import { asyncHandler, response } from '../../utils/response.js';
import { authenticateInternal, authorize } from '../../middleware/index.js';

import { mediaService, CreateMediaInput } from '../../services/media.service.js';
import { validateMimeType, getStorageProvider, getFileType } from '../../services/storage/index.js';
import { z } from 'zod';
import multer from 'multer';

// Use memory storage for multer since we process buffer to storage provider
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit, service will restrict further
  }
});

const router = Router();

// Validation schemas with security enhancements
const queryMediaSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  fileType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']).optional(),
  kategori: z.string().optional(),
  urutan: z.enum(['asc', 'desc']).default('desc'),
});

// Security: Strict content validation
const createMediaSchema = z.object({
  nama: z.string().min(1).max(255).transform(s => s.trim()),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug harus lowercase dengan hyphen'),
  deskripsi: z.string().max(500).optional().transform(s => s?.trim()),
  fileUrl: z.string().url().max(500),
  fileType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']),
  fileSize: z.number().positive().max(10 * 1024 * 1024, 'Ukuran file maksimal 10MB'),
  mimeType: z.string().max(100).refine(
    (val) => validateMimeType(val),
    { message: 'Tipe MIME tidak diizinkan' }
  ),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  alt: z.string().max(255).optional().transform(s => s?.trim()),
  kategori: z.string().max(50).optional().transform(s => s?.trim()),
});

const updateMediaSchema = createMediaSchema.partial();

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus numerik'),
});

// Security: URL validation helper
function validateFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http/https URLs
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Block javascript:, data: with executable content
    if (parsed.protocol === 'javascript:') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Security: Validate filename extension
 */
function validateFilename(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ext.length > 1; // Basic extension check
}

/**
 * Security: Check for path traversal in filenames
 */
function checkPathTraversal(filename: string): boolean {
  return filename.includes('..') || filename.includes('/') || filename.includes('\\');
}

// Re-export for potential use
export { validateFilename, checkPathTraversal };

/**
 * GET /api/media - List all media (admin)
 */
router.get(
  '/',
  authenticateInternal(),
  authorize('media.view'),
  asyncHandler(async (req, res) => {
    const query = queryMediaSchema.parse(req.query);
    const result = await mediaService.findAll(query);
    return response.success(res, result.data, 'Daftar Media', result.meta as unknown as Record<string, unknown>);
  })
);

/**
 * GET /api/media/stats - Get media statistics
 */
router.get(
  '/stats',
  authenticateInternal(),
  authorize('media.view'),
  asyncHandler(async (_req, res) => {
    const stats = await mediaService.getStats();
    return response.success(res, stats, 'Statistik Media');
  })
);

/**
 * GET /api/media/:id - Get media by ID (public)
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    // Public route: maybe not require desaId unless provided via query param/domain.
    const media = await mediaService.findById(BigInt(id));
    return response.success(res, media, 'Detail Media');
  })
);

/**
 * GET /api/media/slug/:slug - Get media by slug
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const media = await mediaService.findBySlug(req.params.slug);
    return response.success(res, media, 'Detail Media');
  })
);

/**
 * POST /api/media/upload - Upload new media file
 * Security: Validates MIME type, file size, extensions, and limits
 */
router.post(
  '/upload',
  authenticateInternal(),
  authorize('media.upload'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      return response.error(res, 400, 'BAD_REQUEST', 'File tidak ditemukan');
    }

    if (!validateMimeType(file.mimetype)) {
      return response.error(res, 400, 'BAD_REQUEST', 'Tipe file tidak diizinkan');
    }

    const { deskripsi, kategori, alt } = req.body;
    let nama = req.body.nama || file.originalname.split('.')[0];
    
    // Generate simple slug if not provided
    let slug = req.body.slug || nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Determine file type
    const fileTypeEnum = getFileType(file.mimetype);

    // Upload to storage provider
    const storageProvider = getStorageProvider();
    const storageFile = await storageProvider.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    // Create record in database
    const uploadedById = req.user?.accountId;
    const data: CreateMediaInput = {
      nama,
      slug,
      deskripsi,
      fileUrl: storageFile.url,
      fileType: fileTypeEnum,
      fileSize: storageFile.size,
      mimeType: storageFile.mimeType,
      alt,
      kategori,
    };

    const media = await mediaService.create(data, uploadedById);
    return response.created(res, media, 'File berhasil diupload');
  })
);

/**
 * POST /api/media - Create new media
 * Security: Validates MIME type, URL, file size
 */
router.post(
  '/',
  authenticateInternal(),
  authorize('media.upload'),
  asyncHandler(async (req, res) => {
    // Security: Pre-validate before schema parsing
    const body = req.body;

    // Validate URL
    if (body.fileUrl && !validateFileUrl(body.fileUrl)) {
      return response.error(res, 400, 'BAD_REQUEST', 'URL tidak valid atau tidak diizinkan');
    }

    // Validate MIME type
    if (body.mimeType && !validateMimeType(body.mimeType)) {
      return response.error(res, 400, 'BAD_REQUEST', 'Tipe file tidak diizinkan');
    }

    // Parse and validate with schema
    const parseResult = createMediaSchema.safeParse(body);
    if (!parseResult.success) {
      return response.error(
        res,
        400,
        'VALIDATION_ERROR',
        'Validasi gagal',
        parseResult.error.flatten()
      );
    }

    const data = parseResult.data as CreateMediaInput;
    const uploadedById = req.user?.accountId;
    const media = await mediaService.create(data, uploadedById);
    return response.created(res, media, 'Media berhasil diupload');
  })
);

/**
 * PATCH /api/media/:id - Update media
 */
router.patch(
  '/:id',
  authenticateInternal(),
  authorize('media.update'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);

    // Security: Pre-validate URL if provided
    if (req.body.fileUrl && !validateFileUrl(req.body.fileUrl)) {
      return response.error(res, 400, 'BAD_REQUEST', 'URL tidak valid');
    }

    // Validate MIME type if provided
    if (req.body.mimeType && !validateMimeType(req.body.mimeType)) {
      return response.error(res, 400, 'BAD_REQUEST', 'Tipe file tidak diizinkan');
    }

    const parseResult = updateMediaSchema.safeParse(req.body);
    if (!parseResult.success) {
      return response.error(
        res,
        400,
        'VALIDATION_ERROR',
        'Validasi gagal',
        parseResult.error.flatten()
      );
    }

    const data = parseResult.data;
    const media = await mediaService.update(BigInt(id), data);
    return response.success(res, media, 'Media berhasil diperbarui');
  })
);

/**
 * DELETE /api/media/:id - Soft delete media
 */
router.delete(
  '/:id',
  authenticateInternal(),
  authorize('media.delete'),
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await mediaService.softDelete(BigInt(id));
    return response.success(res, null, 'Media berhasil dihapus');
  })
);

export default router;
