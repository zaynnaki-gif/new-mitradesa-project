/**
 * Formatter Registry
 *
 * Safe formatters for template binding output.
 * NO arbitrary function execution - all formatters are whitelisted.
 */

// ============================================================
// Type Definitions
// ============================================================

export type FormatterType = 'date' | 'tanggal_indonesia' | 'currency' | 'uppercase' |
  'lowercase' | 'capitalize' | 'number' | 'nik' | 'bulan_indonesia' | 'hari_indonesia' |
  'bulan_romawi' | 'usia' | 'jenis_kelamin' | 'telepon';

export interface FormatterDefinition {
  name: FormatterType;
  label: string;
  description: string;
  example: string;
}

// ============================================================
// Formatter Functions
// ============================================================

/**
 * Format date to dd-MM-yyyy
 */
function formatDate(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date to Indonesian format: 17 Agustus 2026
 */
function formatTanggalIndonesia(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return String(value);
  const bulanIndonesia = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const hariIndonesia = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
  ];
  return `${hariIndonesia[date.getDay()]}, ${date.getDate()} ${bulanIndonesia[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format currency to Indonesian Rupiah
 */
function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Convert to uppercase
 */
function formatUppercase(value: unknown): string {
  if (!value) return '';
  return String(value).toUpperCase();
}

/**
 * Convert to lowercase
 */
function formatLowercase(value: unknown): string {
  if (!value) return '';
  return String(value).toLowerCase();
}

/**
 * Capitalize first letter of each word
 */
function formatCapitalize(value: unknown): string {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

/**
 * Format number with thousand separators
 */
function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Mask NIK (show only first 6 and last 1 digit)
 */
function formatNIK(value: unknown): string {
  if (!value) return '';
  const str = String(value);
  if (str.length < 6) return str;
  return `${str.slice(0, 6)}${'*'.repeat(Math.max(0, str.length - 7))}${str.slice(-1)}`;
}

/**
 * Get month name in Indonesian
 */
function formatBulanIndonesia(value: unknown): string {
  if (!value) return '';
  let month = typeof value === 'number' ? value - 1 : parseInt(String(value)) - 1;
  if (isNaN(month)) month = new Date().getMonth();
  const bulanIndonesia = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return bulanIndonesia[Math.max(0, Math.min(11, month))];
}

/**
 * Get day name in Indonesian
 */
function formatHariIndonesia(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return String(value);
  const hariIndonesia = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
  ];
  return hariIndonesia[date.getDay()];
}

/**
 * Get Roman numeral for month
 */
function formatBulanRomawi(value: unknown): string {
  if (!value) return '';
  let month = typeof value === 'number' ? value - 1 : parseInt(String(value)) - 1;
  if (isNaN(month)) month = new Date().getMonth();
  const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return bulanRomawi[Math.max(0, Math.min(11, month))];
}

/**
 * Format age from date of birth
 */
function formatUsia(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return String(value);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return `${age} tahun`;
}

/**
 * Convert gender code to full text
 */
function formatJenisKelamin(value: unknown): string {
  if (!value) return '';
  const code = String(value).toUpperCase();
  if (code === 'L' || code === 'LAKI-LAKI' || code === '1') return 'Laki-laki';
  if (code === 'P' || code === 'PEREMPUAN' || code === '2') return 'Perempuan';
  return String(value);
}

/**
 * Format telephone number
 */
function formatTelepon(value: unknown): string {
  if (!value) return '';
  const str = String(value);
  if (str.startsWith('0')) {
    return `+62 ${str.slice(1)}`;
  }
  return str;
}

// ============================================================
// Formatter Registry
// ============================================================

export const FORMATTERS: Record<FormatterType, (value: unknown) => string> = {
  date: formatDate,
  tanggal_indonesia: formatTanggalIndonesia,
  currency: formatCurrency,
  uppercase: formatUppercase,
  lowercase: formatLowercase,
  capitalize: formatCapitalize,
  number: formatNumber,
  nik: formatNIK,
  bulan_indonesia: formatBulanIndonesia,
  hari_indonesia: formatHariIndonesia,
  bulan_romawi: formatBulanRomawi,
  usia: formatUsia,
  jenis_kelamin: formatJenisKelamin,
  telepon: formatTelepon,
};

/**
 * Apply formatter to a value
 */
export function applyFormatter(value: unknown, formatterName: string): string {
  const formatter = FORMATTERS[formatterName as FormatterType];
  if (!formatter) {
    // Unknown formatter, return value as-is
    return value === null || value === undefined ? '' : String(value);
  }
  return formatter(value);
}

/**
 * Get all available formatters with metadata
 */
export function getAvailableFormatters(): FormatterDefinition[] {
  return [
    {
      name: 'date',
      label: 'Tanggal',
      description: 'Format tanggal (dd-mm-yyyy)',
      example: '{{tanggal | date}} → 17-08-2026',
    },
    {
      name: 'tanggal_indonesia',
      label: 'Tanggal Indonesia',
      description: 'Format tanggal lengkap Indonesia',
      example: '{{tanggal | tanggal_indonesia}} → 17 Agustus 2026',
    },
    {
      name: 'currency',
      label: 'Mata Uang',
      description: 'Format mata uang Rupiah Indonesia',
      example: '{{jumlah | currency}} → Rp1.500.000',
    },
    {
      name: 'uppercase',
      label: 'Huruf Besar',
      description: 'Konversi ke huruf kapital',
      example: '{{nama | uppercase}} → BAMBANG SURYA',
    },
    {
      name: 'lowercase',
      label: 'Huruf Kecil',
      description: 'Konversi ke huruf kecil',
      example: '{{email | lowercase}} → bambang@email.com',
    },
    {
      name: 'capitalize',
      label: 'Kapitalisasi',
      description: 'Huruf pertama setiap kata kapital',
      example: '{{nama | capitalize}} → Bambang Surya',
    },
    {
      name: 'number',
      label: 'Angka',
      description: 'Format angka dengan pemisah ribuan',
      example: '{{jumlah | number}} → 1.500.000',
    },
    {
      name: 'nik',
      label: 'NIK (Masked)',
      description: 'Tampilkan NIK dengan masking',
      example: '{{nik | nik}} → 5203******4',
    },
    {
      name: 'bulan_indonesia',
      label: 'Nama Bulan',
      description: 'Nama bulan dalam Bahasa Indonesia',
      example: '{{bulan | bulan_indonesia}} → Agustus',
    },
    {
      name: 'hari_indonesia',
      label: 'Nama Hari',
      description: 'Nama hari dalam Bahasa Indonesia',
      example: '{{tanggal | hari_indonesia}} → Senin',
    },
    {
      name: 'bulan_romawi',
      label: 'Bulan Romawi',
      description: 'Bulan dalam angka Romawi',
      example: '{{bulan | bulan_romawi}} → VIII',
    },
    {
      name: 'usia',
      label: 'Usia',
      description: 'Hitung usia dari tanggal lahir',
      example: '{{tanggal_lahir | usia}} → 40 tahun',
    },
    {
      name: 'jenis_kelamin',
      label: 'Jenis Kelamin',
      description: 'Format jenis kelamin (L/P)',
      example: '{{jenis_kelamin | jenis_kelamin}} → Laki-laki',
    },
    {
      name: 'telepon',
      label: 'Telepon',
      description: 'Format nomor telepon Indonesia',
      example: '{{telepon | telepon}} → +62 81234567890',
    },
  ];
}

/**
 * Check if a formatter name is valid
 */
export function isValidFormatter(formatterName: string): boolean {
  return formatterName in FORMATTERS;
}

/**
 * Parse binding with formatter
 * Format: {{path | formatter}}
 */
export function parseBindingWithFormatter(binding: string): {
  path: string;
  formatter?: string;
} {
  const match = binding.match(/^\{\{([^|]+)(?:\|(\w+))?\}\}$/);
  if (match) {
    return {
      path: match[1].trim(),
      formatter: match[2]?.trim(),
    };
  }
  return { path: binding };
}

// ============================================================
// Binding Metadata for UI
// ============================================================

export interface BindingDefinition {
  path: string;
  category: string;
  label: string;
  description: string;
  example: string;
}

/**
 * Get all available bindings for template designer
 */
export function getAvailableBindings(): BindingDefinition[] {
  return [
    // Penduduk fields
    { path: 'penduduk.nik', category: 'Penduduk', label: 'NIK', description: 'Nomor Induk Kependudukan', example: '{{penduduk.nik}}' },
    { path: 'penduduk.namaLengkap', category: 'Penduduk', label: 'Nama Lengkap', description: 'Nama lengkap penduduk', example: '{{penduduk.namaLengkap}}' },
    { path: 'penduduk.tempatLahir', category: 'Penduduk', label: 'Tempat Lahir', description: 'Tempat lahir', example: '{{penduduk.tempatLahir}}' },
    { path: 'penduduk.tanggalLahir', category: 'Penduduk', label: 'Tanggal Lahir', description: 'Tanggal lahir', example: '{{penduduk.tanggalLahir | tanggal_indonesia}}' },
    { path: 'penduduk.jenisKelamin', category: 'Penduduk', label: 'Jenis Kelamin', description: 'Laki-laki / Perempuan', example: '{{penduduk.jenisKelamin}}' },
    { path: 'penduduk.alamat', category: 'Penduduk', label: 'Alamat', description: 'Alamat lengkap', example: '{{penduduk.alamat}}' },
    { path: 'penduduk.rt', category: 'Penduduk', label: 'RT', description: 'Nomor RT', example: '{{penduduk.rt}}' },
    { path: 'penduduk.rw', category: 'Penduduk', label: 'RW', description: 'Nomor RW', example: '{{penduduk.rw}}' },
    { path: 'penduduk.dusun', category: 'Penduduk', label: 'Dusun', description: 'Nama dusun', example: '{{penduduk.dusun}}' },
    { path: 'penduduk.golDarah', category: 'Penduduk', label: 'Golongan Darah', description: 'Golongan darah', example: '{{penduduk.golDarah}}' },
    { path: 'penduduk.agama', category: 'Penduduk', label: 'Agama', description: 'Agama', example: '{{penduduk.agama}}' },
    { path: 'penduduk.statusPerkawinan', category: 'Penduduk', label: 'Status Kawin', description: 'Status perkawinan', example: '{{penduduk.statusPerkawinan}}' },
    { path: 'penduduk.pekerjaan', category: 'Penduduk', label: 'Pekerjaan', description: 'Pekerjaan', example: '{{penduduk.pekerjaan}}' },
    { path: 'penduduk.wargaNegara', category: 'Penduduk', label: 'Kewarganegaraan', description: 'Kewarganegaraan', example: '{{penduduk.wargaNegara}}' },

    // Keluarga fields
    { path: 'keluarga.noKk', category: 'Keluarga', label: 'Nomor KK', description: 'Nomor Kartu Keluarga', example: '{{keluarga.noKk}}' },
    { path: 'keluarga.alamat', category: 'Keluarga', label: 'Alamat KK', description: 'Alamat keluarga', example: '{{keluarga.alamat}}' },
    { path: 'keluarga.rt', category: 'Keluarga', label: 'RT KK', description: 'RT keluarga', example: '{{keluarga.rt}}' },
    { path: 'keluarga.rw', category: 'Keluarga', label: 'RW KK', description: 'RW keluarga', example: '{{keluarga.rw}}' },
    { path: 'keluarga.dusun', category: 'Keluarga', label: 'Dusun KK', description: 'Dusun keluarga', example: '{{keluarga.dusun}}' },

    // Wilayah fields
    { path: 'wilayah.dusun', category: 'Wilayah', label: 'Nama Dorf', description: 'Nama dusun', example: '{{wilayah.dusun}}' },
    { path: 'wilayah.rt', category: 'Wilayah', label: 'Nomor RT', description: 'Nomor RT', example: '{{wilayah.rt}}' },
    { path: 'wilayah.rw', category: 'Wilayah', label: 'Nomor RW', description: 'Nomor RW', example: '{{wilayah.rw}}' },

    // Desa fields
    { path: 'desa.nama', category: 'Desa', label: 'Nama Desa', description: 'Nama desa', example: '{{desa.nama}}' },
    { path: 'desa.kode', category: 'Desa', label: 'Kode Desa', description: 'Kode desa', example: '{{desa.kode}}' },
    { path: 'desa.kecamatan', category: 'Desa', label: 'Kecamatan', description: 'Nama kecamatan', example: '{{desa.kecamatan}}' },
    { path: 'desa.kabupaten', category: 'Desa', label: 'Kabupaten', description: 'Nama kabupaten', example: '{{desa.kabupaten}}' },
    { path: 'desa.provinsi', category: 'Desa', label: 'Provinsi', description: 'Nama provinsi', example: '{{desa.provinsi}}' },
    { path: 'desa.alamat', category: 'Desa', label: 'Alamat Kantor', description: 'Alamat kantor desa', example: '{{desa.alamat}}' },
    { path: 'desa.email', category: 'Desa', label: 'Email Desa', description: 'Email kantor desa', example: '{{desa.email}}' },
    { path: 'desa.telepon', category: 'Desa', label: 'Telepon Desa', description: 'Nomor telepon', example: '{{desa.telepon}}' },

    // Pemerintahan fields
    { path: 'kepala_desa.nama', category: 'Pemerintahan', label: 'Nama Kepala Desa', description: 'Nama lengkap kepala desa', example: '{{kepala_desa.nama}}' },
    { path: 'kepala_desa.nip', category: 'Pemerintahan', label: 'NIP Kepala Desa', description: 'NIP kepala desa', example: '{{kepala_desa.nip}}' },
    { path: 'sekretaris_desa.nama', category: 'Pemerintahan', label: 'Nama Sekretaris', description: 'Nama sekretaris desa', example: '{{sekretaris_desa.nama}}' },
    { path: 'sekretaris_desa.nip', category: 'Pemerintahan', label: 'NIP Sekretaris', description: 'NIP sekretaris desa', example: '{{sekretaris_desa.nip}}' },

    // System fields
    { path: 'surat.nomor', category: 'Surat', label: 'Nomor Surat', description: 'Nomor dokumen', example: '{{surat.nomor}}' },
    { path: 'surat.tanggal', category: 'Surat', label: 'Tanggal Surat', description: 'Tanggal surat', example: '{{surat.tanggal | tanggal_indonesia}}' },
    { path: 'surat.perihal', category: 'Surat', label: 'Perihal', description: 'Perihal surat', example: '{{surat.perihal}}' },
    { path: 'surat.keperluan', category: 'Surat', label: 'Keperluan', description: 'Keperluan surat', example: '{{surat.keperluan}}' },

    // System
    { path: 'system.tanggal', category: 'Sistem', label: 'Tanggal Sekarang', description: 'Tanggal saat ini', example: '{{system.tanggal | tanggal_indonesia}}' },
    { path: 'system.tahun', category: 'Sistem', label: 'Tahun', description: 'Tahun saat ini', example: '{{system.tahun}}' },
    { path: 'system.bulan', category: 'Sistem', label: 'Nama Bulan', description: 'Bulan saat ini', example: '{{system.bulan | bulan_indonesia}}' },
    { path: 'system.bulanRomawi', category: 'Sistem', label: 'Bulan Romawi', description: 'Bulan dalam angka romawi', example: '{{system.bulanRomawi}}' },
    { path: 'system.hari', category: 'Sistem', label: 'Hari', description: 'Nama hari saat ini', example: '{{system.hari | hari_indonesia}}' },
  ];
}

/**
 * Group bindings by category for UI
 */
export function getBindingsByCategory(): Record<string, BindingDefinition[]> {
  const bindings = getAvailableBindings();
  const grouped: Record<string, BindingDefinition[]> = {};
  for (const binding of bindings) {
    if (!grouped[binding.category]) {
      grouped[binding.category] = [];
    }
    grouped[binding.category].push(binding);
  }
  return grouped;
}
