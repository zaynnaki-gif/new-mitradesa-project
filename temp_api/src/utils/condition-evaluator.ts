/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Condition Evaluator
 *
 * Safe expression evaluator for conditional visibility in templates.
 * NO eval() - uses AST-based parsing and evaluation.
 */

// ============================================================
// Types
// ============================================================

export interface ComparisonExpression {
  type: 'comparison';
  operator: string;
  left: ConditionValue;
  right: ConditionValue;
}

export interface LogicalExpression {
  type: 'logical';
  operator: string;
  left: ConditionExpression;
  right: ConditionExpression;
}

export interface UnaryExpression {
  type: 'unary';
  operator: string;
  value: ConditionExpression;
}

export interface ExistsExpression {
  type: 'exists';
  operator: string;
  value: ConditionValue;
}

export type ConditionExpression =
  | ComparisonExpression
  | LogicalExpression
  | UnaryExpression
  | ExistsExpression;

export interface ConditionValue {
  type: 'binding' | 'literal' | 'null';
  value: string;
  bindingPath?: string;
}

// ============================================================
// Token Types
// ============================================================

type TokenType =
  | 'BINDING'      // {{field.path}}
  | 'STRING'       // "value" or 'value'
  | 'NUMBER'       // 123 or 123.45
  | 'BOOLEAN'      // true or false
  | 'NULL'         // null
  | 'OPERATOR'     // ==, !=, >, <, >=, <=, AND, OR, NOT, EXISTS
  | 'LPAREN'       // (
  | 'RPAREN'       // )
  | 'WHITESPACE'    // spaces (ignored)

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// ============================================================
// Tokenizer
// ============================================================

const KEYWORDS = new Set(['true', 'false', 'null']);

