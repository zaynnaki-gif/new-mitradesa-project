import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import { ApiError } from '../utils/response.js';

/**
 * RefJabatanPerangkat Service - Village Official Position Master Data
 */
export class RefJabatanPerangkatService {
  private audit = new AuditService();

  private toResponse(item: any) {
    return {
      id: item.id.toString(),
      kode: item.kode,
      nama: item.nama,
      kategori: item.kategori,
      urutan: item.urutan,
      isAktif: item.isAktif,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async findAll(options: { page?: number; limit?: number; search?: string; isAktif?: boolean; kategori?: string } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (options.isAktif !== undefined) where.isAktif = options.isAktif;
    if (options.kategori) where.kategori = options.kategori;
    if (options.search) {
      where.OR = [
        { kode: { contains: options.search, mode: 'insensitive' } },
        { nama: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.refJabatanPerangkat.findMany({ where, skip, take: limit, orderBy: { urutan: 'asc' } }),
      prisma.refJabatanPerangkat.count({ where }),
    ]);

    return {
      data: data.map(this.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByKode(kode: string) {
    return prisma.refJabatanPerangkat.findUnique({ where: { kode } });
  }

  async create(data: { kode: string; nama: string; kategori: string; urutan?: number; isAktif?: boolean }, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refJabatanPerangkat.findUnique({ where: { kode: data.kode } });
    if (existing) throw ApiError.conflict('Kode sudah ada');

    const result = await prisma.refJabatanPerangkat.create({
      data: {
        kode: data.kode,
        nama: data.nama,
        kategori: data.kategori,
        urutan: data.urutan ?? 0,
        isAktif: data.isAktif ?? true,
      },
    });

    await this.audit.log({
      entityType: 'ref_jabatan_perangkat',
      entityId: result.id,
      action: 'REFERENCE_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { kode: result.kode, nama: result.nama, kategori: result.kategori, urutan: result.urutan },
    });

    return this.toResponse(result);
  }

  async update(kode: string, data: { nama?: string; kategori?: string; urutan?: number; isAktif?: boolean }, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.refJabatanPerangkat.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    const result = await prisma.refJabatanPerangkat.update({ where: { kode }, data });

    await this.audit.log({
      entityType: 'ref_jabatan_perangkat',
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
    const existing = await prisma.refJabatanPerangkat.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    const result = await prisma.refJabatanPerangkat.update({
      where: { kode },
      data: { isAktif: true },
    });

    await this.audit.log({
      entityType: 'ref_jabatan_perangkat',
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
    const existing = await prisma.refJabatanPerangkat.findUnique({ where: { kode } });
    if (!existing) throw ApiError.notFound('Data tidak ditemukan');

    const result = await prisma.refJabatanPerangkat.update({
      where: { kode },
      data: { isAktif: false },
    });

    await this.audit.log({
      entityType: 'ref_jabatan_perangkat',
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

export const refJabatanPerangkatService = new RefJabatanPerangkatService();
