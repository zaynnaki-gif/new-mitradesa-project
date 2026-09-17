import { z } from 'zod';

export const createUmkmSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  kategori: z.string().min(1, 'Kategori wajib diisi').max(100),
  gambarUrl: z.string().url().max(500).optional().nullable(),
  harga: z.string().max(100).optional().nullable(),
  kontak: z.string().min(1, 'Kontak wajib diisi').max(50),
  pemilik: z.string().min(1, 'Pemilik wajib diisi').max(100),
  isAktif: z.boolean().default(true),
});

export const updateUmkmSchema = createUmkmSchema.partial();

export const queryUmkmSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  kategori: z.string().optional(),
  isAktif: z.enum(['true', 'false']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

export type CreateUmkmInput = z.infer<typeof createUmkmSchema>;
export type UpdateUmkmInput = z.infer<typeof updateUmkmSchema>;
export type QueryUmkmInput = z.infer<typeof queryUmkmSchema>;