/**
 * Tokenize an expression string
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < expression.length) {
    const char = expression[pos];

    // Skip whitespace
    if (/\s/.test(char)) {
      pos++;
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: pos });
      pos++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: pos });
      pos++;
      continue;
    }

    // Binding path (starts with letter, contains alphanum, dots, underscores)
    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      const start = pos;
      while (pos < expression.length && /[a-zA-Z0-9_.]/.test(expression[pos])) {
        value += expression[pos];
        pos++;
      }

      // Check if it's a keyword or operator
      const upperValue = value.toUpperCase();
      if (KEYWORDS.has(value.toLowerCase())) {
        if (value.toLowerCase() === 'null') {
          tokens.push({ type: 'NULL', value, position: start });
        } else {
          tokens.push({ type: 'BOOLEAN', value, position: start });
        }
      } else if (upperValue === 'AND' || upperValue === 'OR' || upperValue === 'NOT') {
        tokens.push({ type: 'OPERATOR', value: upperValue, position: start });
      } else if (upperValue === 'EXISTS') {
        tokens.push({ type: 'OPERATOR', value: 'EXISTS', position: start });
      } else if (upperValue === 'NOT_EXISTS') {
        tokens.push({ type: 'OPERATOR', value: 'NOT_EXISTS', position: start });
      } else {
        // It's a binding path
        tokens.push({ type: 'BINDING', value, position: start });
      }
      continue;
    }

    // String literal
    if (char === '"' || char === "'") {
      const quote = char;
      let value = '';
      const start = pos;
      pos++; // Skip opening quote
      while (pos < expression.length && expression[pos] !== quote) {
        // Handle escape sequences
        if (expression[pos] === '\\' && pos + 1 < expression.length) {
          pos++;
          value += expression[pos];
        } else {
          value += expression[pos];
        }
        pos++;
      }
      pos++; // Skip closing quote
      tokens.push({ type: 'STRING', value, position: start });
      continue;
    }

    // Number
    if (/[0-9]/.test(char)) {
      let value = '';
      const start = pos;
      while (pos < expression.length && /[0-9.]/.test(expression[pos])) {
        value += expression[pos];
        pos++;
      }
      tokens.push({ type: 'NUMBER', value, position: start });
      continue;
    }

    // Two-character operators
    if (pos + 1 < expression.length) {
      const twoChar = expression.substring(pos, pos + 2).toUpperCase();
      if (twoChar === '>=' || twoChar === '<=' || twoChar === '!=' || twoChar === '==' ||
          twoChar === 'OR' || twoChar === 'LI') {
        if (twoChar === 'LI' && pos + 4 < expression.length &&
            expression.substring(pos, pos + 6).toUpperCase() === 'LIKE ') {
          // It's LIKE
          tokens.push({ type: 'OPERATOR', value: 'LIKE', position: pos });
          pos += 4;
          continue;
        }
        tokens.push({ type: 'OPERATOR', value: twoChar === '!=' ? '!=' : twoChar, position: pos });
        pos += 2;
        continue;
      }
    }

    // Single-character operators
    if (['>', '<', '=', '!'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char, position: pos });
      pos++;
      continue;
    }

    // Unknown character - skip
    pos++;
  }

  return tokens;
}

// ============================================================
// Parser
// ============================================================

class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private current(): Token | null {
    return this.tokens[this.pos] || null;
  }

  private consume(): Token | null {
    return this.tokens[this.pos++] || null;
  }

  private expect(type: TokenType): Token {
    const token = this.consume();
    if (!token || token.type !== type) {
      throw new Error(`Expected ${type} but got ${token?.type || 'EOF'}`);
    }
    return token;
  }

  parse(): ConditionExpression {
    return this.parseOr();
  }

  private parseOr(): ConditionExpression {
    let left = this.parseAnd();

    while (this.current()?.type === 'OPERATOR' &&
           this.current()?.value.toUpperCase() === 'OR') {
      this.consume();
      const right = this.parseAnd();
      left = {
        type: 'logical',
        operator: 'OR',
        left,
        right,
      };
    }

    return left;
  }

  private parseAnd(): ConditionExpression {
    let left = this.parseUnary();

    while (this.current()?.type === 'OPERATOR' &&
           this.current()?.value.toUpperCase() === 'AND') {
      this.consume();
      const right = this.parseUnary();
      left = {
        type: 'logical',
        operator: 'AND',
        left,
        right,
      };
    }

    return left;
  }

  private parseUnary(): ConditionExpression {
    // Handle parentheses first
    if (this.current()?.type === 'LPAREN') {
      this.consume();
      const expr = this.parseOr();
      this.expect('RPAREN');
      return expr;
    }

    if (this.current()?.type === 'OPERATOR' &&
        this.current()?.value.toUpperCase() === 'NOT') {
      this.consume();
      const value = this.parseUnary();
      return {
        type: 'unary',
        operator: 'NOT',
        value,
      };
    }

    return this.parseExists();
  }

  private parseExists(): ConditionExpression {
    if (this.current()?.type === 'OPERATOR' &&
        (this.current()?.value === 'EXISTS' || this.current()?.value === 'NOT_EXISTS')) {
      const op = this.consume()!.value;
      const binding = this.expect('BINDING');

      // For condition expressions, accept any valid binding path format
      return {
        type: 'exists',
        operator: op,
        value: {
          type: 'binding',
          value: binding.value,
          bindingPath: binding.value,
        },
      };
    }

    return this.parseComparison();
  }

  private parseComparison(): ConditionExpression {
    const left = this.parseValue();

    if (this.current()?.type === 'OPERATOR' &&
        ['==', '!=', '>', '<', '>=', '<=', 'LIKE', 'ILIKE'].includes(this.current()!.value)) {
      const operator = this.consume()!.value;
      const right = this.parseValue();

      return {
        type: 'comparison',
        operator,
        left,
        right,
      };
    }

    // If no operator, treat single value as EXISTS check
    if (left.type === 'binding') {
      return {
        type: 'exists',
        operator: 'EXISTS',
        value: left,
      };
    }

    // Literal value - return as-is
    return {
      type: 'comparison',
      operator: '==',
      left,
      right: { type: 'literal', value: 'true' },
    };
  }

  private parseValue(): ConditionValue {
    const token = this.current();

    if (!token) {
      throw new Error('Unexpected end of expression');
    }

    switch (token.type) {
      case 'BINDING': {
        this.consume();
        // For condition expressions, we accept any valid binding path format
        // The actual validation against allowed bindings happens during evaluation
        // We only check for valid path format here
        const isValidPath = /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(token.value);
        if (!isValidPath) {
          throw new Error(`Binding '${token.value}' has invalid format`);
        }
        return {
          type: 'binding',
          value: token.value,
          bindingPath: token.value,
        };
      }

      case 'STRING':
        this.consume();
        return {
          type: 'literal',
          value: token.value,
        };

      case 'NUMBER':
        this.consume();
        return {
          type: 'literal',
          value: token.value,
        };

      case 'BOOLEAN':
        this.consume();
        return {
          type: 'literal',
          value: token.value.toLowerCase(),
        };

      case 'NULL':
        this.consume();
        return {
          type: 'null',
          value: 'null',
        };

      default:
        throw new Error(`Unexpected token: ${token.type}`);
    }
  }
}

// ============================================================
// Evaluator
// ============================================================

export interface EvaluationContext {
  [key: string]: unknown;
}

/**
 * Evaluate a condition expression against a context
 */
