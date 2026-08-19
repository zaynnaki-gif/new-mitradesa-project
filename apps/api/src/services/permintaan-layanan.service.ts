import { PrismaClient, Prisma, RequestStatus, AuditAction, ActorType } from '@prisma/client';
import { prisma } from './prisma.js';
import {
  CreatePermintaanLayananInput,
  UpdatePermintaanLayananInput,
  UpdatePermintaanStatusInput,
  QueryPermintaanLayananInput,
} from '../dto/service-document.dto.js';
import { ApiError } from '../utils/response.js';
import { generateRequestNumber } from '../utils/numbering.js';
import { getInstanceContext } from '../config/instance.js';

export class PermintaanLayananService {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  /**
   * Create a new service request
   */
  async create(
    data: CreatePermintaanLayananInput,
    createdBy: bigint
  ): Promise<Prisma.PermintaanLayananGetPayload<object>> {
    const { desaId } = getInstanceContext();
    // Verify layanan exists and belongs to the same desa
    const layanan = await this.prismaClient.layanan.findFirst({
      where: { id: data.layananId, desaId, deletedAt: null },
    });

    if (!layanan) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }

    if (!layanan.isActive) {
      throw ApiError.badRequest('Layanan tidak aktif');
    }

    // Verify penduduk exists if provided
    if (data.pendudukId) {
      const penduduk = await this.prismaClient.penduduk.findUnique({
        where: { id: data.pendudukId },
      });

      if (!penduduk) {
        throw ApiError.notFound('Penduduk tidak ditemukan');
      }
    }

    // Generate request number
    const nomorPermintaan = await generateRequestNumber(
      this.prismaClient,
      desaId,
      layanan.kode
    );

