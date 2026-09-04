import { z } from 'zod';
import { FieldType, RequestStatus, VersionStatus, DocumentStatus } from '@prisma/client';

// ============================================================
// Common Schemas
// ============================================================

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug wajib diisi'),
});

// ============================================================
// Pagination Query Schema
// ============================================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
  sortBy: z.string().optional(),
});

// ============================================================
// Field Definition Schemas
// ============================================================

export const createFieldDefinitionSchema = z.object({
  layananId: z.number().int().positive().optional().nullable(),
  templateId: z.number().int().positive().optional().nullable(),
  key: z.string().min(1, 'Key wajib diisi').max(100),
  label: z.string().min(1, 'Label wajib diisi').max(255),
  type: z.nativeEnum(FieldType),
  source: z.string().max(100).optional().nullable(),
  required: z.boolean().default(false),
  validation: z.record(z.unknown()).optional().nullable(),
  defaultValue: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  options: z.array(z.string()).optional().nullable(),
  placeholder: z.string().max(255).optional().nullable(),
  orderIndex: z.number().int().min(0).default(0),
});

export const updateFieldDefinitionSchema = z.object({
  key: z.string().min(1).max(100).optional(),
  label: z.string().min(1).max(255).optional(),
  type: z.nativeEnum(FieldType).optional(),
  source: z.string().max(100).optional().nullable(),
  required: z.boolean().optional(),
  validation: z.record(z.unknown()).optional().nullable(),
  defaultValue: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  options: z.array(z.string()).optional().nullable(),
  placeholder: z.string().max(255).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
});

export const queryFieldDefinitionSchema = paginationQuerySchema.extend({
  layananId: z.coerce.number().int().positive().optional(),
  templateId: z.coerce.number().int().positive().optional(),
});

// ============================================================
// Layanan (Service) Schemas
// ============================================================

