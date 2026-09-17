import { z } from 'zod';

export const createLembagaSchema = z.object({
  jenis: z.string().min(1, 'Jenis lembaga harus diisi').max(100),
  nama: z.string().min(1, 'Nama lembaga harus diisi').max(200),
  deskripsi: z.string().max(500).optional().nullable(),
  status: z.enum(['AKTIF', 'TIDAK_AKTIF']).optional().default('AKTIF'),
});

export const updateLembagaSchema = createLembagaSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu kolom harus diisi untuk update' }
);

export type CreateLembagaInput = z.infer<typeof createLembagaSchema>;
export type UpdateLembagaInput = z.infer<typeof updateLembagaSchema>;
