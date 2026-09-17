import { z } from 'zod';

export const createAgendaSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  lokasi: z.string().min(1, 'Lokasi wajib diisi').max(255),
  penyelenggara: z.string().min(1, 'Penyelenggara wajib diisi').max(255),
  tanggalMulai: z.string().datetime(),
  tanggalSelesai: z.string().datetime(),
  status: z.enum(['MENDATANG', 'BERLANGSUNG', 'SELESAI', 'BATAL']).default('MENDATANG'),
  isAktif: z.boolean().default(true),
});

export const updateAgendaSchema = createAgendaSchema.partial();

export const queryAgendaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['MENDATANG', 'BERLANGSUNG', 'SELESAI', 'BATAL']).optional(),
  isAktif: z.enum(['true', 'false']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

export type CreateAgendaInput = z.infer<typeof createAgendaSchema>;
export type UpdateAgendaInput = z.infer<typeof updateAgendaSchema>;
export type QueryAgendaInput = z.infer<typeof queryAgendaSchema>;
