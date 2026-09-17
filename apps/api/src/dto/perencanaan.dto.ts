import { z } from 'zod';

export const rpjmdesSchema = z.object({
  periode: z.string().min(1, 'Periode wajib diisi'),
  visi: z.string().min(1, 'Visi wajib diisi'),
  misi: z.string().min(1, 'Misi wajib diisi'),
  status: z.enum(['DRAFT', 'AKTIF', 'SELESAI']).default('DRAFT'),
});

export const rpjmdesBidangSchema = z.object({
  namaBidang: z.string().min(1, 'Nama Bidang wajib diisi'),
});

export const rkpdesSchema = z.object({
  rpjmdesBidangId: z.string().or(z.number()).transform(v => BigInt(v)),
  tahun: z.number().int().positive('Tahun harus valid'),
  namaKegiatan: z.string().min(1, 'Nama Kegiatan wajib diisi'),
  lokasi: z.string().optional(),
  perkiraanBiaya: z.number().min(0, 'Perkiraan biaya tidak boleh negatif').default(0),
  apbdesItemId: z.string().or(z.number()).transform(v => BigInt(v)).optional(),
});

export type CreateRpjmdesInput = z.infer<typeof rpjmdesSchema>;
export type UpdateRpjmdesInput = Partial<CreateRpjmdesInput>;
export type CreateRpjmdesBidangInput = z.infer<typeof rpjmdesBidangSchema>;
export type UpdateRpjmdesBidangInput = Partial<CreateRpjmdesBidangInput>;
export type CreateRkpdesInput = z.infer<typeof rkpdesSchema>;
export type UpdateRkpdesInput = Partial<CreateRkpdesInput>;

// Input for filtering/querying RPJMDes
export const queryRpjmdesSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.string().optional(),
});
export type QueryRpjmdesInput = z.infer<typeof queryRpjmdesSchema>;
