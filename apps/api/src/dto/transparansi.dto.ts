import { z } from 'zod';

export const createApbdesSchema = z.object({
  tahun: z.coerce.number().int().min(2000).max(2100),
  totalPendapatan: z.coerce.number().min(0).default(0),
  totalBelanja: z.coerce.number().min(0).default(0),
  totalPembiayaan: z.coerce.number().min(0).default(0),
  isAktif: z.boolean().default(true),
  dokumenUrl: z.string().url().max(500).optional().nullable(),
});

export const updateApbdesSchema = createApbdesSchema.partial();

export const queryApbdesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tahun: z.coerce.number().int().optional(),
  isAktif: z.enum(['true', 'false']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

export type CreateApbdesInput = z.infer<typeof createApbdesSchema>;
export type UpdateApbdesInput = z.infer<typeof updateApbdesSchema>;
export type QueryApbdesInput = z.infer<typeof queryApbdesSchema>;
