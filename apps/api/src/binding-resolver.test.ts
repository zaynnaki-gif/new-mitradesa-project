/**
 * Unit Tests for Binding Resolver
 */

import {
  validateBinding,
  validateTemplateBindings,
  extractBindings,
  resolveBinding,
  getSampleData,
  ALLOWED_BINDINGS,
} from '../src/utils/binding-resolver.js';

import {
  applyFormatter,
  getAvailableFormatters,
  getBindingsByCategory,
} from '../src/utils/formatter-registry.js';

describe('Binding Validation', () => {
  describe('validateBinding', () => {
    it('should accept valid penduduk bindings', () => {
      expect(validateBinding('penduduk.namaLengkap').valid).toBe(true);
      expect(validateBinding('penduduk.nik').valid).toBe(true);
      expect(validateBinding('penduduk.tanggalLahir').valid).toBe(true);
    });

    it('should accept valid keluarga bindings', () => {
      expect(validateBinding('keluarga.noKk').valid).toBe(true);
      expect(validateBinding('keluarga.alamat').valid).toBe(true);
    });

    it('should accept valid desa bindings', () => {
      expect(validateBinding('desa.nama').valid).toBe(true);
      expect(validateBinding('desa.kecamatan').valid).toBe(true);
    });

    it('should accept valid system bindings', () => {
      expect(validateBinding('system.tanggal').valid).toBe(true);
      expect(validateBinding('system.tahun').valid).toBe(true);
    });

    it('should reject invalid bindings', () => {
      const result = validateBinding('invalid.path');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tidak diizinkan');
    });

    it('should reject empty binding', () => {
      const result = validateBinding('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('kosong');
    });

    it('should reject forbidden patterns', () => {
      expect(validateBinding('eval("console.log(1)').valid).toBe(false);
      expect(validateBinding('require("fs")').valid).toBe(false);
    });
  });

  describe('extractBindings', () => {
    it('should extract bindings from object', () => {
      const obj = {
        name: 'Name: {{penduduk.namaLengkap}}, NIK: {{penduduk.nik}}',
        other: 'No binding here',
      };
      const bindings = extractBindings(obj);
      expect(bindings).toContain('penduduk.namaLengkap');
      expect(bindings).toContain('penduduk.nik');
    });

    it('should extract nested bindings', () => {
      const obj = {
        sections: {
          body: {
            elements: ['Text {{surat.nomor}}'],
          },
        },
      };
      const bindings = extractBindings(obj);
      expect(bindings).toContain('surat.nomor');
    });

    it('should deduplicate bindings', () => {
      const obj = {
        text: '{{penduduk.namaLengkap}} and {{penduduk.namaLengkap}} again',
      };
      const bindings = extractBindings(obj);
      const filtered = bindings.filter((b) => b === 'penduduk.namaLengkap');
      expect(filtered).toHaveLength(1);
    });
  });

  describe('validateTemplateBindings', () => {
    it('should validate template with valid bindings', () => {
      const template = {
        name: 'Name: {{penduduk.namaLengkap}}',
      };
      const result = validateTemplateBindings(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all errors for invalid bindings', () => {
      const template = {
        name: '{{invalid.field}}',
      };
      const result = validateTemplateBindings(template);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Binding Resolution', () => {
  describe('resolveBinding', () => {
    it('should resolve simple bindings', () => {
      const content = {
        text: 'Name: {{penduduk.namaLengkap}}',
      };
      const context = {
        penduduk: {
          namaLengkap: 'Bambang Surya',
        },
      };
      const result = resolveBinding(content, context);
      expect(result).toEqual({
        text: 'Name: Bambang Surya',
      });
    });

    it('should handle missing values gracefully', () => {
      const content = {
        text: '{{penduduk.namaLengkap}}',
      };
      const context = {
        penduduk: {},
      };
      const result = resolveBinding(content, context);
      expect(result).toEqual({ text: '' });
    });
  });

  describe('getSampleData', () => {
    it('should return sample context with all required keys', () => {
      const sample = getSampleData();
      expect(sample.penduduk).toBeDefined();
      expect(sample.keluarga).toBeDefined();
      expect(sample.system).toBeDefined();
    });
  });
});

describe('Formatter Registry', () => {
  describe('applyFormatter', () => {
    it('should apply uppercase formatter', () => {
      const result = applyFormatter('hello world', 'uppercase');
      expect(result).toBe('HELLO WORLD');
    });

    it('should apply lowercase formatter', () => {
      const result = applyFormatter('HELLO WORLD', 'lowercase');
      expect(result).toBe('hello world');
    });

    it('should apply capitalize formatter', () => {
      const result = applyFormatter('hello world', 'capitalize');
      expect(result).toBe('Hello World');
    });

    it('should apply number formatter', () => {
      const result = applyFormatter(1500000, 'number');
      expect(result).toBe('1.500.000');
    });

    it('should handle unknown formatter by returning value as string', () => {
      const result = applyFormatter('test', 'unknown_formatter');
      expect(result).toBe('test');
    });

    it('should handle null/undefined values', () => {
      expect(applyFormatter(null, 'uppercase')).toBe('');
      expect(applyFormatter(undefined, 'uppercase')).toBe('');
    });
  });

  describe('getAvailableFormatters', () => {
    it('should return array of formatters with required fields', () => {
      const formatters = getAvailableFormatters();
      expect(Array.isArray(formatters)).toBe(true);
      expect(formatters.length).toBeGreaterThan(0);
      formatters.forEach((f) => {
        expect(f.name).toBeDefined();
        expect(f.label).toBeDefined();
      });
    });
  });

  describe('getBindingsByCategory', () => {
    it('should group bindings by category', () => {
      const grouped = getBindingsByCategory();
      expect(Object.keys(grouped).length).toBeGreaterThan(0);
      Object.values(grouped).forEach((bindings) => {
        bindings.forEach((b) => {
          expect(b.path).toBeDefined();
        });
      });
    });
  });
});

describe('ALLOWED_BINDINGS', () => {
  it('should include common penduduk fields', () => {
    expect(ALLOWED_BINDINGS.has('penduduk.namaLengkap')).toBe(true);
    expect(ALLOWED_BINDINGS.has('penduduk.nik')).toBe(true);
    expect(ALLOWED_BINDINGS.has('penduduk.tanggalLahir')).toBe(true);
  });

  it('should include keluarga fields', () => {
    expect(ALLOWED_BINDINGS.has('keluarga.noKk')).toBe(true);
    expect(ALLOWED_BINDINGS.has('keluarga.alamat')).toBe(true);
  });

  it('should include system fields', () => {
    expect(ALLOWED_BINDINGS.has('system.tanggal')).toBe(true);
    expect(ALLOWED_BINDINGS.has('system.tahun')).toBe(true);
    expect(ALLOWED_BINDINGS.has('system.bulanRomawi')).toBe(true);
  });
});