    return this.prismaClient.permintaanLayanan.create({
      data: {
        layananId: data.layananId,
        pendudukId: data.pendudukId,
        desaId,
        nomorPermintaan,
        status: RequestStatus.DRAFT,
        dataJson: data.dataJson as Prisma.JsonObject,
        catatan: data.catatan,
        createdBy,
      },
      include: {
        layanan: true,
        penduduk: true,
      },
    });
  }

  /**
   * Find all requests with pagination
   */
  async findAll(
    query: QueryPermintaanLayananInput
  ): Promise<{
    data: Prisma.PermintaanLayananGetPayload<object>[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const { desaId } = getInstanceContext();

    const where: Prisma.PermintaanLayananWhereInput = {
      desaId,
      deletedAt: null,
    };

    if (query.layananId) {
      where.layananId = query.layananId;
    }

    if (query.pendudukId) {
      where.pendudukId = query.pendudukId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { nomorPermintaan: { contains: query.search, mode: 'insensitive' } },
        { catatan: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaClient.permintaanLayanan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sort === 'asc' ? 'asc' : 'desc' },
        include: {
          layanan: true,
          penduduk: true,
        },
      }),
      this.prismaClient.permintaanLayanan.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find request by ID
   */
  async findById(id: bigint): Promise<Prisma.PermintaanLayananGetPayload<object> | null> {
    const { desaId } = getInstanceContext();
    return this.prismaClient.permintaanLayanan.findFirst({
      where: { id, desaId },
      include: {
        layanan: true,
        penduduk: true,
        dokumen: {
          include: {
            templateVersion: true,
          },
        },
      },
    });
  }

  /**
   * Find request by nomor permintaan
   */
  async findByNomor(
    nomorPermintaan: string
  ): Promise<Prisma.PermintaanLayananGetPayload<object> | null> {
    const { desaId } = getInstanceContext();
    return this.prismaClient.permintaanLayanan.findFirst({
      where: { nomorPermintaan, desaId },
      include: {
        layanan: true,
        penduduk: true,
      },
    });
  }

  /**
   * Update request data
   */
  async update(
    id: bigint,
    data: UpdatePermintaanLayananInput
  ): Promise<Prisma.PermintaanLayananGetPayload<object>> {
    const { desaId } = getInstanceContext();
    const existing = await this.prismaClient.permintaanLayanan.findFirst({
      where: { id, desaId },
    });

    if (!existing) {
      throw ApiError.notFound('Permintaan tidak ditemukan');
    }

    // Can only update DRAFT requests
    if (existing.status !== RequestStatus.DRAFT) {
      throw ApiError.badRequest('Hanya permintaan berstatus DRAFT yang dapat diubah');
    }

    return this.prismaClient.permintaanLayanan.update({
      where: { id },
      data: {
        dataJson: data.dataJson as Prisma.JsonObject,
        catatan: data.catatan,
      },
      include: {
        layanan: true,
        penduduk: true,
      },
    });
  }

  /**
   * Update request status
   */
  async updateStatus(
    id: bigint,
    data: UpdatePermintaanStatusInput,
    _actorId: bigint
  ): Promise<Prisma.PermintaanLayananGetPayload<object>> {
    const { desaId } = getInstanceContext();
    const existing = await this.prismaClient.permintaanLayanan.findFirst({
      where: { id, desaId },
      include: { layanan: true },
    });

    if (!existing) {
      throw ApiError.notFound('Permintaan tidak ditemukan');
    }

    // Validate status transition
    const validTransitions: Record<RequestStatus, RequestStatus[]> = {
      DRAFT: [RequestStatus.SUBMITTED, RequestStatus.CANCELLED],
      SUBMITTED: [RequestStatus.VERIFICATION, RequestStatus.CANCELLED],
      VERIFICATION: [RequestStatus.PROCESSING, RequestStatus.REJECTED, RequestStatus.CANCELLED],
      PROCESSING: [RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.CANCELLED],
      APPROVED: [RequestStatus.COMPLETED],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[existing.status].includes(data.status)) {
      throw ApiError.badRequest(
        `Tidak dapat mengubah status dari ${existing.status} ke ${data.status}`
      );
    }

    if (data.status === RequestStatus.REJECTED && (!data.catatan || data.catatan.trim() === '')) {
      throw ApiError.badRequest('Alasan penolakan wajib diisi');
    }

    const updateData: Prisma.PermintaanLayananUpdateInput = {
      status: data.status,
      catatan: data.catatan !== undefined ? data.catatan : existing.catatan,
    };

    // Set timestamp based on new status
    switch (data.status) {
      case RequestStatus.SUBMITTED:
        updateData.submittedAt = new Date();
        break;
      case RequestStatus.PROCESSING:
        updateData.processedAt = new Date();
        break;
      case RequestStatus.COMPLETED:
        updateData.completedAt = new Date();
        break;
    }

    return this.prismaClient.$transaction(async (tx) => {
      const updated = await tx.permintaanLayanan.update({
        where: { id },
        data: updateData,
        include: {
          layanan: true,
          penduduk: true,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'PermintaanLayanan',
          entityId: id,
          action: AuditAction.UPDATE,
          actorId: _actorId,
          actorType: ActorType.USER,
          beforeData: { status: existing.status },
          afterData: { status: updated.status },
          reason: data.status === RequestStatus.REJECTED ? data.catatan : null,
          metadata: { action: 'UPDATE_STATUS' },
        },
      });

      return updated;
    });
  }

  /**
   * Submit request (DRAFT -> SUBMITTED)
   */
  async submit(
    id: bigint,
    actorId: bigint
  ): Promise<Prisma.PermintaanLayananGetPayload<object>> {
    return this.updateStatus(
      id,
      { status: RequestStatus.SUBMITTED },
      actorId
    );
  }

  /**
   * Cancel request
   */
  async cancel(
    id: bigint,
    catatan: string | undefined,
    actorId: bigint
  ): Promise<Prisma.PermintaanLayananGetPayload<object>> {
    return this.updateStatus(
      id,
      { status: RequestStatus.CANCELLED, catatan },
      actorId
    );
  }

  /**
   * Soft delete request
   */
  async softDelete(id: bigint): Promise<void> {
    const { desaId } = getInstanceContext();
    const existing = await this.prismaClient.permintaanLayanan.findFirst({
      where: { id, desaId },
    });

    if (!existing) {
      throw ApiError.notFound('Permintaan tidak ditemukan');
    }

    const terminalStates: RequestStatus[] = [RequestStatus.COMPLETED, RequestStatus.REJECTED, RequestStatus.CANCELLED];
    if (terminalStates.includes(existing.status)) {
      throw ApiError.badRequest('Permintaan yang sudah dalam status akhir (selesai, ditolak, dibatalkan) tidak dapat dihapus');
    }

    await this.prismaClient.permintaanLayanan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get request statistics
   */
  async getStats(): Promise<{
    total: number;
    perStatus: Record<RequestStatus, number>;
  }> {
    const { desaId } = getInstanceContext();
    const [total, allRequests] = await Promise.all([
      this.prismaClient.permintaanLayanan.count({
        where: { desaId, deletedAt: null },
      }),
      this.prismaClient.permintaanLayanan.groupBy({
        by: ['status'],
        where: { desaId, deletedAt: null },
        _count: true,
      }),
    ]);

    const perStatus: Record<RequestStatus, number> = {
      DRAFT: 0,
      SUBMITTED: 0,
      VERIFICATION: 0,
      PROCESSING: 0,
      APPROVED: 0,
      REJECTED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const group of allRequests) {
      perStatus[group.status] = group._count;
    }

    return { total, perStatus };
  }

  /**
   * Create a public service request (without authentication)
   * Used by citizens submitting requests via public form
   */
  async createPublic(
    layananId: bigint,
    fields: Record<string, unknown>,
    catatan?: string
  ): Promise<Prisma.PermintaanLayananGetPayload<object>> {
    // Get layanan info to determine desaId
    const layanan = await this.prismaClient.layanan.findUnique({
      where: { id: layananId },
      select: { id: true, desaId: true, kode: true, nama: true, isActive: true, slug: true },
    });

    if (!layanan) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }

    if (!layanan.isActive) {
      throw ApiError.badRequest('Layanan tidak tersedia');
    }

    // Generate request number
    const nomorPermintaan = await generateRequestNumber(
      this.prismaClient,
      layanan.desaId,
      layanan.kode
    );

    // Create the request
    const request = await this.prismaClient.permintaanLayanan.create({
      data: {
        layananId: layananId,
        desaId: layanan.desaId,
        nomorPermintaan,
        status: RequestStatus.SUBMITTED,
        dataJson: fields as Prisma.JsonObject,
        catatan,
        submittedAt: new Date(),
      },
      include: {
        layanan: true,
      },
    });

    return request;
  }

  /**
   * Find request by nomor permintaan (public tracking)
   * Returns limited information for privacy
   */
  async findByNomorPublic(
    nomorPermintaan: string
  ): Promise<{
    nomorPermintaan: string;
    status: string;
    layanan: { nama: string; kode: string };
    createdAt: Date;
    submittedAt: Date | null;
    processedAt: Date | null;
    completedAt: Date | null;
    catatan: string | null;
    dokumen?: Array<{
      id: string;
      nomorDokumen: string;
      status: string;
      verificationToken: string | null;
    }>;
  } | null> {
    const request = await this.prismaClient.permintaanLayanan.findFirst({
      where: { nomorPermintaan },
      include: {
        layanan: {
          select: { nama: true, kode: true },
        },
        dokumen: {
          select: {
            id: true,
            nomorDokumen: true,
            status: true,
            verificationToken: true,
          },
        },
      },
    });

    if (!request) {
      return null;
    }

    // Return only public-safe information
    return {
      nomorPermintaan: request.nomorPermintaan,
      status: request.status,
      layanan: request.layanan,
      createdAt: request.createdAt,
      submittedAt: request.submittedAt,
      processedAt: request.processedAt,
      completedAt: request.completedAt,
      catatan: request.catatan,
      dokumen: request.dokumen.length > 0
        ? request.dokumen.map(d => ({
          id: d.id.toString(),
          nomorDokumen: d.nomorDokumen,
          status: d.status,
          verificationToken: d.verificationToken,
        }))
        : undefined,
    };
  }
}

// Export singleton instance
export const permintaanLayananService = new PermintaanLayananService();