export function evaluateCondition(
  expression: ConditionExpression,
  context: EvaluationContext
): boolean {
  switch (expression.type) {
    case 'comparison':
      return evaluateComparison(expression, context);

    case 'logical':
      return evaluateLogical(expression, context);

    case 'unary':
      return evaluateUnary(expression, context);

    case 'exists':
      return evaluateExists(expression, context);

    default:
      return false;
  }
}

function evaluateComparison(
  expr: ConditionExpression & { operator: string; left: ConditionValue; right: ConditionValue },
  context: EvaluationContext
): boolean {
  const leftValue = resolveValue(expr.left, context);
  const rightValue = resolveValue(expr.right, context);

  switch (expr.operator) {
    case '==':
      return compareEqual(leftValue, rightValue);
    case '!=':
      return !compareEqual(leftValue, rightValue);
    case '>':
      return compareNumeric(leftValue, rightValue) > 0;
    case '<':
      return compareNumeric(leftValue, rightValue) < 0;
    case '>=':
      return compareNumeric(leftValue, rightValue) >= 0;
    case '<=':
      return compareNumeric(leftValue, rightValue) <= 0;
    case 'LIKE':
    case 'ILIKE':
      return compareLike(String(leftValue || ''), String(rightValue || ''), expr.operator === 'ILIKE');
    default:
      return false;
  }
}

function evaluateLogical(
  expr: ConditionExpression & { operator: string; left: ConditionExpression; right: ConditionExpression },
  context: EvaluationContext
): boolean {
  const leftResult = evaluateCondition(expr.left, context);

  if (expr.operator === 'AND') {
    if (!leftResult) return false;
    return evaluateCondition(expr.right, context);
  }

  if (expr.operator === 'OR') {
    if (leftResult) return true;
    return evaluateCondition(expr.right, context);
  }

  return false;
}

function evaluateUnary(
  expr: ConditionExpression & { operator: string; value: ConditionExpression },
  context: EvaluationContext
): boolean {
  if (expr.operator === 'NOT') {
    return !evaluateCondition(expr.value, context);
  }
  return false;
}

function evaluateExists(
  expr: ConditionExpression & { operator: string; value: ConditionValue },
  context: EvaluationContext
): boolean {
  if (expr.value.type !== 'binding' || !expr.value.bindingPath) {
    return false;
  }

  const value = resolvePath(expr.value.bindingPath, context);
  const exists = value !== null && value !== undefined;

  return expr.operator === 'EXISTS' ? exists : !exists;
}

function resolveValue(value: ConditionValue, context: EvaluationContext): unknown {
  if (value.type === 'binding' && value.bindingPath) {
    return resolvePath(value.bindingPath, context);
  }
  if (value.type === 'literal') {
    // Try to parse as number
    const num = Number(value.value);
    if (!isNaN(num) && String(num) === value.value) {
      return num;
    }
    // Try to parse as boolean
    if (value.value === 'true') return true;
    if (value.value === 'false') return false;
    return value.value;
  }
  return null;
}

