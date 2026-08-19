/**
 * Table Resolver Tests
 */

import {
  validateDataSource,
  getDataSourceBase,
  resolveArray,
  validateColumnBinding,
  validateTableConfig,
  extractColumnBindings,
  processRow,
  generateSampleTableData,
} from '../src/utils/table-resolver';

describe('Table Resolver', () => {
  describe('validateDataSource', () => {
    it('should validate known data sources', () => {
      expect(validateDataSource('keluarga.anggota').valid).toBe(true);
      expect(validateDataSource('keluarga.anak').valid).toBe(true);
      expect(validateDataSource('permintaan.item').valid).toBe(true);
    });

    it('should reject empty data source', () => {
      const result = validateDataSource('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('kosong');
    });

    it('should reject path traversal', () => {
      const result = validateDataSource('../../../etc/passwd');
      expect(result.valid).toBe(false);
    });

    it('should reject array index access', () => {
      const result = validateDataSource('items[0].name');
      expect(result.valid).toBe(false);
    });

    it('should reject dangerous patterns', () => {
      const dangerous = [
        'eval("alert(1)")',
        'new Function()',
      ];

      for (const pattern of dangerous) {
        const result = validateDataSource(pattern);
        expect(result.valid).toBe(false);
      }
    });

    it('should accept valid patterns', () => {
      expect(validateDataSource('custom.items').valid).toBe(true);
      expect(validateDataSource('tanah.daftar').valid).toBe(true);
    });
  });

  describe('getDataSourceBase', () => {
    it('should extract base path', () => {
      expect(getDataSourceBase('keluarga.anggota')).toBe('keluarga');
      expect(getDataSourceBase('items.data')).toBe('items');
    });

    it('should return single segment as-is', () => {
      expect(getDataSourceBase('items')).toBe('items');
    });
  });

  describe('resolveArray', () => {
    const context = {
      keluarga: {
        anggota: [
          { nama: 'BAMBANG', nik: '5203010101010001' },
          { nama: 'SITI', nik: '5203010102020002' },
        ],
      },
      items: [
        { name: 'Item 1' },
        { name: 'Item 2' },
      ],
      empty: [],
    };

    it('should resolve array from context', () => {
      const result = resolveArray('keluarga.anggota', context);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ nama: 'BAMBANG', nik: '5203010101010001' });
    });

    it('should resolve simple array', () => {
      const result = resolveArray('items', context);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for non-existent path', () => {
      const result = resolveArray('nonexistent.path', context);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      const result = resolveArray('empty', context);
      expect(result).toEqual([]);
    });

    it('should handle null values', () => {
      const result = resolveArray('nullvalue', { nullvalue: null });
      expect(result).toEqual([]);
    });
  });

  describe('validateColumnBinding', () => {
    it('should validate simple binding', () => {
      expect(validateColumnBinding('nama').valid).toBe(true);
      expect(validateColumnBinding('item.nama').valid).toBe(true);
    });

    it('should validate binding with formatter', () => {
      const result = validateColumnBinding('tanggal | date');
      expect(result.valid).toBe(true);
    });

    it('should validate relative paths', () => {
      expect(validateColumnBinding('item.nama').valid).toBe(true);
      expect(validateColumnBinding('row.nik').valid).toBe(true);
    });

    it('should reject invalid formatter', () => {
      const result = validateColumnBinding('field | invalid_formatter');
      expect(result.valid).toBe(false);
    });

    it('should reject multiple formatters', () => {
      const result = validateColumnBinding('field | a | b');
      expect(result.valid).toBe(false);
    });

    it('should accept all allowed formatters', () => {
      const formatters = [
        'date', 'tanggal_indonesia', 'uppercase', 'lowercase',
        'capitalize', 'currency', 'number', 'nik',
        'bulan_indonesia', 'bulan_romawi', 'hari_indonesia',
        'jenis_kelamin', 'usia', 'telepon',
      ];

      for (const formatter of formatters) {
        const result = validateColumnBinding(`field | ${formatter}`);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('validateTableConfig', () => {
    it('should validate valid config', () => {
      const config = {
        dataSource: 'keluarga.anggota',
        columns: [
          { header: 'Nama', binding: 'nama' },
          { header: 'NIK', binding: 'nik' },
        ],
      };

      const result = validateTableConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require at least one column', () => {
      const config = {
        dataSource: 'items',
        columns: [],
      };

      const result = validateTableConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('minimal satu kolom'))).toBe(true);
    });

    it('should require binding for columns', () => {
      const config = {
        dataSource: 'items',
        columns: [{ header: 'Column' }],
      };

      const result = validateTableConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('binding wajib'))).toBe(true);
    });

    it('should validate column bindings', () => {
      const config = {
        dataSource: 'items',
        columns: [{ header: 'Col', binding: 'field | invalid' }],
      };

      const result = validateTableConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('extractColumnBindings', () => {
    it('should extract bindings from columns', () => {
      const columns = [
        { binding: 'nama' },
        { binding: 'nik' },
        { binding: 'alamat' },
      ];

      const bindings = extractColumnBindings(columns);
      expect(bindings).toContain('nama');
      expect(bindings).toContain('nik');
      expect(bindings).toContain('alamat');
    });

    it('should ignore columns without binding', () => {
      const columns = [
        { header: 'No Data' },
        { binding: 'nama' },
      ];

      const bindings = extractColumnBindings(columns);
      expect(bindings).toHaveLength(1);
    });
  });

  describe('processRow', () => {
    const formatters = {
      uppercase: (v: unknown) => String(v).toUpperCase(),
      date: (v: unknown) => {
        if (v instanceof Date) {
          return v.toLocaleDateString('id-ID');
        }
        return String(v);
      },
    };

    it('should process row with bindings', () => {
      const row = { nama: 'bambang', nik: '5203010101010001' };
      const columnBindings = [
        { path: 'nama' },
        { path: 'nik' },
      ];

      const result = processRow(row, columnBindings, formatters);
      expect(result.nama).toBe('bambang');
      expect(result.nik).toBe('5203010101010001');
    });

    it('should apply formatter when specified', () => {
      const row = { nama: 'bambang' };
      const columnBindings = [
        { path: 'nama', formatter: 'uppercase' },
      ];

      const result = processRow(row, columnBindings, formatters);
      expect(result.nama).toBe('BAMBANG');
    });

    it('should handle missing values', () => {
      const row = { nama: 'bambang' };
      const columnBindings = [
        { path: 'nonexistent' },
      ];

      const result = processRow(row, columnBindings, formatters);
      expect(result.nonexistent).toBe('');
    });
  });

  describe('generateSampleTableData', () => {
    it('should generate anggota data', () => {
      const data = generateSampleTableData('keluarga.anggota') as Array<Record<string, string>>;
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('nama');
      expect(data[0]).toHaveProperty('nik');
    });

    it('should generate barang data', () => {
      const data = generateSampleTableData('permintaan.barang') as Array<Record<string, string>>;
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('nama');
      expect(data[0]).toHaveProperty('jumlah');
    });

    it('should generate generic data for unknown sources', () => {
      const data = generateSampleTableData('unknown.source') as Array<Record<string, string>>;
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('no');
    });
  });
});
