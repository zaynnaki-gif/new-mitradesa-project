import { z } from 'zod';

/**
 * Zod schemas for PerangkatDesa domain
 * Uses BIGINT for all IDs (not NIK)
 * Follows validation patterns from existing domains
 */

// ============================================
// Create PerangkatDesa
// ============================================
export const createPerangkatDesaSchema = z.object({
  pendudukId: z.string().regex(/^\d+$/, 'Penduduk ID harus angka').transform(s => BigInt(s)),
  jabatan: z.string().min(1, 'Jabatan wajib diisi').max(100),
  status: z.string().max(50).default('AKTIF'),
  fotoUrl: z.string().url().max(500).optional().nullable(),
  accountId: z.string().regex(/^\d+$/, 'Account ID harus angka').transform(s => BigInt(s)).optional().nullable(),
});

// ============================================
// Update PerangkatDesa
// ============================================
export const updatePerangkatDesaSchema = z.object({
  pendudukId: z.string().regex(/^\d+$/, 'Penduduk ID harus angka').transform(s => BigInt(s)).optional(),
  jabatan: z.string().min(1).max(100).optional(),
  status: z.string().max(50).optional(),
  fotoUrl: z.string().url().max(500).optional().nullable(),
  accountId: z.string().regex(/^\d+$/, 'Account ID harus angka').transform(s => BigInt(s)).optional().nullable(),
});

// ============================================
// Link/Unlink Account
// ============================================
export const linkAccountSchema = z.object({
  accountId: z.string().regex(/^\d+$/, 'Account ID harus angka').transform(s => BigInt(s)),
});

export const unlinkAccountSchema = z.object({}).optional();

// ============================================
// Query params for list
// ============================================
export const queryPerangkatDesaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  pendudukId: z.coerce.bigint().optional(),
  jabatan: z.string().optional(),
  status: z.string().optional(),
  hasAccount: z.coerce.boolean().optional(),
});

// ============================================
// ID Param
// ============================================
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka').transform(s => BigInt(s)),
});

// ============================================
// Types
// ============================================
export type CreatePerangkatDesaInput = z.infer<typeof createPerangkatDesaSchema>;
export type UpdatePerangkatDesaInput = z.infer<typeof updatePerangkatDesaSchema>;
export type QueryPerangkatDesaInput = z.infer<typeof queryPerangkatDesaSchema>;
export type LinkAccountInput = z.infer<typeof linkAccountSchema>;

// ============================================
// Response DTOs
// ============================================
export interface PerangkatDesaResponse {
  id: string;
  pendudukId: string;
  pendudukNik: string;
  pendudukNama: string;
  desaId: string;
  desaNama: string;
  jabatan: string;
  status: string;
  fotoUrl: string | null;
  accountId: string | null;
  accountUsername: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isAktif: boolean;
}

export interface PerangkatDesaDetailResponse extends PerangkatDesaResponse {
  // Extended with penduduk details
  penduduk: {
    id: string;
    nik: string;
    namaLengkap: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: string;
    alamat: string | null;
    rt: string | null;
    rw: string | null;
    dusun: string | null;
  } | null;
  account: {
    id: string;
    username: string;
    email: string;
    status: string;
  } | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PerangkatDesaListResponse {
  data: PerangkatDesaResponse[];
  meta: PaginationMeta;
}
