import { z } from 'zod';

// ============================================================
// Usulan Online
// ============================================================
export const createUsulanSchema = z.object({
  pendudukId: z
    .string()
    .regex(/^\d+$/, 'Penduduk ID harus angka')
    .transform((s) => BigInt(s)),
  judulUsulan: z.string().min(5, 'Judul minimal 5 karakter').max(255),
  deskripsi: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  lokasi: z.string().max(255).optional(),
  fotoUrl: z.string().url('URL foto tidak valid').max(500).optional(),
});

export const updateUsulanSchema = z.object({
  judulUsulan: z.string().min(5).max(255).optional(),
  deskripsi: z.string().min(10).optional(),
  lokasi: z.string().max(255).optional(),
  fotoUrl: z.string().url().max(500).optional(),
  status: z.enum(['DRAFT', 'DIAJUKAN', 'DITINJAU', 'DITERIMA', 'DITOLAK']).optional(),
  alasanDitolak: z.string().optional(),
  rkpdesId: z
    .string()
    .regex(/^\d+$/)
    .transform((s) => BigInt(s))
    .optional(),
  rpjmdesBidangId: z
    .string()
    .regex(/^\d+$/)
    .transform((s) => BigInt(s))
    .optional(),
});

export const queryUsulanSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  pendudukId: z.string().optional(),
  search: z.string().optional(),
});

export type CreateUsulanInput = z.infer<typeof createUsulanSchema>;
export type UpdateUsulanInput = z.infer<typeof updateUsulanSchema>;
export type QueryUsulanInput = z.infer<typeof queryUsulanSchema>;

// ============================================================
// Voting
// ============================================================
export const createVotingSchema = z.object({
  judul: z.string().min(5).max(255),
  deskripsi: z.string().min(10),
  waktuMulai: z.string().datetime({ message: 'Format waktu mulai tidak valid' }),
  waktuSelesai: z.string().datetime({ message: 'Format waktu selesai tidak valid' }),
});

export const updateVotingSchema = z.object({
  judul: z.string().min(5).max(255).optional(),
  deskripsi: z.string().min(10).optional(),
  waktuMulai: z.string().datetime().optional(),
  waktuSelesai: z.string().datetime().optional(),
  status: z.enum(['MENDATANG', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN']).optional(),
});

export const createKandidatSchema = z.object({
  nama: z.string().min(2).max(255),
  deskripsi: z.string().optional(),
  fotoUrl: z.string().url().max(500).optional(),
  nomorUrut: z.number().int().min(1),
  rkpdesId: z
    .string()
    .regex(/^\d+$/)
    .transform((s) => BigInt(s))
    .optional(),
});

export const castVoteSchema = z.object({
  pendudukId: z
    .string()
    .regex(/^\d+$/, 'Penduduk ID harus angka')
    .transform((s) => BigInt(s)),
  kandidatId: z
    .string()
    .regex(/^\d+$/, 'Kandidat ID harus angka')
    .transform((s) => BigInt(s)),
});

export type CreateVotingInput = z.infer<typeof createVotingSchema>;
export type UpdateVotingInput = z.infer<typeof updateVotingSchema>;
export type CreateKandidatInput = z.infer<typeof createKandidatSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
