import { z } from 'zod';
import { SuratMasukStatus, DisposisiStatus, DocumentStatus } from '@prisma/client';

export const GetSuratMasukSchema = z.object({
  status: z.nativeEnum(SuratMasukStatus).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 10),
});

export const CreateSuratMasukSchema = z.object({
  nomorSurat: z.string().min(1),
  tanggalSurat: z.string().datetime(),
  tanggalDiterima: z.string().datetime(),
  pengirim: z.string().min(1),
  perihal: z.string().min(1),
  lampiran: z.string().optional().nullable(),
  fileScanUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

export const UpdateSuratMasukStatusSchema = z.object({
  status: z.nativeEnum(SuratMasukStatus),
});

export const CreateDisposisiSchema = z.object({
  tujuan: z.string().min(1),
  instruksi: z.string().min(1),
  tanggalSelesai: z.string().datetime().optional().nullable(),
});

export const UpdateDisposisiStatusSchema = z.object({
  status: z.nativeEnum(DisposisiStatus),
});

export const BalasDisposisiSchema = z.object({
  catatanBalasan: z.string().min(1),
});

export const GetSuratKeluarSchema = z.object({
  status: z.nativeEnum(DocumentStatus).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 10),
});
