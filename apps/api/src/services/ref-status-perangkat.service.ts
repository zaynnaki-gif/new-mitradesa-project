import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import { ApiError } from '../utils/response.js';

/**
 * RefStatusPerangkat Service - Village Official Status Master Data
 */
export class RefStatusPerangkatService {
  private audit = new AuditService();

  private toResponse(item: any) {
    return {
      id: item.id.toString(),
      kode: item.kode,
      nama: item.nama,
      isAktif: item.isAktif,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async findAll(options: { page?: number; limit?: number; search?: string; isAktif?: boolean } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (options.isAktif !== undefined) where.isAktif = options.isAktif;
    if (options.search) {
      where.OR = [
        { kode: { contains: options.search, mode: 'insensitive' } },
        { nama: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.refStatusPerangkat.findMany({ where, skip, take: limit, orderBy: { kode: 'asc' } }),
      prisma.refStatusPerangkat.count({ where }),
    ]);

    return {
      data: data.map(this.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByKode(kode: string) {
    return prisma.refStatusPerangkat.findUnique({ where: { kode } });
  }

  async create(data: { kode: string; nama: string; isAktif?: boolean }, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refStatusPerangkat.findUnique({ where: { kode: data.kode } });
    if (existing) throw ApiError.conflict('Kode sudah ada');

    const result = await prisma.refStatusPerangkat.create({
      data: { kode: data.kode, nama: data.nama, isAktif: data.isAktif ?? true },
    });

    await this.audit.log({
      entityType: 'ref_status_perangkat',
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

  async update(kode: string, data: { nama?: string; isAktif?: boolean }, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refStatusPerangkat.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    const result = await prisma.refStatusPerangkat.update({ where: { kode }, data });

    await this.audit.log({
      entityType: 'ref_status_perangkat',
      entityId: result.id,
      action: 'REFERENCE_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode },
      afterData: { kode: result.kode },
    });

    return this.toResponse(result);
  }

  async activate(kode: string, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refStatusPerangkat.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    const result = await prisma.refStatusPerangkat.update({
      where: { kode },
      data: { isAktif: true },
    });

    await this.audit.log({
      entityType: 'ref_status_perangkat',
      entityId: result.id,
      action: 'REFERENCE_ACTIVATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
    });

    return this.toResponse(result);
  }

  async deactivate(kode: string, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refStatusPerangkat.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    const result = await prisma.refStatusPerangkat.update({
      where: { kode },
      data: { isAktif: false },
    });

    await this.audit.log({
      entityType: 'ref_status_perangkat',
      entityId: result.id,
      action: 'REFERENCE_DEACTIVATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
    });

    return this.toResponse(result);
  }
}

export const refStatusPerangkatService = new RefStatusPerangkatService();
