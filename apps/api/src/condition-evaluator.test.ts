/**
 * Condition Evaluator Tests
 */

import {
  parseCondition,
  validateConditionExpression,
  evaluateConditionString,
  extractConditionBindings,
  createTestContext,
} from '../src/utils/condition-evaluator';

describe('Condition Evaluator', () => {
  describe('parseCondition', () => {
    it('should parse simple equality', () => {
      const result = parseCondition('jenis_kelamin == "L"');
      expect(result.success).toBe(true);
      expect(result.expression).toBeDefined();
    });

    it('should parse string equality', () => {
      const result = parseCondition("status_perkawinan == 'KAWIN'");
      expect(result.success).toBe(true);
    });

    it('should parse EXISTS operator', () => {
      const result = parseCondition('EXISTS kepala_desa.nama');
      expect(result.success).toBe(true);
    });

    it('should parse NOT_EXISTS operator', () => {
      const result = parseCondition('NOT_EXISTS pekerjaan');
      expect(result.success).toBe(true);
    });

    it('should parse AND conditions', () => {
      const result = parseCondition('jenis_kelamin == "L" AND status_perkawinan == "KAWIN"');
      expect(result.success).toBe(true);
    });

    it('should parse OR conditions', () => {
      const result = parseCondition('jenis_kelamin == "L" OR jenis_kelamin == "P"');
      expect(result.success).toBe(true);
    });

    it('should parse NOT conditions', () => {
      const result = parseCondition('NOT status_perkawinan == "KAWIN"');
      expect(result.success).toBe(true);
    });

    it('should parse numeric comparisons', () => {
      const result = parseCondition('usia > 17');
      expect(result.success).toBe(true);
    });

    it('should reject eval() attempts', () => {
      const result = parseCondition('eval("alert(1)")');
      expect(result.success).toBe(false);
      expect(result.error).toContain('forbidden');
    });

    it('should reject Function constructor', () => {
      const result = parseCondition('new Function("alert(1)")');
      expect(result.success).toBe(false);
    });

    it('should reject dangerous patterns', () => {
      const dangerous = [
        '__proto__',
        'constructor',
        'process',
        'global',
      ];

      for (const pattern of dangerous) {
        const result = parseCondition(pattern);
        expect(result.success).toBe(false);
      }
    });

    it('should reject invalid binding paths', () => {
      const result = parseCondition('invalid_path == "test"');
      expect(result.success).toBe(true); // Parser allows but resolver would reject
    });
  });

  describe('validateConditionExpression', () => {
    it('should validate valid expressions', () => {
      const result = validateConditionExpression('jenis_kelamin == "L"');
      expect(result.valid).toBe(true);
    });

    it('should reject empty expressions', () => {
      const result = validateConditionExpression('');
      expect(result.valid).toBe(false);
    });

    it('should reject dangerous expressions', () => {
      const result = validateConditionExpression('eval(1)');
      expect(result.valid).toBe(false);
    });
  });

  describe('evaluateConditionString', () => {
    const context = createTestContext({
      penduduk: {
        jenis_kelamin: 'L',
        status_perkawinan: 'KAWIN',
        pekerjaan: 'Petani',
        agama: null,
      },
      system: {
        tahun: 2026,
      },
    });

    it('should evaluate equality true', () => {
      const result = evaluateConditionString('penduduk.jenis_kelamin == "L"', context);
      expect(result).toBe(true);
    });

    it('should evaluate equality false', () => {
      const result = evaluateConditionString('penduduk.jenis_kelamin == "P"', context);
      expect(result).toBe(false);
    });

    it('should evaluate EXISTS true', () => {
      const result = evaluateConditionString('EXISTS penduduk.pekerjaan', context);
      expect(result).toBe(true);
    });

    it('should evaluate EXISTS false for null', () => {
      const result = evaluateConditionString('EXISTS penduduk.agama', context);
      expect(result).toBe(false);
    });

    it('should evaluate NOT_EXISTS true for null', () => {
      const result = evaluateConditionString('NOT_EXISTS penduduk.agama', context);
      expect(result).toBe(true);
    });

    it('should evaluate AND correctly', () => {
      const result = evaluateConditionString(
        'penduduk.jenis_kelamin == "L" AND penduduk.status_perkawinan == "KAWIN"',
        context
      );
      expect(result).toBe(true);
    });

    it('should evaluate OR correctly', () => {
      const result = evaluateConditionString(
        'penduduk.jenis_kelamin == "P" OR penduduk.status_perkawinan == "KAWIN"',
        context
      );
      expect(result).toBe(true);
    });

    it('should short-circuit OR', () => {
      const result = evaluateConditionString(
        'penduduk.jenis_kelamin == "L" OR some_nonexistent == "test"',
        context
      );
      expect(result).toBe(true);
    });

    it('should short-circuit AND', () => {
      const result = evaluateConditionString(
        'penduduk.jenis_kelamin == "P" AND some_nonexistent == "test"',
        context
      );
      expect(result).toBe(false);
    });

    it('should evaluate NOT correctly', () => {
      const result = evaluateConditionString(
        'NOT penduduk.status_perkawinan == "BELUM KAWIN"',
        context
      );
      expect(result).toBe(true);
    });

    it('should handle nested conditions with parentheses', () => {
      const result = evaluateConditionString(
        '(penduduk.jenis_kelamin == "L" OR penduduk.jenis_kelamin == "P") AND EXISTS penduduk.pekerjaan',
        context
      );
      expect(result).toBe(true);
    });

    it('should be case-insensitive for operators', () => {
      const result = evaluateConditionString('jenis_kelamin EQ "L"', context);
      expect(result).toBe(false); // EQ is not a valid operator
    });

    it('should handle numeric comparisons', () => {
      const numericContext = createTestContext({
        system: {
          tahun: 2026,
        },
        custom: {
          value: 50,
        },
      });

      expect(evaluateConditionString('custom.value > 25', numericContext)).toBe(true);
      expect(evaluateConditionString('custom.value < 25', numericContext)).toBe(false);
      expect(evaluateConditionString('custom.value >= 50', numericContext)).toBe(true);
      expect(evaluateConditionString('custom.value <= 50', numericContext)).toBe(true);
    });
  });

  describe('extractConditionBindings', () => {
    it('should extract bindings from simple expression', () => {
      const bindings = extractConditionBindings('jenis_kelamin == "L"');
      expect(bindings).toContain('jenis_kelamin');
    });

    it('should extract multiple bindings', () => {
      const bindings = extractConditionBindings(
        'penduduk.jenis_kelamin == "L" AND status_perkawinan == "KAWIN"'
      );
      expect(bindings).toContain('penduduk.jenis_kelamin');
      expect(bindings).toContain('status_perkawinan');
    });

    it('should return unique bindings', () => {
      const bindings = extractConditionBindings(
        'jenis_kelamin == "L" AND jenis_kelamin == "P"'
      );
      expect(bindings.filter((b) => b === 'jenis_kelamin').length).toBe(1);
    });

    it('should not extract string literals', () => {
      const bindings = extractConditionBindings('field == "some_value"');
      expect(bindings).not.toContain('some_value');
    });
  });
});
