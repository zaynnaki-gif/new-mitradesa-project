import { z } from 'zod';

/**
 * Zod schemas for Wilayah domain (Gubug, Rw, Rt)
 */

// ============================================
// Gubug (Dusun) Schemas
// ============================================
export const createGubugSchema = z.object({
  desaId: z.string().regex(/^\d+$/, 'Desa ID harus angka').transform(s => BigInt(s)),
  kode: z.string().min(1).max(20),
  nama: z.string().min(1).max(100),
});

export const updateGubugSchema = z.object({
  kode: z.string().min(1).max(20).optional(),
  nama: z.string().min(1).max(100).optional(),
});

export const gubugIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

// ============================================
// Rw Schemas
// ============================================
export const createRwSchema = z.object({
  gubugId: z.string().regex(/^\d+$/, 'Gubug ID harus angka').transform(s => BigInt(s)),
  kode: z.string().min(1).max(20),
  nama: z.string().min(1).max(100),
});

export const updateRwSchema = z.object({
  kode: z.string().min(1).max(20).optional(),
  nama: z.string().min(1).max(100).optional(),
});

export const rwIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

// ============================================
// Rt Schemas
// ============================================
export const createRtSchema = z.object({
  rwId: z.string().regex(/^\d+$/, 'RW ID harus angka').transform(s => BigInt(s)),
  kode: z.string().min(1).max(20),
});

export const updateRtSchema = z.object({
  kode: z.string().min(1).max(20).optional(),
});

export const rtIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

// ============================================
// Query params
// ============================================
export const wilayahQuerySchema = z.object({
  desaId: z.string().regex(/^\d+$/, 'Desa ID harus angka').optional(),
  gubugId: z.string().regex(/^\d+$/, 'Gubug ID harus angka').optional(),
});

// ============================================
// Response types
// ============================================
export interface GubugResponse {
  id: string;
  desaId: string;
  kode: string;
  nama: string;
  createdAt: string;
  updatedAt: string;
}

export interface RwResponse {
  id: string;
  gubugId: string;
  kode: string;
  nama: string;
  createdAt: string;
  updatedAt: string;
}

export interface RtResponse {
  id: string;
  rwId: string;
  kode: string;
  createdAt: string;
  updatedAt: string;
}

export interface WilayahTreeResponse {
  id: string;
  kode: string;
  nama: string;
  rw: {
    id: string;
    kode: string;
    nama: string;
    rt: {
      id: string;
      kode: string;
    }[];
  }[];
}

export interface WilayahDropdownResponse {
  gubug: { id: string; kode: string; nama: string }[];
  rw: { id: string; gubugId: string; kode: string; nama: string }[];
  rt: { id: string; rwId: string; kode: string }[];
}
