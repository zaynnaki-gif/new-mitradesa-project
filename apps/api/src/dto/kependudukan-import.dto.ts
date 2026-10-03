import { z } from 'zod';

// ============================================
// Schema for row inside Excel
// ============================================
export const excelRowPendudukSchema = z.object({
  noKk: z.string().length(16, 'Nomor KK harus 16 digit'),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  jenisKelamin: z.enum(['L', 'P'], { invalid_type_error: 'Jenis kelamin harus L atau P' }),
  tempatLahir: z.string().min(1, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.date({ invalid_type_error: 'Format tanggal lahir tidak valid' }),
  agama: z.string().min(1, 'Agama wajib diisi'),
  pendidikan: z.string().optional(),
  pekerjaan: z.string().optional(),
  golonganDarah: z.string().optional(),
  statusPerkawinan: z.string().min(1, 'Status perkawinan wajib diisi'),
  statusHubunganDalamKeluarga: z.string().min(1, 'Status hubungan dalam keluarga wajib diisi (misal KEPALA KELUARGA, ISTRI, ANAK)'),
  kewarganegaraan: z.string().default('WNI'),
  noPaspor: z.string().optional().nullable(),
  noKitasKitap: z.string().optional().nullable(),
  namaAyah: z.string().min(1, 'Nama ayah wajib diisi'),
  namaIbu: z.string().min(1, 'Nama ibu wajib diisi'),
  alamatKeluarga: z.string().optional(), // Inferred for KK
  rt: z.string().optional(), // Inferred for KK
  rw: z.string().optional(), // Inferred for KK
  dusun: z.string().optional(), // Inferred for KK
});

export type ExcelRowPendudukInput = z.infer<typeof excelRowPendudukSchema>;

// ============================================
// Response DTO
// ============================================
export interface ImportPendudukResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number; // Skipped duplicates
  errors: Array<{ row: number; error: string; nik?: string }>;
}
