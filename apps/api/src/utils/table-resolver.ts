/**
 * Table Resolver
 *
 * Handles array iteration (repeaters) in templates.
 * Safe array traversal with whitelist validation.
 */

import { ALLOWED_BINDINGS } from './binding-resolver.js';

// ============================================================
// Types
// ============================================================

export interface TableRow {
  [key: string]: unknown;
}

export interface TableData {
  headers: string[];
  rows: TableRow[];
  dataSource: string;
}

export interface RepeaterContext {
  [key: string]: TableRow[] | unknown;
}

// ============================================================
// Data Source Validation
// ============================================================

/**
 * Allowed data source patterns for table/repeater
 */
const ALLOWED_DATA_SOURCES: string[] = [
  'keluarga.anggota',
  'keluarga.anggotaKeluarga',
  'keluarga.anak',
  'keluarga.penerimaBantuan',
  'permintaan.barang',
  'permintaan.item',
  'tanah.daftar',
  'pajak.daftar',
  'custom',
];

/**
 * Validate a data source binding path
 */
export function validateDataSource(binding: string): { valid: boolean; error?: string } {
  if (!binding || binding.trim() === '') {
    return { valid: false, error: 'Data source tidak boleh kosong' };
  }

  // Check for dangerous patterns
  const dangerous = [
    /\beval\s*\(/i,
    /\bFunction\s*\(/i,
    /\bconstructor\s*\(/i,
    /\[\s*\d+\s*\]\s*\./,  // Array index access like [0].
    /\.\.\//,               // Path traversal
  ];

  for (const pattern of dangerous) {
    if (pattern.test(binding)) {
      return { valid: false, error: 'Data source mengandung karakter terlarang' };
    }
  }

  // Check if it's a known pattern or contains allowed prefix
  const isKnownPattern = ALLOWED_DATA_SOURCES.includes(binding);
  const hasAllowedPrefix =
    binding.startsWith('keluarga.') ||
    binding.startsWith('permintaan.') ||
    binding.startsWith('tanah.') ||
    binding.startsWith('pajak.') ||
    binding.startsWith('custom.');

  if (!isKnownPattern && !hasAllowedPrefix) {
    // Allow any binding that matches the pattern but warn
    if (!/^[a-zA-Z][a-zA-Z0-9._]*$/.test(binding)) {
      return { valid: false, error: 'Format data source tidak valid' };
    }
  }

  return { valid: true };
}

/**
 * Get the base binding path for a data source
 * e.g., 'keluarga.anggota' -> 'keluarga'
 */
export function getDataSourceBase(binding: string): string {
  const parts = binding.split('.');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('.');
  }
  return parts[0];
}

// ============================================================
// Array Resolution
// ============================================================

/**
 * Resolve an array from context
 */
export function resolveArray(
  dataSource: string,
  context: Record<string, unknown>
): unknown[] {
  const parts = dataSource.split('.');
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return [];
    }

    if (Array.isArray(current)) {
      // If we're at an array, check if next part is an index
      const index = parseInt(part, 10);
      if (!isNaN(index) && index >= 0 && index < current.length) {
        current = current[index];
      } else {
        // Try to find property in array items
        current = current.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return (item as Record<string, unknown>)[part];
          }
          return undefined;
        }).filter((item) => item !== undefined);
      }
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return [];
    }
  }

  if (Array.isArray(current)) {
    return current;
  }

  if (current === null || current === undefined) {
    return [];
  }

  // If it's not an array but has items property
  if (typeof current === 'object') {
    const obj = current as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return obj.items;
    }
    if (Array.isArray(obj.data)) {
      return obj.data;
    }
    if (Array.isArray(obj.rows)) {
      return obj.rows;
    }
  }

  return [];
}

// ============================================================
// Table Column Binding
// ============================================================

export interface ColumnBinding {
  path: string;
  formatter?: string;
}

/**
 * Validate column binding path
 * For table columns, we allow relative paths (relative to row context)
 * and paths from the allowed bindings
 */
