import { z } from 'zod';

// ============================================================
// Kategori Schemas
// ============================================================

export const createKategoriSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  slug: z.string().min(1, 'Slug wajib diisi').max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  deskripsi: z.string().max(500).optional(),
  ikon: z.string().max(50).optional(),
  warna: z.string().max(20).optional(),
  urutan: z.number().int().min(0).default(0),
  isAktif: z.boolean().default(true),
});

export const updateKategoriSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip').optional(),
  deskripsi: z.string().max(500).optional().nullable(),
  ikon: z.string().max(50).optional().nullable(),
  warna: z.string().max(20).optional().nullable(),
  urutan: z.number().int().min(0).optional(),
  isAktif: z.boolean().optional(),
});

export const queryKategoriSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isAktif: z.enum(['true', 'false']).optional(),
 urutan: z.enum(['asc', 'desc']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

export type CreateKategoriInput = z.infer<typeof createKategoriSchema>;
export type UpdateKategoriInput = z.infer<typeof updateKategoriSchema>;
export type QueryKategoriInput = z.infer<typeof queryKategoriSchema>;

// ============================================================
// Berita Schemas
// ============================================================

export const createBeritaSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  excerpt: z.string().max(500).optional(),
  konten: z.string().min(1, 'Konten wajib diisi'),
  gambarUrl: z.string().url().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  kategoriId: z.number().int().positive().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDeskripsi: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(255).optional().nullable(),
  ogImageUrl: z.string().url().max(500).optional().nullable(),
});

export const updateBeritaSchema = z.object({
  judul: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9--]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip').optional(),
  excerpt: z.string().max(500).optional().nullable(),
  konten: z.string().min(1).optional(),
  gambarUrl: z.string().url().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  kategoriId: z.number().int().positive().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDeskripsi: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(255).optional().nullable(),
  ogImageUrl: z.string().url().max(500).optional().nullable(),
});

export const queryBeritaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  kategoriId: z.coerce.number().int().positive().optional(),
  penulisId: z.coerce.number().int().positive().optional(),
 urutan: z.enum(['asc', 'desc']).optional(),
});

// ============================================================
// Halaman Schemas
// ============================================================

export const createHalamanSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  konten: z.string().min(1, 'Konten wajib diisi'),
  excerpt: z.string().max(500).optional(),
  gambarUrl: z.string().url().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDeskripsi: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(255).optional().nullable(),
  urutan: z.number().int().min(0).default(0),
  isMenu: z.boolean().default(false),
});

export const updateHalamanSchema = z.object({
  judul: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip').optional(),
  konten: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  gambarUrl: z.string().url().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDeskripsi: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(255).optional().nullable(),
  urutan: z.number().int().min(0).optional(),
  isMenu: z.boolean().optional(),
});

export const queryHalamanSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isMenu: z.enum(['true', 'false']).optional(),
  urutan: z.enum(['asc', 'desc']).optional(),
});

// ============================================================
// Media Schemas
// ============================================================

export const createMediaSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  deskripsi: z.string().max(500).optional(),
  fileUrl: z.string().url().max(500),
  fileType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(100),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  alt: z.string().max(255).optional().nullable(),
  kategori: z.string().max(50).optional().nullable(),
});

export const updateMediaSchema = z.object({
  nama: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip').optional(),
  deskripsi: z.string().max(500).optional().nullable(),
  alt: z.string().max(255).optional().nullable(),
  kategori: z.string().max(50).optional().nullable(),
});

export const queryMediaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  fileType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']).optional(),
  kategori: z.string().optional(),
});

// Export types for services
export type CreateBeritaInput = z.infer<typeof createBeritaSchema>;
export type UpdateBeritaInput = z.infer<typeof updateBeritaSchema>;
export type QueryBeritaInput = z.infer<typeof queryBeritaSchema>;
export type CreateHalamanInput = z.infer<typeof createHalamanSchema>;
export type UpdateHalamanInput = z.infer<typeof updateHalamanSchema>;
export type QueryHalamanInput = z.infer<typeof queryHalamanSchema>;
export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type QueryMediaInput = z.infer<typeof queryMediaSchema>;
