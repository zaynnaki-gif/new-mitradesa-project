import { z } from 'zod';

export const createKasUmumSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  jenis: z.enum(['KAS_MASUK', 'KAS_KELUAR']),
  uraian: z.string().min(1, 'Uraian wajib diisi').max(500),
  jumlah: z.coerce.number().positive('Jumlah harus lebih dari 0'),
  kodeRekening: z.string().max(50).optional().nullable(),
  apbdesItemId: z.union([z.bigint(), z.number(), z.string().regex(/^\d+$/).transform(s => BigInt(s))]).optional().nullable(),
});

export const updateKasUmumSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  jenis: z.enum(['KAS_MASUK', 'KAS_KELUAR']).optional(),
  uraian: z.string().min(1).max(500).optional(),
  jumlah: z.coerce.number().positive().optional(),
  kodeRekening: z.string().max(50).optional().nullable(),
  apbdesItemId: z.union([z.bigint(), z.number(), z.string().regex(/^\d+$/).transform(s => BigInt(s))]).optional().nullable(),
});

export const queryKasUmumSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tahun: z.coerce.number().int().optional(),
  bulan: z.coerce.number().int().min(1).max(12).optional(),
  jenis: z.enum(['KAS_MASUK', 'KAS_KELUAR']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateKasUmumInput = z.infer<typeof createKasUmumSchema>;
export type UpdateKasUmumInput = z.infer<typeof updateKasUmumSchema>;
export type QueryKasUmumInput = z.infer<typeof queryKasUmumSchema>;
