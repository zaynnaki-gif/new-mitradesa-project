/**
 * Binding Resolver Utility
 *
 * Provides safe template binding resolution for document templates.
 * Uses whitelist approach to prevent code injection.
 */

import { applyFormatter, parseBindingWithFormatter } from './formatter-registry.js';

// ============================================================
// Allowed Bindings (Whitelist)
// ============================================================

const ALLOWED_BINDINGS: Set<string> = new Set([
  // Penduduk fields
  'penduduk.id',
  'penduduk.nik',
  'penduduk.namaLengkap',
  'penduduk.nama_lengkap',
  'penduduk.tempatLahir',
  'penduduk.tempat_lahir',
  'penduduk.tanggalLahir',
  'penduduk.tanggal_lahir',
  'penduduk.jenisKelamin',
  'penduduk.jenis_kelamin',
  'penduduk.alamat',
  'penduduk.rt',
  'penduduk.rw',
  'penduduk.dusun',
  'penduduk.golDarah',
  'penduduk.gol_darah',
  'penduduk.goldar',
  'penduduk.agama',
  'penduduk.statusPerkawinan',
  'penduduk.status_perkawinan',
  'penduduk.statusKawin',
  'penduduk.wargaNegara',
  'penduduk.warga_negara',
  'penduduk.kewarganegaraan',
  'penduduk.pekerjaan',
  'penduduk.pendidikan',
  'penduduk.telepon',
  'penduduk.email',

  // Keluarga fields
  'keluarga.id',
  'keluarga.noKk',
  'keluarga.no_kk',
  'keluarga.noKK',
  'keluarga.alamat',
  'keluarga.rt',
  'keluarga.rw',
  'keluarga.dusun',

  // Wilayah fields
  'wilayah.dusun',
  'wilayah.rt',
  'wilayah.rw',
  'wilayah.desa',
  'wilayah.kecamatan',
  'wilayah.kabupaten',
  'wilayah.provinsi',

  // Identitas Desa fields
  'desa.id',
  'desa.nama',
  'desa.kode',
  'desa.kodeDesa',
  'desa.kode_desa',
  'desa.singkatan',
  'desa.alamat',
  'desa.kecamatan',
  'desa.kabupaten',
  'desa.provinsi',
  'desa.kepalaDesa',
  'desa.kepala_desa',
  'desa.kades',
  'desa.sekretarisDesa',
  'desa.sekretaris_desa',
  'desa.sekdes',
  'desa.email',
  'desa.telepon',
  'desa.website',
  'desa.logoDesa',
  'desa.logoKabupaten',

  // Pemerintahan fields (standalone)
  'kepala_desa.nama',
  'kepala_desa.nip',
  'kepala_desa.jabatan',
  'sekretaris_desa.nama',
  'sekretaris_desa.nip',
  'sekretaris_desa.jabatan',

  // Surat fields
  'surat.nomor',
  'surat.nomor_surat',
  'surat.tanggal',
  'surat.tanggal_surat',
  'surat.perihal',
  'surat.keperluan',

  // System fields
  'system.tanggalSurat',
  'system.tanggal_surat',
  'system.tanggal',
  'system.nomorSurat',
  'system.nomor_surat',
  'system.nomor',
  'system.penandatangan',
  'system.jabatanPenandatangan',
  'system.jabatan_penandatangan',
  'system.jabatan',
  'system.tahun',
  'system.bulan',
  'system.bulanRomawi',
  'system.hari',
]);

// ============================================================
// Forbidden Patterns
// ============================================================

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\beval\s*\(/i,           // No eval()
  /\brequire\s*\(/i,         // No require()
  /\bprocess\b/,            // No process
  /\bglobal\b/,             // No global
  /\b__/ ,                  // No dunder vars
  /\.\./,                   // No path traversal
  /<script/i,               // No script tags
  /javascript:/i,            // No javascript protocol
  /on\w+=/i,                // No event handlers
  /\{\{.*\}\}/,             // No nested braces (checked separately)
];

// ============================================================
// Validation
// ============================================================

/**
 * Validate a single binding
 */
export function validateBinding(binding: string): { valid: boolean; error?: string } {
  // Check for empty binding
  if (!binding || binding.trim() === '') {
    return { valid: false, error: 'Binding tidak boleh kosong' };
  }

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(binding)) {
      return { valid: false, error: 'Binding mengandung karakter terlarang' };
    }
  }

  // Parse binding and formatter
  const { path } = parseBindingWithFormatter(binding);

  // Must be alphanumeric, dots, underscores
  if (!/^[a-zA-Z][a-zA-Z0-9._]*$/.test(path)) {
    return { valid: false, error: 'Format binding tidak valid' };
  }

  // Must be in whitelist
  if (!ALLOWED_BINDINGS.has(path)) {
    return { valid: false, error: `Binding '${path}' tidak diizinkan` };
  }

  return { valid: true };
}

/**
 * Extract all bindings from a template object
 */
