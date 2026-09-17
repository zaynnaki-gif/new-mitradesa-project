import { z } from 'zod';

export const createBansosSchema = z.object({
  nama: z.string().min(1).max(255),
  jenis: z.string().min(1).max(100),
  tahun: z.number().int().positive().min(2000).max(2100),
  periode: z.string().max(50).optional(),
  jumlahPenerima: z.number().int().nonnegative().default(0),
  jumlahDana: z.number().nonnegative().default(0),
});

export const updateBansosSchema = createBansosSchema.partial();

export const queryBansosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  tahun: z.coerce.number().int().optional(),
  jenis: z.string().optional(),
});

export const addPenerimaSchema = z.object({
  pendudukId: z.string().optional(),
  keluargaId: z.string().optional(),
  statusPenerimaan: z.enum(['MENUNGGU', 'DITERIMA', 'DIBATALKAN']).default('MENUNGGU'),
  tanggalDiterima: z.string().datetime().optional(),
}).refine(data => data.pendudukId || data.keluargaId, {
  message: "Penerima harus berupa individu (pendudukId) atau keluarga (keluargaId)",
});

export const updatePenerimaSchema = z.object({
  statusPenerimaan: z.enum(['MENUNGGU', 'DITERIMA', 'DIBATALKAN']),
  tanggalDiterima: z.string().datetime().nullable().optional(),
});

export const idParamSchema = z.object({ id: z.string() });
export const bigintIdParamSchema = z.object({ id: z.string().transform((val) => BigInt(val)) });

