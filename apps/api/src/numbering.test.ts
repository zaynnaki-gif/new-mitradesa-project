/**
 * Unit Tests for Numbering Utility
 */

import {
  parseFormatTemplate,
  validateFormatTemplate,
  generateVerificationToken,
} from '../src/utils/numbering.js';

describe('Numbering Utility', () => {
  describe('parseFormatTemplate', () => {
    it('should replace {seq} with padded sequence', () => {
      const result = parseFormatTemplate('{seq}/DOC/{tahun}', {
        sequence: 1,
        tahun: 2026,
        bulan: 8,
      });
      expect(result).toBe('00001/DOC/2026');
    });

    it('should replace {seq:3} with 3-digit padding', () => {
      const result = parseFormatTemplate('{seq:3}/DOC', {
        sequence: 42,
        tahun: 2026,
        bulan: 8,
      });
      expect(result).toBe('042/DOC');
    });

    it('should replace {tahun} with 4-digit year', () => {
      const result = parseFormatTemplate('DOC/{tahun}', {
        sequence: 1,
        tahun: 2026,
        bulan: 8,
      });
      expect(result).toBe('DOC/2026');
    });

    it('should replace {bulan} with zero-padded month', () => {
      const result = parseFormatTemplate('DOC/{bulan}/{tahun}', {
        sequence: 1,
        tahun: 2026,
        bulan: 8,
      });
      expect(result).toBe('DOC/08/2026');
    });

    it('should replace {bulanRomawi} with Roman numeral', () => {
      expect(
        parseFormatTemplate('DOC/{bulanRomawi}/{tahun}', {
          sequence: 1,
          tahun: 2026,
          bulan: 1,
        })
      ).toBe('DOC/I/2026');

      expect(
        parseFormatTemplate('DOC/{bulanRomawi}/{tahun}', {
          sequence: 1,
          tahun: 2026,
          bulan: 8,
        })
      ).toBe('DOC/VIII/2026');

      expect(
        parseFormatTemplate('DOC/{bulanRomawi}/{tahun}', {
          sequence: 1,
          tahun: 2026,
          bulan: 12,
        })
      ).toBe('DOC/XII/2026');
    });

    it('should replace {kode} when provided', () => {
      const result = parseFormatTemplate('{kode}/{seq}/DOC', {
        sequence: 1,
        tahun: 2026,
        bulan: 8,
        kode: 'SKD',
      });
      expect(result).toBe('SKD/00001/DOC');
    });

    it('should replace {kades} when provided', () => {
      const result = parseFormatTemplate('DOC/{kades}/{tahun}', {
        sequence: 1,
        tahun: 2026,
        bulan: 8,
        kades: 'HZA',
      });
      expect(result).toBe('DOC/HZA/2026');
    });

    it('should replace {desa} when provided', () => {
      const result = parseFormatTemplate('DOC/{desa}/{tahun}', {
        sequence: 1,
        tahun: 2026,
        bulan: 8,
        desa: 'SRM',
      });
      expect(result).toBe('DOC/SRM/2026');
    });

    it('should handle complex template', () => {
      const result = parseFormatTemplate('{seq:3}/{kode}/KADES.{desa}/{bulanRomawi}/{tahun}', {
        sequence: 42,
        tahun: 2026,
        bulan: 8,
        kode: 'SKD',
        kades: 'HZA',
        desa: 'SRM',
      });
      expect(result).toBe('042/SKD/KADES.SRM/VIII/2026');
    });

    it('should not replace missing optional tokens', () => {
      const result = parseFormatTemplate('{seq}/{kode}', {
        sequence: 1,
        tahun: 2026,
        bulan: 8,
      });
      expect(result).toBe('00001/{kode}');
    });
  });

  describe('validateFormatTemplate', () => {
    it('should accept valid template with {seq}', () => {
      expect(validateFormatTemplate('{seq}/DOC/2026').valid).toBe(true);
    });

    it('should accept template with all tokens', () => {
      expect(validateFormatTemplate('{seq}/{kode}/{kades}.{desa}/{bulanRomawi}/{tahun}').valid).toBe(true);
    });

    it('should reject empty template', () => {
      const result = validateFormatTemplate('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('kosong');
    });

    it('should reject template without {seq}', () => {
      const result = validateFormatTemplate('{tahun}/{bulan}');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('{seq}');
    });

    it('should reject unbalanced braces', () => {
      expect(validateFormatTemplate('{seq/{tahun}').valid).toBe(false);
      expect(validateFormatTemplate('}seq}/{tahun}').valid).toBe(false);
    });

    it('should reject invalid tokens', () => {
      const result = validateFormatTemplate('{seq}/{invalid}');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tidak valid');
    });

    it('should accept valid {seq:N} syntax', () => {
      expect(validateFormatTemplate('{seq:3}/{tahun}').valid).toBe(true);
      expect(validateFormatTemplate('{seq:5}/{tahun}').valid).toBe(true);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate UUID-like token', () => {
      const token = generateVerificationToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateVerificationToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('should not contain hyphens', () => {
      const token = generateVerificationToken();
      expect(token.includes('-')).toBe(false);
    });
  });

  describe('Roman numeral conversion', () => {
    const monthToRoman: Record<number, string> = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
      6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
      11: 'XI', 12: 'XII',
    };

    it('should convert all months to Roman numerals', () => {
      Object.entries(monthToRoman).forEach(([month, expected]) => {
        const result = parseFormatTemplate('{bulanRomawi}', {
          sequence: 1,
          tahun: 2026,
          bulan: parseInt(month),
        });
        expect(result).toBe(expected);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very large sequence numbers', () => {
      const result = parseFormatTemplate('{seq}', {
        sequence: 999999999,
        tahun: 2026,
        bulan: 1,
      });
      expect(result).toBe('999999999');
    });

    it('should handle month boundary values', () => {
      // Month 1
      expect(
        parseFormatTemplate('{bulanRomawi}', {
          sequence: 1,
          tahun: 2026,
          bulan: 1,
        })
      ).toBe('I');

      // Month 12
      expect(
        parseFormatTemplate('{bulanRomawi}', {
          sequence: 1,
          tahun: 2026,
          bulan: 12,
        })
      ).toBe('XII');
    });

    it('should preserve literal text', () => {
      const result = parseFormatTemplate('SURAT/{seq}/KEPALA DESA', {
        sequence: 1,
        tahun: 2026,
        bulan: 1,
      });
      expect(result).toBe('SURAT/00001/KEPALA DESA');
    });

    it('should handle special characters in village codes', () => {
      const result = parseFormatTemplate('{seq}/{kades}.{desa}', {
        sequence: 1,
        tahun: 2026,
        bulan: 1,
        kades: 'HZA',
        desa: 'SRM',
      });
      expect(result).toBe('00001/HZA.SRM');
    });
  });
});