function resolvePath(path: string, context: EvaluationContext): unknown {
  const parts = path.split('.');
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      // For arrays, try to get property from first element
      if (current.length > 0 && typeof current[0] === 'object') {
        current = (current[0] as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

function compareEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function compareNumeric(a: unknown, b: unknown): number {
  const numA = typeof a === 'number' ? a : parseFloat(String(a));
  const numB = typeof b === 'number' ? b : parseFloat(String(b));
  if (isNaN(numA) || isNaN(numB)) return 0;
  return numA - numB;
}

function compareLike(value: string, pattern: string, caseInsensitive: boolean): boolean {
  if (caseInsensitive) {
    return value.toLowerCase().includes(pattern.toLowerCase());
  }
  return value.includes(pattern);
}

// ============================================================
// Public API
// ============================================================

export interface ParseResult {
  success: boolean;
  expression?: ConditionExpression;
  error?: string;
}

/**
 * Parse and validate a condition expression
 */
export function parseCondition(expression: string): ParseResult {
  try {
    // Validate no dangerous patterns - check both full expression and tokens
    const trimmed = expression.trim();

    // Check for dangerous patterns in the expression
    const dangerousPatterns = [
      /\beval\s*\(/i,           // eval()
      /\bFunction\s*\(/i,        // Function()
      /\bconstructor\s*\(/i,    // constructor()
      /prototype\b/i,           // .prototype
      /__\w+__/i,               // __proto__, __constructor__, etc.
      /\bprocess\b/,            // process
      /\bglobal\b/,            // global
      /\.\.\//,                 // path traversal
      /\[0\]\s*\./,             // array index access [0].
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return {
          success: false,
          error: 'Expression contains forbidden patterns',
        };
      }
    }

    // Also check that single dangerous words are not used as identifiers
    const dangerousWords = ['__proto__', '__constructor__', 'constructor', 'prototype'];
    const words = trimmed.split(/\s+/);
    for (const word of words) {
      // Remove operators and punctuation
      const cleanWord = word.replace(/^[=!<>]+/, '').replace(/[=!<>]+$/, '').replace(/[^a-zA-Z0-9_.]/g, '');
      if (dangerousWords.some((dw) => cleanWord === dw || cleanWord.endsWith('.' + dw))) {
        return {
          success: false,
          error: 'Expression contains forbidden patterns',
        };
      }
    }

    const tokens = tokenize(expression);
    const parser = new Parser(tokens);
    const ast = parser.parse();

    return {
      success: true,
      expression: ast,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

/**
 * Validate a condition expression without parsing to AST
 */
export function validateConditionExpression(expression: string): { valid: boolean; error?: string } {
  const result = parseCondition(expression);
  if (!result.success) {
    return { valid: false, error: result.error };
  }
  return { valid: true };
}

/**
 * Evaluate a condition string directly
 */
export function evaluateConditionString(
  expression: string,
  context: EvaluationContext
): boolean {
  const result = parseCondition(expression);

  if (!result.success || !result.expression) {
    return false;
  }

  return evaluateCondition(result.expression, context);
}

// ============================================================
// Helper: Extract bindings from condition
// ============================================================

/**
 * Extract all binding paths from a condition expression
 * For conditions, we accept both simple paths and dotted paths
 */
export function extractConditionBindings(expression: string): string[] {
  const tokens = tokenize(expression);
  const bindings: string[] = [];

  for (const token of tokens) {
    if (token.type === 'BINDING') {
      // Accept both simple paths (jenis_kelamin) and dotted paths (penduduk.nama)
      // Simple paths are allowed in conditions for brevity
      if (token.value.includes('.') || /^[a-zA-Z][a-zA-Z0-9_]+$/.test(token.value)) {
        bindings.push(token.value);
      }
    }
  }

  return [...new Set(bindings)];
}

// ============================================================
// Test helpers
// ============================================================

export function createTestContext(data: Record<string, unknown>): EvaluationContext {
  return data;
}

