import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import {
  CreatePerangkatDesaInput,
  UpdatePerangkatDesaInput,
  QueryPerangkatDesaInput,
  PerangkatDesaResponse,
  PerangkatDesaDetailResponse,
} from '../dto/perangkat-desa.dto.js';
import { ApiError } from '../utils/response.js';
import { getInstanceContext } from '../config/instance.js';

/**
 * PerangkatDesaService - Village Government Officials Management
 * Follows patterns from KeluargaService and PendudukService
 */
export class PerangkatDesaService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Map Prisma PerangkatDesa to response DTO
   */
  private toResponse(perangkat: any): PerangkatDesaResponse {
    return {
      id: perangkat.id.toString(),
      pendudukId: perangkat.pendudukId.toString(),
      pendudukNik: perangkat.penduduk?.nik || '',
      pendudukNama: perangkat.penduduk?.namaLengkap || '',
      desaId: perangkat.desaId.toString(),
      desaNama: perangkat.desa?.nama || '',
      jabatan: perangkat.jabatan,
      status: perangkat.status,
      fotoUrl: perangkat.fotoUrl || null,
      accountId: perangkat.accountId?.toString() || null,
      accountUsername: perangkat.account?.username || null,
      createdAt: perangkat.createdAt.toISOString(),
      updatedAt: perangkat.updatedAt.toISOString(),
      deletedAt: perangkat.deletedAt?.toISOString() || null,
      isAktif: !perangkat.deletedAt,
    };
  }

  /**
   * Map to public response (no sensitive data)
   */
  private toPublicResponse(perangkat: any) {
    return {
      id: perangkat.id.toString(),
      nama: perangkat.penduduk?.namaLengkap || '',
      jabatan: perangkat.jabatan,
      status: perangkat.status,
      fotoUrl: perangkat.fotoUrl || null,
    };
  }

  /**
   * Map to detail response
   */
  private toDetailResponse(perangkat: any): PerangkatDesaDetailResponse {
    const base = this.toResponse(perangkat);
    return {
      ...base,
      penduduk: perangkat.penduduk ? {
        id: perangkat.penduduk.id.toString(),
        nik: perangkat.penduduk.nik,
        namaLengkap: perangkat.penduduk.namaLengkap,
        tempatLahir: perangkat.penduduk.tempatLahir,
        tanggalLahir: perangkat.penduduk.tanggalLahir ? new Date(perangkat.penduduk.tanggalLahir).toISOString().split('T')[0] : '',
        jenisKelamin: perangkat.penduduk.jenisKelamin,
        alamat: perangkat.penduduk.alamat || null,
        rt: perangkat.penduduk.rt || null,
        rw: perangkat.penduduk.rw || null,
        dusun: perangkat.penduduk.dusun || null,
      } : null,
      account: perangkat.account ? {
        id: perangkat.account.id.toString(),
        username: perangkat.account.username,
        email: perangkat.account.email,
        status: perangkat.account.status,
      } : null,
    };
  }

  /**
   * List all perangkat desa with pagination
   */
  async findAll(query: QueryPerangkatDesaInput) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const { desaId } = getInstanceContext();
    const where: any = { deletedAt: null, desaId };

    if (query.search) {
      where.OR = [
        { penduduk: { namaLengkap: { contains: query.search, mode: 'insensitive' } } },
        { penduduk: { nik: { contains: query.search } } },
        { jabatan: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.pendudukId) where.pendudukId = query.pendudukId;
    if (query.jabatan) where.jabatan = query.jabatan;
    if (query.status) where.status = query.status;
    if (query.hasAccount !== undefined) {
      if (query.hasAccount) {
        where.accountId = { not: null };
      } else {
        where.accountId = null;
      }
    }

    const [data, total] = await Promise.all([
      prisma.perangkatDesa.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          penduduk: { select: { id: true, nik: true, namaLengkap: true } },
          desa: { select: { id: true, nama: true } },
          account: { select: { id: true, username: true } },
        },
      }),
      prisma.perangkatDesa.count({ where }),
    ]);

    return {
      data: data.map(r => this.toResponse(r)),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  /**
   * List active perangkat desa for public (no pagination, minimal data)
   */
  async findAllPublic(where: any) {
    const perangkat = await prisma.perangkatDesa.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // AKTIF first
        { createdAt: 'asc' }, // oldest first (seniority)
      ],
      include: {
        penduduk: { select: { id: true, nik: true, namaLengkap: true } },
      },
    });

    return perangkat.map(r => this.toPublicResponse(r));
  }

  /**
   * Get perangkat desa by ID
   */
  async findById(id: bigint): Promise<PerangkatDesaDetailResponse> {
    const { desaId } = getInstanceContext();
    const perangkat = await prisma.perangkatDesa.findFirst({
      where: { id, desaId },
      include: {
        penduduk: {
          select: {
            id: true, nik: true, namaLengkap: true,
            tempatLahir: true, tanggalLahir: true, jenisKelamin: true,
            alamat: true, rtId: true, rwId: true, gubugId: true,
          },
        },
        desa: { select: { id: true, nama: true } },
        account: { select: { id: true, username: true, email: true, status: true } },
      },
    });

    if (!perangkat || perangkat.deletedAt) {
      throw ApiError.notFound('Perangkat Desa tidak ditemukan');
    }

    return this.toDetailResponse(perangkat);
  }

  /**
   * Create new perangkat desa
   */
  async create(
    data: CreatePerangkatDesaInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    if (!desaId) throw ApiError.badRequest('Konteks desa tidak ditemukan');

    // Validate penduduk exists and is active
    const penduduk = await prisma.penduduk.findFirst({
      where: { id: data.pendudukId, desaId },
    });
    if (!penduduk) throw ApiError.badRequest('Penduduk tidak ditemukan');
    if (!penduduk.isAktif) throw ApiError.badRequest('Penduduk tidak aktif');

    // Check for duplicate active assignment (same penduduk in same desa)
    const existing = await prisma.perangkatDesa.findFirst({
      where: {
        pendudukId: data.pendudukId,
        desaId,
        deletedAt: null,
      },
    });
    if (existing) throw ApiError.conflict('Penduduk sudah terdaftar sebagai perangkat desa di desa ini');

    // Validate account if provided
    if (data.accountId) {
      const account = await prisma.account.findUnique({
        where: { id: data.accountId },
      });
      if (!account) throw ApiError.badRequest('Account tidak ditemukan');

      // Check if account already linked
      const accountLinked = await prisma.perangkatDesa.findFirst({
        where: { accountId: data.accountId, deletedAt: null },
      });
      if (accountLinked) throw ApiError.conflict('Account sudah dikaitkan dengan perangkat desa lain');
    }

    const result = await prisma.perangkatDesa.create({
      data: {
        pendudukId: data.pendudukId,
        desaId,
        jabatan: data.jabatan,
        status: data.status || 'AKTIF',
        fotoUrl: data.fotoUrl || null,
        accountId: data.accountId || null,
      },
      include: {
        penduduk: { select: { id: true, nik: true, namaLengkap: true } },
        desa: { select: { id: true, nama: true } },
        account: { select: { id: true, username: true } },
      },
    });

    await this.auditService.log({
      entityType: 'perangkat_desa',
      entityId: result.id,
      action: 'PERANGKAT_DESA_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), jabatan: result.jabatan },
    });

    return this.toResponse(result);
  }

  /**
   * Update perangkat desa
   */
  async update(
    id: bigint,
    data: UpdatePerangkatDesaInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const existing = await prisma.perangkatDesa.findFirst({ where: { id, desaId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Perangkat Desa tidak ditemukan');

    // Validate new penduduk if changing
    if (data.pendudukId && data.pendudukId !== existing.pendudukId) {
      const penduduk = await prisma.penduduk.findFirst({ where: { id: data.pendudukId, desaId } });
      if (!penduduk) throw ApiError.badRequest('Penduduk tidak valid');
      if (!penduduk.isAktif) throw ApiError.badRequest('Penduduk tidak aktif');
    }

    // Validate new account if changing
    if (data.accountId !== undefined) {
      if (data.accountId) {
        const account = await prisma.account.findUnique({ where: { id: data.accountId } });
        if (!account) throw ApiError.badRequest('Account tidak valid');

        const accountLinked = await prisma.perangkatDesa.findFirst({
          where: { accountId: data.accountId, id: { not: id }, deletedAt: null },
        });
        if (accountLinked) throw ApiError.conflict('Account sudah dikaitkan dengan perangkat desa lain');
      }
    }

    const result = await prisma.perangkatDesa.update({
      where: { id },
      data: {
        pendudukId: data.pendudukId,
        jabatan: data.jabatan,
        status: data.status,
        fotoUrl: data.fotoUrl,
        accountId: data.accountId,
      },
      include: {
        penduduk: { select: { id: true, nik: true, namaLengkap: true } },
        desa: { select: { id: true, nama: true } },
        account: { select: { id: true, username: true } },
      },
    });

    await this.auditService.log({
      entityType: 'perangkat_desa',
      entityId: id,
      action: 'PERANGKAT_DESA_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { id: existing.id.toString() },
      afterData: { id: result.id.toString() },
    });

    return this.toResponse(result);
  }

  /**
   * Soft delete perangkat desa
   */
  async softDelete(
    id: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const existing = await prisma.perangkatDesa.findFirst({ where: { id, desaId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Perangkat Desa tidak ditemukan');

    await prisma.perangkatDesa.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      entityType: 'perangkat_desa',
      entityId: id,
      action: 'PERANGKAT_DESA_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { id: existing.id.toString(), jabatan: existing.jabatan },
    });

    return { message: 'Perangkat Desa dihapus' };
  }

  /**
   * Link account to perangkat desa
   */
  async linkAccount(
    id: bigint,
    accountId: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const perangkat = await prisma.perangkatDesa.findFirst({ where: { id, desaId } });
    if (!perangkat || perangkat.deletedAt) throw ApiError.notFound('Perangkat Desa tidak ditemukan');

    // Check account exists
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw ApiError.badRequest('Account tidak ditemukan');

    // Check account not already linked
    const existingLink = await prisma.perangkatDesa.findFirst({
      where: { accountId, deletedAt: null },
    });
    if (existingLink) throw ApiError.conflict('Account sudah dikaitkan dengan perangkat desa lain');

    await prisma.perangkatDesa.update({
      where: { id },
      data: { accountId },
    });

    await this.auditService.log({
      entityType: 'perangkat_desa',
      entityId: id,
      action: 'PERANGKAT_DESA_ACCOUNT_LINKED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      metadata: { accountId: accountId.toString() },
    });

    return { message: 'Account berhasil dikaitkan' };
  }

  /**
   * Unlink account from perangkat desa
   */
  async unlinkAccount(
    id: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const perangkat = await prisma.perangkatDesa.findFirst({ where: { id, desaId } });
    if (!perangkat || perangkat.deletedAt) throw ApiError.notFound('Perangkat Desa tidak ditemukan');

    await prisma.perangkatDesa.update({
      where: { id },
      data: { accountId: null },
    });

    await this.auditService.log({
      entityType: 'perangkat_desa',
      entityId: id,
      action: 'PERANGKAT_DESA_ACCOUNT_UNLINKED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { accountId: perangkat.accountId?.toString() },
    });

    return { message: 'Account berhasil dilepaskan' };
  }

  /**
   * Get account linked to perangkat desa
   */
  async getAccount(id: bigint) {
    const { desaId } = getInstanceContext();
    const perangkat = await prisma.perangkatDesa.findFirst({
      where: { id, desaId },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!perangkat || perangkat.deletedAt) throw ApiError.notFound('Perangkat Desa tidak ditemukan');

    return perangkat.account;
  }
}

export const perangkatDesaService = new PerangkatDesaService();

