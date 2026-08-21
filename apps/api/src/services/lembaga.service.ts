import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import { ApiError } from '../utils/response.js';
import { getInstanceContext } from '../config/instance.js';

export class LembagaService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    jenis?: string;
    status?: string;
    gubugId?: string;
  }) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Math.min(Number(query.limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};
    if (query.jenis) where.jenis = query.jenis;
    if (query.status) where.status = query.status;
    if (query.gubugId) where.gubugId = BigInt(query.gubugId);
    if (query.search) {
      where.OR = [
        { nama: { contains: query.search, mode: 'insensitive' } },
        { jenis: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.lembaga.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
      prisma.lembaga.count({ where }),
    ]);

    return {
      data: data.map(l => ({
        id: l.id.toString(),
        jenis: l.jenis,
        nama: l.nama,
        deskripsi: l.deskripsi,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async findById(id: bigint) {
    const l = await prisma.lembaga.findUnique({ where: { id } });
    if (!l) throw ApiError.notFound('Lembaga tidak ditemukan');
    return {
      id: l.id.toString(),
      jenis: l.jenis,
      nama: l.nama,
      deskripsi: l.deskripsi,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    };
  }

  async create(
    data: { jenis: string; nama: string; deskripsi?: string; status?: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const result = await prisma.lembaga.create({
      data: {
        jenis: data.jenis,
        nama: data.nama,
        deskripsi: data.deskripsi || null,
        status: data.status || 'AKTIF',
        desaId: desaId ? BigInt(desaId) : BigInt(1234567890), // fallback if needed, though desaId is usually injected
      },
    });

    await this.auditService.log({
      entityType: 'lembaga',
      entityId: result.id,
      action: 'LEMBAGA_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), jenis: result.jenis, nama: result.nama },
    });

    return {
      id: result.id.toString(),
      jenis: result.jenis,
      nama: result.nama,
      status: result.status,
    };
  }

  async update(
    id: bigint,
    data: { nama?: string; jenis?: string; status?: string; deskripsi?: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.lembaga.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Lembaga tidak ditemukan');

    const updated = await prisma.lembaga.update({
      where: { id },
      data: {
        ...(data.nama && { nama: data.nama }),
        ...(data.jenis && { jenis: data.jenis }),
        ...(data.status && { status: data.status }),
        ...(data.deskripsi !== undefined && { deskripsi: data.deskripsi || null }),
      },
    });

    await this.auditService.log({
      entityType: 'lembaga',
      entityId: id,
      action: 'LEMBAGA_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { nama: existing.nama, jenis: existing.jenis },
      afterData: { nama: updated.nama, jenis: updated.jenis },
    });

    return { id: updated.id.toString(), jenis: updated.jenis, nama: updated.nama, status: updated.status };
  }

  async delete(id: bigint, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.lembaga.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Lembaga tidak ditemukan');

    await prisma.lembaga.delete({ where: { id } });

    await this.auditService.log({
      entityType: 'lembaga',
      entityId: id,
      action: 'LEMBAGA_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { id: existing.id.toString(), jenis: existing.jenis, nama: existing.nama },
    });

    return { message: 'Lembaga dihapus' };
  }
}

export const lembagaService = new LembagaService();
