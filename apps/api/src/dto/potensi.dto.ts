import { z } from 'zod';

export const createPotensiSchema = z.object({
  nama: z.string().min(3).max(255),
  deskripsi: z.string().min(10),
  kategori: z.string().min(2).max(100),
  gambarUrl: z.string().url().optional().or(z.literal('')),
  lokasi: z.string().max(255).optional().or(z.literal('')),
  kontak: z.string().max(50).optional().or(z.literal('')),
  isAktif: z.boolean().default(true),
});

export const updatePotensiSchema = createPotensiSchema.partial();

export const queryPotensiSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  kategori: z.string().optional(),
  isAktif: z.enum(['true', 'false']).optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
});

export type CreatePotensiInput = z.infer<typeof createPotensiSchema>;
export type UpdatePotensiInput = z.infer<typeof updatePotensiSchema>;
export type QueryPotensiInput = z.infer<typeof queryPotensiSchema>;