export const createLayananSchema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi').max(20),
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  slug: z.string().min(1, 'Slug wajib diisi').max(255).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  deskripsi: z.string().optional().nullable(),
  kategori: z.string().max(100).optional().nullable(),
  requiresDocument: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const updateLayananSchema = z.object({
  kode: z.string().min(1).max(20).optional(),
  nama: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  deskripsi: z.string().optional().nullable(),
  kategori: z.string().max(100).optional().nullable(),
  requiresDocument: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const queryLayananSchema = paginationQuerySchema.extend({
  kategori: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// ============================================================
// PermintaanLayanan (Service Request) Schemas
// ============================================================

export const createPermintaanLayananSchema = z.object({
  layananId: z.number().int().positive('ID Layanan wajib diisi'),
  pendudukId: z.number().int().positive().optional().nullable(),
  dataJson: z.record(z.unknown()).optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export const updatePermintaanLayananSchema = z.object({
  dataJson: z.record(z.unknown()).optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export const updatePermintaanStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  catatan: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.status === 'REJECTED' && (!data.catatan || data.catatan.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Alasan penolakan wajib diisi',
      path: ['catatan'],
    });
  }
});

export const queryPermintaanLayananSchema = paginationQuerySchema.extend({
  layananId: z.coerce.number().int().positive().optional(),
  pendudukId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(RequestStatus).optional(),
});

// ============================================================
// DokumenDefinition (Document Definition) Schemas
// ============================================================

export const createDokumenDefinitionSchema = z.object({
  layananId: z.number().int().positive('ID Layanan wajib diisi'),
  kode: z.string().min(1, 'Kode wajib diisi').max(20),
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  slug: z.string().min(1, 'Slug wajib diisi').max(255).regex(/^[a-z0-9-]+$/),
  deskripsi: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateDokumenDefinitionSchema = z.object({
  kode: z.string().min(1).max(20).optional(),
  nama: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  deskripsi: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const queryDokumenDefinitionSchema = paginationQuerySchema.extend({
  layananId: z.coerce.number().int().positive().optional(),
});

// ============================================================
// TemplateSurat (Template) Schemas
// ============================================================

export const createTemplateSuratSchema = z.object({
  dokumenId: z.number().int().positive('ID Dokumen wajib diisi'),
  blankoId: z.number().int().positive('ID Blanko tidak valid').optional().nullable(),
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  slug: z.string().min(1, 'Slug wajib diisi').max(255).regex(/^[a-z0-9-]+$/),
  deskripsi: z.string().optional().nullable(),
});

export const updateTemplateSuratSchema = z.object({
  blankoId: z.number().int().positive('ID Blanko tidak valid').optional().nullable(),
  nama: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  deskripsi: z.string().optional().nullable(),
});

export const queryTemplateSuratSchema = paginationQuerySchema.extend({
  dokumenId: z.coerce.number().int().positive().optional(),
});

// ============================================================
// Element System Types
// ============================================================

/**
 * Element types for template designer
 */
export const ElementTypeSchema = z.enum([
  'text',
  'field',
  'table',
  'image',
  'divider',
  'signature',
  'page_break',
  'spacer',
]);

export type ElementType = z.infer<typeof ElementTypeSchema>;

/**
 * Base element properties
 */
export const BaseElementSchema = z.object({
  id: z.string(),
  type: ElementTypeSchema,
});

/**
 * Text element - static or bound text
 */
export const TextElementSchema = BaseElementSchema.extend({
  type: z.literal('text'),
  content: z.string(),                    // Supports {{binding | formatter}}
  fontSize: z.number().default(12),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  lineHeight: z.number().default(1.5),
  margin: z.object({
    top: z.number().default(0),
    right: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
  }).default(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
  padding: z.object({
    top: z.number().default(0),
    right: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
  }).default(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
});

/**
 * Field element - bound to data
 */
export const FieldElementSchema = BaseElementSchema.extend({
  type: z.literal('field'),
  binding: z.string(),                   // e.g., 'penduduk.namaLengkap'
  label: z.string().optional(),
  formatter: z.string().optional(),      // e.g., 'uppercase'
  fontSize: z.number().default(12),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  width: z.string().default('100%'),     // e.g., '100%', '200px'
  margin: z.object({
    top: z.number().default(0),
    right: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
  }).default(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
});

/**
 * Table element - for repeater data
 */
export const TableElementSchema = BaseElementSchema.extend({
  type: z.literal('table'),
  dataSource: z.string(),                 // e.g., 'keluarga.anggota'
  columns: z.array(z.object({
    id: z.string(),
    header: z.string(),                  // Column header text
    binding: z.string(),                  // e.g., 'nama'
    width: z.string().default('auto'),
    align: z.enum(['left', 'center', 'right']).default('left'),
  })),
  headerStyle: z.object({
    fontSize: z.number().default(11),
    fontWeight: z.enum(['normal', 'bold']).default('bold'),
    textAlign: z.enum(['left', 'center', 'right']).default('left'),
    backgroundColor: z.string().default('#f0f0f0'),
  }).default(() => ({
    fontSize: 11,
    fontWeight: 'bold' as const,
    textAlign: 'left' as const,
    backgroundColor: '#f0f0f0',
  })),
  rowStyle: z.object({
    fontSize: z.number().default(11),
    textAlign: z.enum(['left', 'center', 'right']).default('left'),
  }).default(() => ({
    fontSize: 11,
    textAlign: 'left' as const,
  })),
  margin: z.object({
    top: z.number().default(0),
    right: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
  }).default(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
});

/**
 * Image element
 */
export const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal('image'),
  source: z.string(),                    // URL or binding
  width: z.string().default('100px'),
  height: z.string().default('auto'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  margin: z.object({
    top: z.number().default(0),
    right: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
  }).default(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
});

/**
 * Divider element
 */
export const DividerElementSchema = BaseElementSchema.extend({
  type: z.literal('divider'),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  thickness: z.number().default(1),
  color: z.string().default('#000000'),
  width: z.string().default('100%'),
  margin: z.object({
    top: z.number().default(10),
    right: z.number().default(0),
    bottom: z.number().default(10),
    left: z.number().default(0),
  }).default(() => ({ top: 10, right: 0, bottom: 10, left: 0 })),
});

/**
 * Signature element
 */
export const SignatureElementSchema = BaseElementSchema.extend({
  type: z.literal('signature'),
  title: z.string().default('Kepala Desa'),
  signatoryBinding: z.string().optional(), // e.g., 'kepala_desa.nama'
  nipBinding: z.string().optional(),      // e.g., 'kepala_desa.nip'
  imageBinding: z.string().optional(),     // e.g., 'kepala_desa.tandaTangan'
  position: z.enum(['left', 'center', 'right']).default('right'),
  margin: z.object({
    top: z.number().default(20),
    right: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
  }).default(() => ({ top: 20, right: 0, bottom: 0, left: 0 })),
});

/**
 * Page break element
 */
export const PageBreakElementSchema = BaseElementSchema.extend({
  type: z.literal('page_break'),
});

/**
 * Spacer element
 */
export const SpacerElementSchema = BaseElementSchema.extend({
  type: z.literal('spacer'),
  height: z.number().default(20),
});

/**
 * Union of all element types
 */
export const ElementSchema = z.discriminatedUnion('type', [
  TextElementSchema,
  FieldElementSchema,
  TableElementSchema,
  ImageElementSchema,
  DividerElementSchema,
  SignatureElementSchema,
  PageBreakElementSchema,
  SpacerElementSchema,
]);

export type Element = z.infer<typeof ElementSchema>;

// ============================================================
// Extended Template Content Schema
// ============================================================

export const ExtendedTemplateContentSchema = z.object({
  metadata: z.object({
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.string(),
    version: z.number().int().positive(),
    author: z.string().optional(),
  }),
  layout: z.object({
    pageSize: z.enum(['A4', 'FOLIO', 'LETTER', 'LEGAL']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    width: z.string().optional(),          // Custom width
    height: z.string().optional(),         // Custom height
    margins: z.object({
      top: z.number().default(20),
      right: z.number().default(20),
      bottom: z.number().default(20),
      left: z.number().default(20),
    }),
  }),
  elements: z.array(ElementSchema).default([]),  // New flat element array
  // Legacy sections support for backward compatibility
  sections: z.object({
    kop: z.object({
      enabled: z.boolean().default(true),
      config: z.record(z.unknown()).optional(),
    }).optional(),
    header: z.object({
      enabled: z.boolean().default(false),
      elements: z.array(z.record(z.unknown())).default([]),
    }).optional(),
    body: z.object({
      elements: z.array(z.record(z.unknown())).default([]),
    }),
    signature: z.object({
      enabled: z.boolean().default(true),
      config: z.record(z.unknown()).optional(),
    }).optional(),
    footer: z.object({
      enabled: z.boolean().default(false),
      elements: z.array(z.record(z.unknown())).default([]),
    }).optional(),
  }).optional(),
});

// Extended Kop Config - using generic object for simplicity
export const ExtendedKopConfigSchema = z.object({
  headerBlock: z.object({
    enabled: z.boolean().default(true),
    align: z.enum(['center', 'left', 'justify']).default('center'),
    spacing: z.object({
      betweenLines: z.number().default(4),
      afterHeader: z.number().default(8),
    }),
  }),
  logoDesa: z.object({
    visible: z.boolean().default(true),
    position: z.enum(['left', 'center', 'right']).default('left'),
    size: z.string().default('60px'),
    source: z.enum(['upload', 'desa_config']).default('desa_config'),
  }),
  logoKabupaten: z.object({
    visible: z.boolean().default(true),
    position: z.enum(['left', 'center', 'right']).default('right'),
    size: z.string().default('60px'),
    source: z.enum(['upload', 'kabupaten_config']).default('kabupaten_config'),
  }),
  institutionNames: z.object({
    pemda: z.object({
      visible: z.boolean().default(true),
      text: z.string().optional(),
      source: z.enum(['config', 'auto']).default('auto'),
    }),
    kecamatan: z.object({
      visible: z.boolean().default(true),
      text: z.string().optional(),
      source: z.enum(['config', 'auto']).default('auto'),
    }),
    desa: z.object({
      visible: z.boolean().default(true),
      text: z.string().optional(),
      source: z.enum(['config', 'auto']).default('auto'),
    }),
  }),
  addressBlock: z.object({
    enabled: z.boolean().default(true),
    fields: z.array(z.object({
      label: z.string(),
      source: z.string(),
      showLabel: z.boolean().default(false),
    })),
  }),
  divider: z.object({
    style: z.enum(['single', 'double', 'none']).default('double'),
    thickness: z.number().default(2),
    spacing: z.object({
      before: z.number().default(8),
      after: z.number().default(8),
    }),
  }),
  bodyMarginTop: z.number().default(15),
}).passthrough();

export type ExtendedKopConfig = z.infer<typeof ExtendedKopConfigSchema>;

// Extended Signature Config
export const ExtendedSignatureConfigSchema = z.object({
  title: z.object({
    enabled: z.boolean().default(true),
    text: z.string().default('Kepala Desa Seruni Mumbul'),
    align: z.enum(['left', 'center', 'right']).default('right'),
    marginBottom: z.number().default(30),
  }),
  signatory: z.object({
    nameBinding: z.string().default('kepala_desa.nama'),
    nipBinding: z.string().optional(),
    titleText: z.string().default('Kepala Desa'),
    alignment: z.enum(['left', 'center', 'right']).default('right'),
  }),
  signatureImage: z.object({
    enabled: z.boolean().default(false),
    source: z.enum(['upload', 'generated']).default('generated'),
    url: z.string().optional(),
    width: z.string().default('100px'),
    height: z.string().default('50px'),
    marginBottom: z.number().default(5),
  }),
  qrCode: z.object({
    enabled: z.boolean().default(true),
    position: z.enum(['left', 'right']).default('left'),
    size: z.string().default('60px'),
    marginTop: z.number().default(20),
  }),
  signatureSpace: z.object({
    height: z.number().default(60),
  }),
}).passthrough();

export type ExtendedSignatureConfig = z.infer<typeof ExtendedSignatureConfigSchema>;

// ============================================================
// Extended Schemas (alias for backward compatibility)
// ============================================================

// Kop config structure (legacy)
export const kopConfigSchema = z.union([
  ExtendedKopConfigSchema,
  z.record(z.unknown()),
]);

// Signature config structure (legacy)
export const signatureConfigSchema = z.union([
  ExtendedSignatureConfigSchema,
  z.record(z.unknown()),
]);

// Template content structure (legacy)
export const templateContentSchema = z.union([
  ExtendedTemplateContentSchema,
  z.record(z.unknown()),
]);

export const createTemplateVersionSchema = z.object({
  content: ExtendedTemplateContentSchema,
  kopConfig: ExtendedKopConfigSchema.optional().nullable(),
  signatureConfig: ExtendedSignatureConfigSchema.optional().nullable(),
  changelog: z.string().optional().nullable(),
});

export const updateTemplateVersionSchema = z.object({
  content: ExtendedTemplateContentSchema.optional(),
  kopConfig: ExtendedKopConfigSchema.optional().nullable(),
  signatureConfig: ExtendedSignatureConfigSchema.optional().nullable(),
  changelog: z.string().optional().nullable(),
});

export const queryTemplateVersionSchema = paginationQuerySchema.extend({
  templateId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(VersionStatus).optional(),
});

// ============================================================
// InstanDokumen (Document Instance) Schemas
// ============================================================

export const createInstanDokumenSchema = z.object({
  dokumenId: z.number().int().positive('ID Dokumen wajib diisi'),
  permintaanId: z.number().int().positive().optional().nullable(),
  judul: z.string().min(1, 'Judul wajib diisi').max(255),
});

export const queryInstanDokumenSchema = paginationQuerySchema.extend({
  dokumenId: z.coerce.number().int().positive().optional(),
  permintaanId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
});

// ============================================================
// Generate Document Schemas
// ============================================================

export const generateDocumentSchema = z.object({
  templateVersionId: z.union([z.number(), z.string()]).transform(s => BigInt(s)),
  context: z.record(z.unknown()),
  judul: z.string().min(1),
  permintaanId: z.union([z.number(), z.string()]).transform(s => BigInt(s)).optional().nullable(),
});

export const generatePreviewSchema = z.object({
  templateVersionId: z.union([z.number(), z.string()]).transform(s => BigInt(s)),
  context: z.record(z.unknown()),
});

export const createInstanDokumenExtendedSchema = z.object({
  dokumenId: z.union([z.number(), z.string()]).transform(s => BigInt(s)),
  templateVersionId: z.union([z.number(), z.string()]).transform(s => BigInt(s)),
  permintaanId: z.union([z.number(), z.string()]).transform(s => BigInt(s)).optional().nullable(),
  judul: z.string().min(1, 'Judul wajib diisi').max(255),
  requestData: z.record(z.unknown()).optional().nullable(),
});

export const signDocumentSchema = z.object({
  penandatanganId: z.union([z.number(), z.string()]).transform(s => BigInt(s)),
  tandaTanganUrl: z.string().optional().nullable(),
});

export const duplicateTemplateSchema = z.object({
  nama: z.string().min(1, 'nama wajib diisi'),
  slug: z.string().min(1, 'slug wajib diisi'),
});

export const previewTemplateVersionSchema = z.object({
  customData: z.record(z.unknown()).optional().nullable(),
});

// ============================================================
// NomorSuratConfig (Numbering Configuration) Schemas
// ============================================================

export const createNomorSuratConfigSchema = z.object({
  formatTemplate: z.string().min(1, 'Format template wajib diisi').max(255),
  startingNumber: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
});

export const updateNomorSuratConfigSchema = z.object({
  formatTemplate: z.string().min(1).max(255).optional(),
  startingNumber: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// ============================================================
// PenandaTangan (Signatory) Schemas
// ============================================================

export const createPenandaTanganSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  jabatan: z.string().min(1, 'Jabatan wajib diisi').max(255),
  nip: z.string().max(50).optional().nullable(),
  tandaTanganUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  accountId: z.union([z.bigint(), z.number(), z.string().regex(/^\d+$/).transform(s => BigInt(s))]).optional().nullable(),
  pin: z.string().min(4, 'PIN minimal 4 karakter').max(32).optional().nullable(),
});

export const updatePenandaTanganSchema = z.object({
  nama: z.string().min(1).max(255).optional(),
  jabatan: z.string().min(1).max(255).optional(),
  nip: z.string().max(50).optional().nullable(),
  tandaTanganUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  accountId: z.union([z.bigint(), z.number(), z.string().regex(/^\d+$/).transform(s => BigInt(s))]).optional().nullable(),
  pin: z.string().min(4, 'PIN minimal 4 karakter').max(32).optional().nullable(),
});

export const queryPenandaTanganSchema = paginationQuerySchema.extend({
  isActive: z.enum(['true', 'false']).optional(),
});

// ============================================================
// DokumenSignature Schemas
// ============================================================

export const createDokumenSignatureSchema = z.object({
  penandatanganId: z.union([z.bigint(), z.number(), z.string().regex(/^\d+$/).transform(s => BigInt(s))]),
  tandaTanganUrl: z.string().max(500).optional().nullable(),
  pin: z.string().min(4, 'PIN minimal 4 karakter').optional().nullable(),
  tandaTanganType: z.enum(['IMAGE']).default('IMAGE'),
});

// ============================================================
// Type Exports
// ============================================================

export type CreateFieldDefinitionInput = z.infer<typeof createFieldDefinitionSchema>;
export type UpdateFieldDefinitionInput = z.infer<typeof updateFieldDefinitionSchema>;
export type QueryFieldDefinitionInput = z.infer<typeof queryFieldDefinitionSchema>;

export type CreateLayananInput = z.infer<typeof createLayananSchema>;
export type UpdateLayananInput = z.infer<typeof updateLayananSchema>;
export type QueryLayananInput = z.infer<typeof queryLayananSchema>;

export type CreatePermintaanLayananInput = z.infer<typeof createPermintaanLayananSchema>;
export type UpdatePermintaanLayananInput = z.infer<typeof updatePermintaanLayananSchema>;
export type UpdatePermintaanStatusInput = z.infer<typeof updatePermintaanStatusSchema>;
export type QueryPermintaanLayananInput = z.infer<typeof queryPermintaanLayananSchema>;

export type CreateDokumenDefinitionInput = z.infer<typeof createDokumenDefinitionSchema>;
export type UpdateDokumenDefinitionInput = z.infer<typeof updateDokumenDefinitionSchema>;
export type QueryDokumenDefinitionInput = z.infer<typeof queryDokumenDefinitionSchema>;

export type CreateTemplateSuratInput = z.infer<typeof createTemplateSuratSchema>;
export type UpdateTemplateSuratInput = z.infer<typeof updateTemplateSuratSchema>;
export type QueryTemplateSuratInput = z.infer<typeof queryTemplateSuratSchema>;

export type CreateTemplateVersionInput = z.infer<typeof createTemplateVersionSchema>;
export type UpdateTemplateVersionInput = z.infer<typeof updateTemplateVersionSchema>;
export type QueryTemplateVersionInput = z.infer<typeof queryTemplateVersionSchema>;

export type CreateInstanDokumenInput = z.infer<typeof createInstanDokumenSchema>;
export type QueryInstanDokumenInput = z.infer<typeof queryInstanDokumenSchema>;

export type CreateNomorSuratConfigInput = z.infer<typeof createNomorSuratConfigSchema>;
export type UpdateNomorSuratConfigInput = z.infer<typeof updateNomorSuratConfigSchema>;

export type CreatePenandaTanganInput = z.infer<typeof createPenandaTanganSchema>;
export type UpdatePenandaTanganInput = z.infer<typeof updatePenandaTanganSchema>;
export type QueryPenandaTanganInput = z.infer<typeof queryPenandaTanganSchema>;

export type CreateDokumenSignatureInput = z.infer<typeof createDokumenSignatureSchema>;