export function validateColumnBinding(binding: string): { valid: boolean; error?: string } {
  // Check if it's a direct binding or a binding with formatter
  const parts = binding.split('|').map((p) => p.trim());

  if (parts.length > 2) {
    return { valid: false, error: 'Format binding tidak valid' };
  }

  const path = parts[0];

  // Validate path format
  if (!/^[a-zA-Z_][a-zA-Z0-9._]*$/.test(path)) {
    return { valid: false, error: 'Format path tidak valid' };
  }

  // For table columns, we allow:
  // 1. Relative paths (single word like 'nama', 'nik')
  // 2. item.path or row.path (relative to row context)
  // 3. Full paths from allowed bindings
  const isSingleWord = !path.includes('.');
  const isRelativePath = path.startsWith('item.') || path.startsWith('row.') || path.startsWith('$');
  const isAllowedPath = ALLOWED_BINDINGS.has(path);

  // Check if first segment is in allowed base paths
  const basePath = path.split('.')[0];
  const allowedBasePaths = [
    'penduduk', 'keluarga', 'desa', 'wilayah',
    'kepala_desa', 'sekretaris_desa', 'surat', 'system',
    'item', 'row', 'anggota', 'anak', 'custom',
  ];

  const isAllowedBase = allowedBasePaths.includes(basePath);

  if (!isSingleWord && !isRelativePath && !isAllowedPath && !isAllowedBase) {
    return { valid: false, error: `Path '${path}' tidak diizinkan` };
  }

  // Validate formatter if present
  if (parts.length > 1) {
    const formatter = parts[1];
    const allowedFormatters = [
      'date', 'tanggal_indonesia', 'uppercase', 'lowercase',
      'capitalize', 'currency', 'number', 'nik',
      'bulan_indonesia', 'bulan_romawi', 'hari_indonesia',
      'jenis_kelamin', 'usia', 'telepon',
    ];

    if (!allowedFormatters.includes(formatter)) {
      return { valid: false, error: `Formatter '${formatter}' tidak diizinkan` };
    }
  }

  return { valid: true };
}

/**
 * Extract column bindings from table config
 */
export function extractColumnBindings(columns: Array<{ binding?: string }>): string[] {
  const bindings: string[] = [];

  for (const column of columns) {
    if (column.binding) {
      // Remove formatter if present
      const path = column.binding.split('|')[0].trim();
      bindings.push(path);
    }
  }

  return bindings;
}

// ============================================================
// Row Processing
// ============================================================

/**
 * Process a single row with bindings
 */
export function processRow(
  row: TableRow,
  columnBindings: ColumnBinding[],
  formatters: Record<string, (value: unknown) => string>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const col of columnBindings) {
    const value = resolveRowValue(col.path, row);
    const formatted = col.formatter && formatters[col.formatter]
      ? formatters[col.formatter](value)
      : formatDefaultValue(value);
    result[col.path] = formatted;
  }

  return result;
}

/**
 * Resolve a binding path within a row context
 */
function resolveRowValue(path: string, row: TableRow): unknown {
  // Handle relative paths
  if (path.startsWith('item.') || path.startsWith('row.')) {
    const actualPath = path.substring(path.indexOf('.') + 1);
    return row[actualPath];
  }

  // Handle direct property
  if (row.hasOwnProperty(path)) {
    return row[path];
  }

  // Handle nested paths
  const parts = path.split('.');
  let current: unknown = row;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Default value formatter
 */
function formatDefaultValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }

  return String(value);
}

// ============================================================
// Repeater Template Processing
// ============================================================

/**
 * Process repeater section in template content
 */
