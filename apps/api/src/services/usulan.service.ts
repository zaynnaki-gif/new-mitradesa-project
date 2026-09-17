import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { AuditService } from './audit.service.js';
import type { CreateUsulanInput, UpdateUsulanInput, QueryUsulanInput } from '../dto/usulan-voting.dto.js';

export class UsulanService {
  private auditService = new AuditService();

  async findAll(query: QueryUsulanInput) {
    const { page, limit, status, pendudukId, search } = query;
    const skip = (page - 1) * limit;

    const where: import('@prisma/client').Prisma.UsulanOnlineWhereInput = {
      ...(status && { status }),
      ...(pendudukId && { pendudukId: BigInt(pendudukId) }),
      ...(search && {
        OR: [
          { judulUsulan: { contains: search, mode: 'insensitive' } },
          { deskripsi: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.usulanOnline.count({ where }),
      prisma.usulanOnline.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          penduduk: {
            select: { id: true, namaLengkap: true, nik: true },
          },
        },
      }),
    ]);

    return {
      data: data.map(this.toResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: bigint) {
    const usulan = await prisma.usulanOnline.findUnique({
      where: { id },
      include: {
        penduduk: { select: { id: true, namaLengkap: true, nik: true } },
      },
    });
    if (!usulan) throw ApiError.notFound('Usulan tidak ditemukan');
    return this.toResponse(usulan);
  }

  async create(input: CreateUsulanInput, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    // Verify penduduk exists
    const penduduk = await prisma.penduduk.findUnique({ where: { id: input.pendudukId } });
    if (!penduduk) throw ApiError.notFound('Penduduk tidak ditemukan');

    const result = await prisma.usulanOnline.create({
      data: {
        pendudukId: input.pendudukId,
        judulUsulan: input.judulUsulan,
        deskripsi: input.deskripsi,
        lokasi: input.lokasi,
        fotoUrl: input.fotoUrl,
        status: 'DIAJUKAN',
      },
      include: {
        penduduk: { select: { id: true, namaLengkap: true, nik: true } },
      },
    });

    await this.auditService.log({
      entityType: 'usulan_online',
      entityId: result.id,
      action: 'USULAN_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), judul: result.judulUsulan },
    });

    return this.toResponse(result);
  }

  async update(id: bigint, input: UpdateUsulanInput, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.usulanOnline.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Usulan tidak ditemukan');

    let newRkpdesId = existing.rkpdesId;
    if (input.status === 'DITERIMA' && !existing.rkpdesId && input.rpjmdesBidangId) {
      // Auto-create RKPDes
      const rkpdes = await prisma.rkpdes.create({
        data: {
          rpjmdesBidangId: input.rpjmdesBidangId,
          tahun: new Date().getFullYear() + 1,
          namaKegiatan: input.judulUsulan || existing.judulUsulan,
          lokasi: input.lokasi || existing.lokasi,
          perkiraanBiaya: 0,
        },
      });
      newRkpdesId = rkpdes.id;
    }

    const result = await prisma.usulanOnline.update({
      where: { id },
      data: {
        ...(input.judulUsulan && { judulUsulan: input.judulUsulan }),
        ...(input.deskripsi && { deskripsi: input.deskripsi }),
        ...(input.lokasi !== undefined && { lokasi: input.lokasi }),
        ...(input.fotoUrl !== undefined && { fotoUrl: input.fotoUrl }),
        ...(input.status && { status: input.status }),
        ...(input.alasanDitolak !== undefined && { alasanDitolak: input.alasanDitolak }),
        ...(newRkpdesId !== undefined && { rkpdesId: newRkpdesId }),
      },
      include: {
        penduduk: { select: { id: true, namaLengkap: true, nik: true } },
      },
    });

    await this.auditService.log({
      entityType: 'usulan_online',
      entityId: id,
      action: 'USULAN_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { status: existing.status },
      afterData: { status: result.status },
    });

    return this.toResponse(result);
  }

  async dukung(id: bigint) {
    const existing = await prisma.usulanOnline.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Usulan tidak ditemukan');

    const result = await prisma.usulanOnline.update({
      where: { id },
      data: { dukungan: { increment: 1 } },
      include: {
        penduduk: { select: { id: true, namaLengkap: true, nik: true } },
      },
    });
    return this.toResponse(result);
  }

  async remove(id: bigint, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.usulanOnline.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Usulan tidak ditemukan');

    await prisma.usulanOnline.delete({ where: { id } });

    await this.auditService.log({
      entityType: 'usulan_online',
      entityId: id,
      action: 'USULAN_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
    });
  }

  private toResponse(u: any) {
    return {
      id: u.id.toString(),
      pendudukId: u.pendudukId.toString(),
      penduduk: u.penduduk
        ? {
            id: u.penduduk.id.toString(),
            namaLengkap: u.penduduk.namaLengkap,
            nik: u.penduduk.nik,
          }
        : null,
      judulUsulan: u.judulUsulan,
      deskripsi: u.deskripsi,
      lokasi: u.lokasi,
      fotoUrl: u.fotoUrl,
      dukungan: u.dukungan,
      status: u.status,
      alasanDitolak: u.alasanDitolak,
      rkpdesId: u.rkpdesId?.toString() ?? null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }
}

export const usulanService = new UsulanService();
