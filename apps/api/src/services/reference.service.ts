import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import { ApiError } from '../utils/response.js';

/**
 * Generic Reference Service
 * Handles CRUD for all reference tables with common patterns
 */
export class ReferenceService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Map generic reference item to response DTO
   */
  private toResponse<T extends { id: bigint; kode: string; nama: string; isAktif: boolean; createdAt: Date; updatedAt: Date }>(item: T): any {
    return {
      id: item.id.toString(),
      kode: item.kode,
      nama: item.nama,
      isAktif: item.isAktif,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  /**
   * List all reference items for a table
   */
  async findAll(
    tableName: string,
    options: { page?: number; limit?: number; search?: string; isAktif?: boolean } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    void tableName;
    void skip;
    const where: any = {};

    if (options.isAktif !== undefined) {
      where.isAktif = options.isAktif;
    }

    if (options.search) {
      where.OR = [
        { kode: { contains: options.search, mode: 'insensitive' } },
        { nama: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Dynamic table query using Prisma.$queryRaw would be ideal, but we'll use individual service methods
    // This is a template - actual implementation uses typed service methods per table
    return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
  }

  /**
   * Find by kode
   */
  async findByKode(
    tableName: string,
    kode: string
  ): Promise<any | null> {
    void tableName;
    void kode;
    // Dynamic query would use $queryRawRaw or switch table name
    // For now return null - implement per-table methods
    return null;
  }

  /**
   * Create reference item
   */
  async create<T extends Record<string, any>>(
    tableName: string,
    data: T,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const result = await (prisma as any)[tableName].create({ data });

    await this.auditService.log({
      entityType: tableName,
      entityId: result.id,
      action: 'REFERENCE_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { kode: result.kode, nama: result.nama },
    });

    return this.toResponse(result);
  }

  /**
   * Update reference item
   */
  async update<T extends Record<string, any>>(
    tableName: string,
    kode: string,
    data: Partial<T>,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await (prisma as any).$queryRaw`
      SELECT * FROM ${tableName} WHERE kode = ${kode}
    `;

    if (!existing || existing.length === 0) {
      throw ApiError.notFound(`${tableName} tidak ditemukan`);
    }

    const result = await (prisma as any)[tableName].update({
      where: { kode },
      data,
    });

    await this.auditService.log({
      entityType: tableName,
      entityId: result.id,
      action: 'REFERENCE_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing[0]?.kode },
      afterData: { kode: result.kode },
    });

    return this.toResponse(result);
  }

  /**
   * Activate/deactivate reference item
   */
  async setActive(
    tableName: string,
    kode: string,
    isAktif: boolean,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await (prisma as any)[tableName].findUnique({ where: { kode } });
    if (!existing) {
      throw ApiError.notFound(`${tableName} tidak ditemukan`);
    }

    const result = await (prisma as any)[tableName].update({
      where: { kode },
      data: { isAktif },
    });

    await this.auditService.log({
      entityType: tableName,
      entityId: result.id,
      action: isAktif ? 'REFERENCE_ACTIVATED' : 'REFERENCE_DEACTIVATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode, isAktif: existing.isAktif },
      afterData: { kode, isAktif },
    });

    return this.toResponse(result);
  }
}

export const referenceService = new ReferenceService();
