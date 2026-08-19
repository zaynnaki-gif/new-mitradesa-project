import { z } from 'zod';

/**
 * Zod schemas for Keluarga domain
 * Uses BIGINT for all IDs (not NIK)
 * Validates transaction atomicity requirements
 */

// ============================================
// NO KK Validation - exactly 16 digits
// ============================================
const noKkSchema = z
  .string()
  .length(16, 'Nomor KK harus 16 digit')
  .regex(/^\d{16}$/, 'Nomor KK harus 16 digit numerik');

// ============================================
// Create Keluarga
// ============================================
export const createKeluargaSchema = z.object({
  noKk: noKkSchema,
  kepalaId: z.string().regex(/^\d+$/, 'Kepala ID harus angka').transform(s => BigInt(s)),
  alamat: z.string().optional(),
  rt: z.string().max(10).optional(),
  rw: z.string().max(10).optional(),
  dusun: z.string().max(100).optional(),
  kodePos: z.string().max(10).optional(),
  hubunganKepala: z.string().max(50).default('KEPALA'),
});

// ============================================
// Update Keluarga
// ============================================
export const updateKeluargaSchema = z.object({
  noKk: noKkSchema.optional(),
  kepalaId: z.string().regex(/^\d+$/, 'Kepala ID harus angka').transform(s => BigInt(s)).optional(),
  alamat: z.string().optional(),
  rt: z.string().max(10).optional(),
  rw: z.string().max(10).optional(),
  dusun: z.string().max(100).optional(),
  kodePos: z.string().max(10).optional(),
});

// ============================================
// Query params for list
// ============================================
export const queryKeluargaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  noKk: z.string().optional(),
  kepalaId: z.coerce.bigint().optional(),
});

// ============================================
// ID Param
// ============================================
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka').transform(s => BigInt(s)),
});

// ============================================
// Create Anggota
// ============================================
export const createAnggotaSchema = z.object({
  pendudukId: z.string().regex(/^\d+$/, 'Penduduk ID harus angka').transform(s => BigInt(s)),
  hubungan: z.string().min(1, 'Hubungan wajib diisi').max(50),
  isAktif: z.boolean().default(true),
});

// ============================================
// Update Anggota
// ============================================
export const updateAnggotaSchema = z.object({
  hubungan: z.string().min(1).max(50).optional(),
  isAktif: z.boolean().optional(),
});

// ============================================
// Nested ID params for anggota
// ============================================
export const anggotaIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka').transform(s => BigInt(s)),
  anggotaId: z.string().regex(/^\d+$/, 'Anggota ID harus angka').transform(s => BigInt(s)),
});

// ============================================
// Types
// ============================================
export type CreateKeluargaInput = z.infer<typeof createKeluargaSchema>;
export type UpdateKeluargaInput = z.infer<typeof updateKeluargaSchema>;
export type QueryKeluargaInput = z.infer<typeof queryKeluargaSchema>;
export type CreateAnggotaInput = z.infer<typeof createAnggotaSchema>;
export type UpdateAnggotaInput = z.infer<typeof updateAnggotaSchema>;

// ============================================
// Response DTOs
// ============================================
export interface KeluargaResponse {
  id: string;
  noKk: string;
  kepalaId: string;
  kepalaNik: string;
  kepalaNama: string;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  dusun: string | null;
  kodePos: string | null;
  desaId: string | null;
  desaNama: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isAktif: boolean;
}

export interface KeluargaDetailResponse extends KeluargaResponse {
  anggota: AnggotaResponse[];
}

export interface AnggotaResponse {
  id: string;
  keluargaId: string;
  pendudukId: string;
  nik: string;
  namaLengkap: string;
  hubungan: string;
  isAktif: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface KeluargaListResponse {
  data: KeluargaResponse[];
  meta: PaginationMeta;
}