export interface RepeaterSection {
  dataSource: string;
  content: string;
  columns?: Array<{
    header: string;
    binding: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
}

const REPEATER_PATTERN = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

/**
 * Extract all repeater sections from content
 */
export function extractRepeaters(content: string): RepeaterSection[] {
  const repeaters: RepeaterSection[] = [];
  let match;

  while ((match = REPEATER_PATTERN.exec(content)) !== null) {
    const dataSource = match[1].trim();
    const innerContent = match[2];

    // Validate data source
    const validation = validateDataSource(dataSource);
    if (!validation.valid) {
      continue;
    }

    repeaters.push({
      dataSource,
      content: innerContent,
    });
  }

  return repeaters;
}

/**
 * Process repeater sections with data
 */
export function processRepeaters(
  content: string,
  dataSource: string,
  data: unknown[],
  formatters: Record<string, (value: unknown) => string>
): string {
  // Find the repeater pattern
  const pattern = new RegExp(
    `\\{\\{#each\\s+${escapeRegex(dataSource)}\\}\\}([\\s\\S]*?)\\{\\{\\/each\\}\\}`,
    'g'
  );

  return content.replace(pattern, (_match, innerContent: string) => {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const processedRows: string[] = [];

    for (const row of data) {
      let processedRow = innerContent;

      // Replace bindings in row context
      processedRow = replaceRowBindings(processedRow, row as TableRow, formatters);

      processedRows.push(processedRow);
    }

    return processedRows.join('\n');
  });
}

/**
 * Replace bindings within a row context
 */
function replaceRowBindings(
  content: string,
  row: TableRow,
  formatters: Record<string, (value: unknown) => string>
): string {
  // Pattern: {{binding}} or {{binding | formatter}}
  const bindingPattern = /\{\{([^}|]+)(?:\|([^}]+))?\}\}/g;

  return content.replace(bindingPattern, (_match, path: string, formatter?: string) => {
    const trimmedPath = path.trim();
    let value = resolveRowValue(trimmedPath, row);

    // Apply formatter if specified
    if (formatter && formatters[formatter.trim()]) {
      value = formatters[formatter.trim()](value);
    } else {
      value = formatDefaultValue(value);
    }

    return String(value);
  });
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// Sample Data for Preview
// ============================================================

/**
 * Generate sample data for table preview
 */
export function generateSampleTableData(dataSource: string): unknown[] {
  // Generate appropriate sample data based on data source
  if (dataSource.includes('anggota') || dataSource.includes('keluarga')) {
    return [
      { nama: 'BAMBANG SURYA ADI', nik: '5203010101010001', hubungan: 'Kepala Keluarga' },
      { nama: 'SITI RAHAYU', nik: '5203010102020002', hubungan: 'Istri' },
      { nama: 'AHMAD FAISAL', nik: '5203010103030003', hubungan: 'Anak' },
      { nama: 'NURUL HIDAYAH', nik: '5203010104040004', hubungan: 'Anak' },
    ];
  }

  if (dataSource.includes('barang') || dataSource.includes('item')) {
    return [
      { nama: 'Laptop ASUS ROG', jumlah: 1, satuan: 'Unit' },
      { nama: 'Mouse Wireless', jumlah: 2, satuan: 'Buah' },
      { nama: 'Keyboard Mechanical', jumlah: 1, satuan: 'Unit' },
    ];
  }

  if (dataSource.includes('tanah')) {
    return [
      { no: 1, luas: '500', satuan: 'm²', klasifikasi: 'Sawah', lokasi: 'Dusun Seruni' },
      { no: 2, luas: '1000', satuan: 'm²', klasifikasi: 'Tegal', lokasi: 'Dusun Mumbul' },
    ];
  }

  if (dataSource.includes('pajak')) {
    return [
      { tahun: '2024', jenis: 'PBB', jumlah: '500000', status: 'Lunas' },
      { tahun: '2023', jenis: 'PBB', jumlah: '450000', status: 'Lunas' },
    ];
  }

  // Generic sample
  return [
    { no: 1, keterangan: 'Item pertama' },
    { no: 2, keterangan: 'Item kedua' },
    { no: 3, keterangan: 'Item ketiga' },
  ];
}

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Validate entire table configuration
 */
export function validateTableConfig(config: {
  dataSource: string;
  columns: Array<{ header?: string; binding?: string }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate data source
  const dsValidation = validateDataSource(config.dataSource);
  if (!dsValidation.valid) {
    errors.push(`Data source: ${dsValidation.error}`);
  }

  // Validate columns
  if (!config.columns || config.columns.length === 0) {
    errors.push('Table harus memiliki minimal satu kolom');
  }

  for (let i = 0; i < config.columns.length; i++) {
    const col = config.columns[i];

    if (!col.binding) {
      errors.push(`Kolom ${i + 1}: binding wajib diisi`);
      continue;
    }

    const bindingValidation = validateColumnBinding(col.binding);
    if (!bindingValidation.valid) {
      errors.push(`Kolom ${i + 1}: ${bindingValidation.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
