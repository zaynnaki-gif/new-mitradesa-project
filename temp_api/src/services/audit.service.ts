/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma.js';

export class AuditService {
  /**
   * Create audit log entry
   */
  async log(data: {
    entityType: string;
    entityId: bigint;
    action: string;
    actorId?: bigint;
    actorType?: 'USER' | 'SYSTEM' | 'API';
    actorIp?: string;
    actorAgent?: string;
    beforeData?: Record<string, unknown>;
    afterData?: Record<string, unknown>;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // Mask sensitive data in logs
      const maskedData = this.maskSensitiveData(data.beforeData);
      const maskedAfterData = this.maskSensitiveData(data.afterData);

      await prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action as any,
          actorId: data.actorId,
          actorType: data.actorType || 'USER',
          actorIp: this.maskIp(data.actorIp),
          actorAgent: data.actorAgent?.substring(0, 500),
          beforeData: maskedData as any,
          afterData: maskedAfterData as any,
          reason: data.reason,
          metadata: data.metadata as any,
        },
      });
    } catch (error) {
      // Don't fail the main operation if audit fails
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: {
    entityType?: string;
    entityId?: bigint;
    actorId?: bigint;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    perPage?: number;
  }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const skip = (page - 1) * perPage;

    const where: any = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Mask sensitive data from logs
   */
  private maskSensitiveData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;

    const sensitiveFields = ['password', 'passwordHash', 'otp', 'otpHash', 'token', 'secret'];

    const masked = { ...data };

    for (const field of sensitiveFields) {
      if (field in masked) {
        masked[field] = '[REDACTED]';
      }
    }

    return masked;
  }

  /**
   * Mask IP address (show only first and last octets)
   */
  private maskIp(ip?: string): string | undefined {
    if (!ip) return undefined;

    // Check if it's IPv4 or IPv6
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.***.${parts[3]}`;
      }
    }

    // IPv6 - show first and last segments
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:****:${parts[parts.length - 1]}`;
      }
    }

    return '***.***.***';
  }
}

export const auditService = new AuditService();

