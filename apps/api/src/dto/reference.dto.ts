import { z } from 'zod';

/**
 * Zod schemas for Reference Data domain
 * Phase 4: Master Reference Tables
 */

// ============================================
// Common Reference Item Schema
// ============================================
const baseRefSchema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  nama: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  isAktif: z.boolean().default(true),
});

const updateRefSchema = baseRefSchema.partial();

// ============================================
// Reference CRUD Schemas
// ============================================
export const createRefAgamaSchema = baseRefSchema;

export const updateRefAgamaSchema = updateRefSchema;

export const queryRefSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isAktif: z.coerce.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka').transform(s => BigInt(s)),
});

export const kodeParamSchema = z.object({
  kode: z.string().min(1),
});

// ============================================
// Extended Reference Schemas (with additional fields)
// ============================================
export const createRefHubunganKeluargaSchema = z.object({
  kode: z.string().min(1).max(20),
  nama: z.string().min(1).max(50),
  kategori: z.string().min(1).max(20),
  isAktif: z.boolean().default(true),
});

export const createRefPendidikanSchema = z.object({
  kode: z.string().min(1).max(10),
  nama: z.string().min(1).max(100),
  jenjang: z.number().int().min(0),
  isAktif: z.boolean().default(true),
});

export const createRefJabatanPerangkatSchema = z.object({
  kode: z.string().min(1).max(20),
  nama: z.string().min(1).max(100),
  kategori: z.string().min(1).max(50),
  urutan: z.number().int().default(0),
  isAktif: z.boolean().default(true),
});

// ============================================
// Types
// ============================================
export type CreateRefAgamaInput = z.infer<typeof createRefAgamaSchema>;
export type UpdateRefAgamaInput = z.infer<typeof updateRefAgamaSchema>;
export type QueryRefInput = z.infer<typeof queryRefSchema>;
export type CreateRefHubunganKeluargaInput = z.infer<typeof createRefHubunganKeluargaSchema>;
export type CreateRefPendidikanInput = z.infer<typeof createRefPendidikanSchema>;
export type CreateRefJabatanPerangkatInput = z.infer<typeof createRefJabatanPerangkatSchema>;

// ============================================
// Response DTOs
// ============================================
export interface RefItemResponse {
  id: string;
  kode: string;
  nama: string;
  isAktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefItemExtendedResponse extends RefItemResponse {
  kategori?: string;
  jenjang?: number;
  urutan?: number;
}

export interface RefListResponse {
  data: RefItemResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