export function extractBindings(obj: unknown): string[] {
  const bindings: string[] = [];

  function traverse(value: unknown): void {
    if (typeof value === 'string') {
      // Find all {{binding}} or {{binding | formatter}} patterns
      const matches = value.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        for (const match of matches) {
          // Extract just the binding path (without {{ and }} and formatter)
          const inner = match.replace(/\{\{|\}\}/g, '');
          const path = inner.split('|')[0].trim();
          bindings.push(path);
        }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        traverse(item);
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [, v] of Object.entries(value)) {
        traverse(v);
      }
    }
  }

  traverse(obj);
  return [...new Set(bindings)];
}

/**
 * Validate all bindings in a template
 */
export function validateTemplateBindings(obj: unknown): {
  valid: boolean;
  errors: string[];
} {
  const bindings = extractBindings(obj);
  const errors: string[] = [];

  for (const binding of bindings) {
    const result = validateBinding(binding);
    if (!result.valid && result.error) {
      errors.push(`${binding}: ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// Resolution
// ============================================================

/**
 * Resolve a single binding path against a data context
 */
function resolvePath(path: string, context: Record<string, unknown>): unknown {
  const parts = path.split('.');
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle arrays
    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (!isNaN(index)) {
        current = current[index];
      } else {
        // Try to find in array objects by key
        current = current.find((item: unknown) => {
          if (typeof item === 'object' && item !== null) {
            return (item as Record<string, unknown>)[part] !== undefined;
          }
          return false;
        });
      }
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Format value for display based on field type
 */
function formatByFieldType(value: unknown, fieldPath: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Date formatting
  if (fieldPath.includes('tanggalLahir') || fieldPath.includes('tanggal_lahir') ||
      fieldPath.includes('tanggal')) {
    const date = value instanceof Date ? value : new Date(String(value));
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }

  // Gender formatting
  if (fieldPath.includes('jenisKelamin') || fieldPath.includes('jenis_kelamin')) {
    const code = String(value).toUpperCase();
    if (code === 'L' || code === 'LAKI-LAKI') return 'Laki-laki';
    if (code === 'P' || code === 'PEREMPUAN') return 'Perempuan';
    return String(value);
  }

  // Boolean formatting
  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }

  return String(value);
}

/**
 * Resolver context type
 */
export interface BindingContext {
  penduduk?: Record<string, unknown>;
  keluarga?: Record<string, unknown>;
  wilayah?: Record<string, unknown>;
  desa?: Record<string, unknown>;
  kepala_desa?: Record<string, unknown>;
  sekretaris_desa?: Record<string, unknown>;
  surat?: Record<string, unknown>;
  system?: Record<string, unknown>;
  custom?: Record<string, unknown>;
}

/**
 * Resolve bindings in a template object with formatter support
 */
export function resolveBinding(
  obj: unknown,
  context: Record<string, unknown>
): unknown {
  function traverse(value: unknown): unknown {
    if (typeof value === 'string') {
      // Replace all {{binding}} or {{binding | formatter}} patterns
      return value.replace(/\{\{([^}]+)\}\}/g, (_, binding: string) => {
        const trimmed = binding.trim();
        const { path, formatter } = parseBindingWithFormatter(trimmed);

        // Validate binding path
        if (!ALLOWED_BINDINGS.has(path)) {
          return `[Invalid: ${path}]`;
        }

        const result = resolvePath(path, context);
        const formatted = formatter
          ? applyFormatter(result, formatter)
          : formatByFieldType(result, path);

        return formatted;
      });
    } else if (Array.isArray(value)) {
      return value.map(item => traverse(item));
    } else if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = traverse(val);
      }
      return result;
    }
    return value;
  }

  return traverse(obj);
}

/**
 * Get default context for a village
 */
export async function getDefaultContext(
  _pendudukId?: bigint,
  _desaId?: bigint
): Promise<BindingContext> {
  // This would typically fetch from database
  // For now, return system date context
  const now = new Date();
  const hariIndonesia = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
  ];

  return {
    penduduk: undefined,
    keluarga: undefined,
    wilayah: undefined,
    desa: undefined,
    kepala_desa: undefined,
    sekretaris_desa: undefined,
    surat: undefined,
    system: {
      tanggal: now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      tahun: now.getFullYear().toString(),
      bulan: now.getMonth() + 1,
      bulanRomawi: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][now.getMonth()],
      hari: hariIndonesia[now.getDay()],
    },
  };
}

/**
 * Get sample data for preview (used in template designer)
 * This data is used for template preview - when a real context is available,
 * use getContextFromDatabase instead
 */
export function getSampleData(): BindingContext {
  const now = new Date();

  // Sample village data for preview (will be replaced by actual database data in production)
  return {
    penduduk: {
      nik: '5203010101010001',
      namaLengkap: 'BAMBANG SURYA ADI',
      tempatLahir: 'Mataram',
      tanggalLahir: new Date(1985, 3, 15),
      jenisKelamin: 'L',
      golDarah: 'O',
      agama: 'Islam',
      statusPerkawinan: 'Kawin',
      alamat: 'Jl. Raya Pringgabaya No. 1',
      rt: '01',
      rw: '02',
      dusun: 'Dusun Seruni',
      pekerjaan: 'Petani',
      wargaNegara: 'Indonesia',
      telepon: '081234567890',
      email: 'bambang@email.com',
    },
    keluarga: {
      noKk: '5203010101010001001',
      alamat: 'Jl. Raya Pringgabaya No. 1',
      rt: '01',
      rw: '02',
      dusun: 'Dusun Seruni',
    },
    wilayah: {
      dusun: 'Dusun Seruni',
      rt: '01',
      rw: '02',
      desa: 'Seruni Mumbul',
      kecamatan: 'Pringgabaya',
      kabupaten: 'Lombok Timur',
      provinsi: 'Nusa Tenggara Barat',
    },
    desa: {
      nama: 'Desa Seruni Mumbul',
      kode: '520301001',
      singkatan: 'SRM',
      kecamatan: 'Pringgabaya',
      kabupaten: 'Lombok Timur',
      provinsi: 'Nusa Tenggara Barat',
      alamat: 'Jl. Raya Pringgabaya, Lombok Timur, NTB',
      email: 'desaserunimumbul@gmail.com',
      telepon: '(0370) 123456',
      website: 'https://desaserunimumbul.desa.id',
    },
    kepala_desa: {
      nama: 'H. Ahmad Zainuri, S.Pd.',
      nip: '197001011990011001',
      jabatan: 'Kepala Desa',
    },
    sekretaris_desa: {
      nama: 'Drs. I Wayan Sukarma',
      nip: '197501152000121001',
      jabatan: 'Sekretaris Desa',
    },
    surat: {
      nomor: '470/001/KADES.SRM/VIII/2026',
      tanggal: now,
      perihal: 'Surat Keterangan Domisili',
      keperluan: 'Untuk keperluan pengurusan administrasi',
    },
    system: {
      tanggal: now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      tahun: now.getFullYear().toString(),
      bulan: now.getMonth() + 1,
      bulanRomawi: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][now.getMonth()],
      hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()],
    },
  };
}

/**
 * Export ALLOWED_BINDINGS for external use
 */
export { ALLOWED_BINDINGS };

/**
 * Get dynamic village context from database
 * This function fetches actual village identity and government data
 */
export async function getVillageContext(prisma: any, desaId: bigint): Promise<{
  desa: Record<string, unknown>;
  kepala_desa: Record<string, unknown>;
  sekretaris_desa: Record<string, unknown>;
}> {
  // Fetch village identity
  const identitas = await prisma.identitasDesa.findUnique({
    where: { desaId },
    include: {
      desa: {
        include: {
          kecamatan: {
            include: {
              kabupaten: {
                include: { provinsi: true }
              }
            }
          }
        }
      }
    }
  });

  if (!identitas) {
    // Return empty context if village identity not configured
    return {
      desa: {},
      kepala_desa: {},
      sekretaris_desa: {},
    };
  }

  // Fetch kepala desa
  const kepalaDesa = await prisma.perangkatDesa.findFirst({
    where: {
      desaId,
      jabatan: { contains: 'KEPALA_DESA', mode: 'insensitive' },
      status: 'AKTIF',
    },
    include: { penduduk: true },
  });

  // Fetch sekretaris desa
  const sekretarisDesa = await prisma.perangkatDesa.findFirst({
    where: {
      desaId,
      jabatan: { contains: 'SEKRETARIS', mode: 'insensitive' },
      status: 'AKTIF',
    },
    include: { penduduk: true },
  });

  return {
    desa: {
      nama: identitas.namaDesa,
      kode: identitas.kodeDesa || identitas.desa.kode,
      singkatan: identitas.singkatanDesa,
      alamat: identitas.alamat,
      telepon: identitas.telepon,
      whatsapp: identitas.whatsapp,
      email: identitas.email,
      website: identitas.website,
      logoDesa: identitas.logoDesaUrl,
      logoKabupaten: identitas.logoKabupatenUrl,
      kecamatan: identitas.desa.kecamatan.nama,
      kabupaten: identitas.desa.kecamatan.kabupaten.nama,
      provinsi: identitas.desa.kecamatan.kabupaten.provinsi.nama,
      kepalaDesa: identitas.kepalaDesa,
      sekretarisDesa: identitas.sekretarisDesa,
    },
    kepala_desa: kepalaDesa ? {
      nama: kepalaDesa.penduduk.namaLengkap,
      nip: kepalaDesa.penduduk.nik,
      jabatan: kepalaDesa.jabatan,
    } : {
      nama: identitas.kepalaDesa || 'Kepala Desa',
      jabatan: 'Kepala Desa',
    },
    sekretaris_desa: sekretarisDesa ? {
      nama: sekretarisDesa.penduduk.namaLengkap,
      nip: sekretarisDesa.penduduk.nik,
      jabatan: sekretarisDesa.jabatan,
    } : {
      nama: identitas.sekretarisDesa || 'Sekretaris Desa',
      jabatan: 'Sekretaris Desa',
    },
  };
}
