/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import { ApiError } from '../utils/response.js';

/**
 * RefGolDarah Service - Blood Type Master Data
 */
export class RefGolDarahService {
  private audit = new AuditService();

  private toResponse(item: any) {
    return {
      id: item.id.toString(),
      kode: item.kode,
      nama: item.nama,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async findAll(options: { page?: number; limit?: number; search?: string } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (options.search) {
      where.OR = [
        { kode: { contains: options.search, mode: 'insensitive' } },
        { nama: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.refGolonganDarah.findMany({ where, skip, take: limit, orderBy: { kode: 'asc' } }),
      prisma.refGolonganDarah.count({ where }),
    ]);

    return {
      data: data.map(this.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByKode(kode: string) {
    return prisma.refGolonganDarah.findUnique({ where: { kode } });
  }

  async create(data: { kode: string; nama: string }, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refGolonganDarah.findUnique({ where: { kode: data.kode } });
    if (existing) throw ApiError.conflict('Kode sudah ada');

    const result = await prisma.refGolonganDarah.create({
      data: { kode: data.kode, nama: data.nama },
    });

    await this.audit.log({
      entityType: 'ref_gol_darah',
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

  async update(kode: string, data: { nama?: string }, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refGolonganDarah.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    const result = await prisma.refGolonganDarah.update({ where: { kode }, data });

    await this.audit.log({
      entityType: 'ref_gol_darah',
      entityId: result.id,
      action: 'REFERENCE_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode, nama: existing.nama },
      afterData: { kode: result.kode, nama: result.nama },
    });

    return this.toResponse(result);
  }

  async delete(kode: string, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refGolonganDarah.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    // For gol_darah, we typically don't soft delete - just hard delete
    await prisma.refGolonganDarah.delete({ where: { kode } });

    await this.audit.log({
      entityType: 'ref_gol_darah',
      entityId: existing.id,
      action: 'REFERENCE_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode, nama: existing.nama },
    });

    return { success: true };
  }
}

export const refGolDarahService = new RefGolDarahService();

