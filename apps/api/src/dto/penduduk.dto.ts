import { z } from 'zod';

/**
 * NIK Validation: exactly 16 digits
 */
const nikSchema = z
  .string()
  .min(1, 'NIK is required')
  .length(16, 'NIK must be exactly 16 digits')
  .regex(/^\d{16}$/, 'NIK must be 16 numeric digits');

/**
 * Jenis Kelamin Validation
 */
const jenisKelaminSchema = z.enum(['L', 'P'], {
  errorMap: () => ({ message: 'Jenis kelamin must be L (Laki-laki) or P (Perempuan)' }),
});

/**
 * Create Penduduk DTO
 */
export const createPendudukSchema = z.object({
  nik: nikSchema,
  namaLengkap: z.string().min(1, 'Nama lengkap is required').max(255),
  tempatLahir: z.string().min(1, 'Tempat lahir is required').max(100),
  tanggalLahir: z.string().min(1, 'Tanggal lahir is required'), // ISO date string
  jenisKelamin: jenisKelaminSchema,
  golDarah: z.string().max(3).optional().nullable(),
  agama: z.string().max(50).optional().nullable(),
  statusPerkawinan: z.string().min(1, 'Status perkawinan is required').max(50),
  hubunganKeluarga: z.string().max(50).optional().nullable(),
  alamat: z.string().optional().nullable(),
  rt: z.string().max(10).optional().nullable(),
  rw: z.string().max(10).optional().nullable(),
  dusun: z.string().max(100).optional().nullable(),
  kodePos: z.string().max(10).optional().nullable(),
  telepon: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email format').max(255).optional().nullable(),
  wargaNegara: z.string().max(50).default('Indonesia'),
  nikAyah: z.string().regex(/^\d{16}$/, 'NIK Ayah must be 16 digits').optional().nullable(),
  nikIbu: z.string().regex(/^\d{16}$/, 'NIK Ibu must be 16 digits').optional().nullable(),
  isAktif: z.boolean().default(true),
  statusKepindahan: z.string().max(50).optional().nullable(),
});

/**
 * Update Penduduk DTO (partial update)
 */
export const updatePendudukSchema = z.object({
  namaLengkap: z.string().min(1).max(255).optional(),
  tempatLahir: z.string().min(1).max(100).optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: jenisKelaminSchema.optional(),
  golDarah: z.string().max(3).optional().nullable(),
  agama: z.string().max(50).optional().nullable(),
  statusPerkawinan: z.string().max(50).optional(),
  hubunganKeluarga: z.string().max(50).optional().nullable(),
  alamat: z.string().optional().nullable(),
  rt: z.string().max(10).optional().nullable(),
  rw: z.string().max(10).optional().nullable(),
  dusun: z.string().max(100).optional().nullable(),
  kodePos: z.string().max(10).optional().nullable(),
  telepon: z.string().max(20).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  wargaNegara: z.string().max(50).optional(),
  nikAyah: z.string().regex(/^\d{16}$/).optional().nullable(),
  nikIbu: z.string().regex(/^\d{16}$/).optional().nullable(),
  isAktif: z.boolean().optional(),
  statusKepindahan: z.string().max(50).optional().nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Query Parameters for list
 */
export const queryPendudukSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  nik: z.string().optional(),
  namaLengkap: z.string().optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  isAktif: z.coerce.boolean().optional(),
  statusPerkawinan: z.string().optional(),
  agama: z.string().optional(),
});

/**
 * ID Parameter
 */
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform((val) => BigInt(val)),
});

/**
 * Types
 */
export type CreatePendudukInput = z.infer<typeof createPendudukSchema>;
export type UpdatePendudukInput = z.infer<typeof updatePendudukSchema>;
export type QueryPendudukInput = z.infer<typeof queryPendudukSchema>;

/**
 * Response DTO - Internal (full data for admin)
 */
export interface PendudukResponse {
  id: string;
  nik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  golDarah: string | null;
  agama: string | null;
  statusPerkawinan: string;
  hubunganKeluarga: string | null;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  dusun: string | null;
  kodePos: string | null;
  telepon: string | null;
  email: string | null;
  wargaNegara: string;
  nikAyah: string | null;
  nikIbu: string | null;
  isAktif: boolean;
  statusKepindahan: string | null;
  desaId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response DTO - Public/Citizen (masked NIK)
 */
export interface PendudukPublicResponse {
  id: string;
  nikMasked: string; // 327xxxxxxxxxxx12
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  // Other fields masked or excluded for public
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  dusun: string | null;
}

/**
 * Pagination Meta
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * List Response
 */
export interface PendudukListResponse {
  data: PendudukResponse[];
  meta: PaginationMeta;
}
