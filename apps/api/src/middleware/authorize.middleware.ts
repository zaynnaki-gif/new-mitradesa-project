import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/response.js';

/**
 * Authorization middleware factory
 * @param permissions - Required permissions (all must be present)
 */
export function authorize(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    void _res;
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Admin/Developer bypass with wildcard permission or role
    if (
      req.user.permissions.includes('*') || 
      req.user.permissions.includes('*.*') || 
      req.user.permissions.includes('system.*') ||
      req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('DEVELOPER') ||
      req.user.roles.includes('SUPERADMIN') ||
      req.user.roles.includes('superadmin')
    ) {
      return next();
    }

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
}

/**
 * Authorization middleware factory - any permission (at least one must be present)
 * @param permissions - Required permissions (at least one must be present)
 */
export function authorizeAny(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    void _res;
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Admin/Developer bypass
    if (
      req.user.permissions.includes('*.*') || 
      req.user.permissions.includes('system.*') ||
      req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('DEVELOPER') ||
      req.user.roles.includes('SUPERADMIN') ||
      req.user.roles.includes('superadmin')
    ) {
      return next();
    }

    // Check if user has at least one permission
    const hasAnyPermission = permissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAnyPermission) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
}

/**
 * Role-based authorization middleware
 * @param roles - Required roles (all must be present)
 */
export function authorizeRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    void _res;
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Developer and Superadmin bypass
    if (
      req.user.roles.includes('DEVELOPER') ||
      req.user.roles.includes('SUPERADMIN') ||
      req.user.roles.includes('superadmin')
    ) {
      return next();
    }

    // Check if user has all required roles
    const hasAllRoles = roles.every((role) => req.user!.roles.includes(role));

    if (!hasAllRoles) {
      throw ApiError.forbidden('Insufficient role');
    }

    next();
  };
}

/**
 * Role-based authorization middleware - any role
 * @param roles - Required roles (at least one must be present)
 */
export function authorizeAnyRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    void _res;
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Developer and Superadmin bypass
    if (
      req.user.roles.includes('DEVELOPER') ||
      req.user.roles.includes('SUPERADMIN') ||
      req.user.roles.includes('superadmin')
    ) {
      return next();
    }

    // Check if user has at least one role
    const hasAnyRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasAnyRole) {
      throw ApiError.forbidden('Insufficient role');
    }

    next();
  };
}

/**
 * Internal user only (no citizen access)
 */
export function internalOnly() {
  return (req: Request, _res: Response, next: NextFunction) => {
    void _res;
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (req.user.type !== 'internal') {
      throw ApiError.forbidden('Internal access only');
    }

    next();
  };
}

/**
 * Citizen only (no internal access)
 */
export function citizenOnly() {
  return (req: Request, _res: Response, next: NextFunction) => {
    void _res;
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (req.user.type !== 'citizen') {
      throw ApiError.forbidden('Citizen access only');
    }

    next();
  };
}
