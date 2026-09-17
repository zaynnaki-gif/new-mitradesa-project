import { Request, Response, NextFunction } from 'express';

/**
 * Recursively convert BigInt to string in objects
 */
function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item));
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }
  return obj;
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Response helper functions
 */
export const response = {
  success: <T>(res: Response, data: T, message = 'Success', meta?: Record<string, unknown>) => {
    return res.status(200).json({
      success: true,
      data: serializeBigInt(data),
      message,
      ...(meta && { meta: serializeBigInt(meta) })
    });
  },

  created: <T>(res: Response, data: T, message = 'Created') => {
    return res.status(201).json({
      success: true,
      data: serializeBigInt(data),
      message
    });
  },

  noContent: (res: Response) => {
    return res.status(204).send();
  },

  notFound: (res: Response, message = 'Resource not found') => {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message
      }
    });
  },

  badRequest: (res: Response, message = 'Bad request', details?: unknown) => {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message,
        ...(details !== undefined ? { details } : {})
      }
    });
  },

  error: (res: Response, statusCode: number, code: string, message: string, details?: unknown) => {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {})
      }
    });
  }
};
