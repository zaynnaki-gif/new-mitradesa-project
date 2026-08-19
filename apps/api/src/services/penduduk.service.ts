import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import {
  CreatePendudukInput,
  UpdatePendudukInput,
  QueryPendudukInput,
  PendudukResponse,
} from '../dto/penduduk.dto.js';
import { maskNik, maskEmail, maskPhone } from '../utils/pii.js';
import { ApiError } from '../utils/response.js';
import { Prisma } from '@prisma/client';
import { getInstanceContext } from '../config/instance.js';

/**
 * Penduduk Service - Master Identity Warga
 *
 * Handles all business logic for Penduduk CRUD operations
 */
export class PendudukService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Map Prisma Penduduk to response DTO
   */
  private toResponse(
    penduduk: any,
    options: { maskNik?: boolean; maskContact?: boolean } = {}
  ): PendudukResponse {
    const { maskNik: shouldMaskNik = false, maskContact: shouldMaskContact = false } = options;

    return {
      id: penduduk.id.toString(),
      nik: shouldMaskNik ? maskNik(penduduk.nik) : penduduk.nik,
      namaLengkap: penduduk.namaLengkap,
      tempatLahir: penduduk.tempatLahir,
      tanggalLahir: penduduk.tanggalLahir
        ? new Date(penduduk.tanggalLahir).toISOString().split('T')[0]
        : '',
      jenisKelamin: penduduk.jenisKelamin,
      golDarah: penduduk.golDarah,
      agama: penduduk.agama,
      statusPerkawinan: penduduk.statusPerkawinan,
      hubunganKeluarga: penduduk.hubunganKeluarga,
      alamat: penduduk.alamat,
      rt: penduduk.rt,
      rw: penduduk.rw,
      dusun: penduduk.dusun,
      kodePos: penduduk.kodePos,
      telepon: shouldMaskContact ? maskPhone(penduduk.telepon || '') : penduduk.telepon,
      email: shouldMaskContact ? maskEmail(penduduk.email || '') : penduduk.email,
      wargaNegara: penduduk.wargaNegara,
      nikAyah: penduduk.nikAyah ? (shouldMaskNik ? maskNik(penduduk.nikAyah) : penduduk.nikAyah) : null,
      nikIbu: penduduk.nikIbu ? (shouldMaskNik ? maskNik(penduduk.nikIbu) : penduduk.nikIbu) : null,
      isAktif: penduduk.isAktif,
      statusKepindahan: penduduk.statusKepindahan,
      desaId: penduduk.desaId?.toString() || null,
      createdAt: penduduk.createdAt.toISOString(),
      updatedAt: penduduk.updatedAt.toISOString(),
    };
  }

  /**
   * List Penduduk with pagination, search, and filters
   */
  async findAll(
    query: QueryPendudukInput,
    options: { maskNik?: boolean; maskContact?: boolean } = {}
  ) {
    const { page, limit, search, nik, namaLengkap, jenisKelamin, isAktif, statusPerkawinan, agama } = query as QueryPendudukInput & { [key: string]: unknown };
    const { desaId } = getInstanceContext();
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Soft delete filter - exclude deleted by default
    if (isAktif !== undefined) {
      where.isAktif = isAktif;
    } else {
      // Default: show only active
      where.isAktif = true;
    }

    // Search by name
    if (namaLengkap) {
      where.namaLengkap = { contains: namaLengkap, mode: 'insensitive' };
    }

    // Search by full text (nik + nama)
    if (search) {
      where.OR = [
        { namaLengkap: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search } },
        { tempatLahir: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exact NIK filter (for authorized access)
    if (nik) {
      where.nik = nik;
    }

    // Filters
    if (jenisKelamin) {
      where.jenisKelamin = jenisKelamin;
    }
    if (statusPerkawinan) {
      where.statusPerkawinan = statusPerkawinan;
    }
    if (agama) {
      where.agama = agama;
    }
    if (desaId) {
      where.desaId = desaId;
    }

    // Execute query with pagination
    const [penduduks, total] = await Promise.all([
      prisma.penduduk.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { namaLengkap: 'asc' },
        include: {
          desa: {
            select: {
              id: true,
              nama: true,
              kode: true,
            },
          },
        },
      }),
      prisma.penduduk.count({ where }),
    ]);

    return {
      data: penduduks.map((p) => this.toResponse(p, options)),
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get Penduduk by ID
   */
  async findById(id: bigint, options: { maskNik?: boolean; maskContact?: boolean } = {}) {
    const { desaId } = getInstanceContext();
    const penduduk = await prisma.penduduk.findFirst({
      where: { id, desaId },
      include: {
        desa: {
          select: {
            id: true,
            nama: true,
            kode: true,
            kecamatan: {
              select: {
                id: true,
                nama: true,
                kabupaten: {
                  select: {
                    id: true,
                    nama: true,
                    provinsi: {
                      select: {
                        id: true,
                        nama: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!penduduk) {
      throw ApiError.notFound('Penduduk not found');
    }

    // Check soft delete
    if (!penduduk.isAktif) {
      throw ApiError.notFound('Penduduk not found or inactive');
    }

    return this.toResponse(penduduk, options);
  }

  /**
   * Get Penduduk by NIK
   */
  async findByNik(nik: string, options: { maskNik?: boolean; maskContact?: boolean } = {}) {
    const { desaId } = getInstanceContext();
    const penduduk = await prisma.penduduk.findFirst({
      where: { nik, desaId },
      include: {
        desa: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!penduduk) {
      throw ApiError.notFound('Penduduk not found');
    }

    if (!penduduk.isAktif) {
      throw ApiError.notFound('Penduduk not found or inactive');
    }

    return this.toResponse(penduduk, options);
  }

  /**
   * Create new Penduduk
   */
  async create(
    data: CreatePendudukInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const createData = data as CreatePendudukInput & { [key: string]: unknown };
    const { desaId } = getInstanceContext();

    // Check for duplicate NIK
    const existing = await prisma.penduduk.findFirst({
      where: { nik: String(createData.nik), desaId },
    });

    if (existing) {
      throw ApiError.conflict('NIK already exists');
    }



    // Create in transaction with audit
    try {
      const result = await prisma.$transaction(async (tx) => {
        const penduduk = await tx.penduduk.create({
          data: {
            nik: String(createData.nik),
            namaLengkap: String(createData.namaLengkap),
            tempatLahir: String(createData.tempatLahir),
            tanggalLahir: new Date(String(createData.tanggalLahir)),
            jenisKelamin: String(createData.jenisKelamin),
            golDarah: createData.golDarah ? String(createData.golDarah) : null,
            agama: createData.agama ? String(createData.agama) : null,
            statusPerkawinan: String(createData.statusPerkawinan),
            hubunganKeluarga: createData.hubunganKeluarga ? String(createData.hubunganKeluarga) : null,
            alamat: createData.alamat ? String(createData.alamat) : null,
            rt: createData.rt ? String(createData.rt) : null,
            rw: createData.rw ? String(createData.rw) : null,
            dusun: createData.dusun ? String(createData.dusun) : null,
            kodePos: createData.kodePos ? String(createData.kodePos) : null,
            telepon: createData.telepon ? String(createData.telepon) : null,
            email: createData.email ? String(createData.email) : null,
            wargaNegara: createData.wargaNegara ? String(createData.wargaNegara) : 'Indonesia',
            nikAyah: createData.nikAyah ? String(createData.nikAyah) : null,
            nikIbu: createData.nikIbu ? String(createData.nikIbu) : null,
            isAktif: createData.isAktif !== undefined ? Boolean(createData.isAktif) : true,
            statusKepindahan: createData.statusKepindahan ? String(createData.statusKepindahan) : null,
            desaId: desaId ?? null,
          },
        });

        return penduduk;
      });

      // Audit log (after transaction)
      await this.auditService.log({
        entityType: 'penduduk',
        entityId: result.id,
        action: 'PENDUDUK_CREATED',
        actorId,
        actorType: 'USER',
        actorIp,
        actorAgent,
        afterData: {
          id: result.id.toString(),
          nik: result.nik, // Keep for audit, will be masked if needed
          namaLengkap: result.namaLengkap,
        },
      });

      return this.toResponse(result, { maskNik: false });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ApiError.conflict('NIK already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Update Penduduk
   */
  async update(
    id: bigint,
    data: UpdatePendudukInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const updateInput = data as UpdatePendudukInput & { [key: string]: unknown };
    const { desaId } = getInstanceContext();

    // Check exists
    const existing = await prisma.penduduk.findFirst({
      where: { id, desaId },
    });

    if (!existing) {
      throw ApiError.notFound('Penduduk not found');
    }

    // Build update data
    const updateData: any = {};
    if (updateInput.namaLengkap !== undefined) updateData.namaLengkap = String(updateInput.namaLengkap);
    if (updateInput.tempatLahir !== undefined) updateData.tempatLahir = String(updateInput.tempatLahir);
    if (updateInput.tanggalLahir !== undefined) updateData.tanggalLahir = new Date(String(updateInput.tanggalLahir));
    if (updateInput.jenisKelamin !== undefined) updateData.jenisKelamin = String(updateInput.jenisKelamin);
    if (updateInput.golDarah !== undefined) updateData.golDarah = updateInput.golDarah ? String(updateInput.golDarah) : null;
    if (updateInput.agama !== undefined) updateData.agama = updateInput.agama ? String(updateInput.agama) : null;
    if (updateInput.statusPerkawinan !== undefined) updateData.statusPerkawinan = String(updateInput.statusPerkawinan);
    if (updateInput.hubunganKeluarga !== undefined) updateData.hubunganKeluarga = updateInput.hubunganKeluarga ? String(updateInput.hubunganKeluarga) : null;
    if (updateInput.alamat !== undefined) updateData.alamat = updateInput.alamat ? String(updateInput.alamat) : null;
    if (updateInput.rt !== undefined) updateData.rt = updateInput.rt ? String(updateInput.rt) : null;
    if (updateInput.rw !== undefined) updateData.rw = updateInput.rw ? String(updateInput.rw) : null;
    if (updateInput.dusun !== undefined) updateData.dusun = updateInput.dusun ? String(updateInput.dusun) : null;
    if (updateInput.kodePos !== undefined) updateData.kodePos = updateInput.kodePos ? String(updateInput.kodePos) : null;
    if (updateInput.telepon !== undefined) updateData.telepon = updateInput.telepon ? String(updateInput.telepon) : null;
    if (updateInput.email !== undefined) updateData.email = updateInput.email ? String(updateInput.email) : null;
    if (updateInput.wargaNegara !== undefined) updateData.wargaNegara = String(updateInput.wargaNegara);
    if (updateInput.nikAyah !== undefined) updateData.nikAyah = updateInput.nikAyah ? String(updateInput.nikAyah) : null;
    if (updateInput.nikIbu !== undefined) updateData.nikIbu = updateInput.nikIbu ? String(updateInput.nikIbu) : null;
    if (updateInput.isAktif !== undefined) updateData.isAktif = Boolean(updateInput.isAktif);
    if (updateInput.statusKepindahan !== undefined) updateData.statusKepindahan = updateInput.statusKepindahan ? String(updateInput.statusKepindahan) : null;



    try {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.penduduk.update({
          where: { id },
          data: updateData,
        });

        return updated;
      });

      // Audit log
      await this.auditService.log({
        entityType: 'penduduk',
        entityId: id,
        action: 'PENDUDUK_UPDATED',
        actorId,
        actorType: 'USER',
        actorIp,
        actorAgent,
        beforeData: {
          id: existing.id.toString(),
          nik: existing.nik,
          namaLengkap: existing.namaLengkap,
        },
        afterData: {
          id: result.id.toString(),
          nik: result.nik,
          namaLengkap: result.namaLengkap,
          changedFields: Object.keys(updateData),
        },
      });

      return this.toResponse(result, { maskNik: false });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ApiError.conflict('NIK already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Soft delete Penduduk (set isAktif = false)
   */
  async softDelete(
    id: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    // Check exists
    const existing = await prisma.penduduk.findFirst({
      where: { id, desaId },
    });

    if (!existing) {
      throw ApiError.notFound('Penduduk not found');
    }

    if (!existing.isAktif) {
      throw ApiError.notFound('Penduduk already inactive');
    }

    // Check for FK constraints - Keluarga kepala
    const keluargaAsKepala = await prisma.keluarga.findFirst({
      where: { kepalaId: id, deletedAt: null },
    });

    if (keluargaAsKepala) {
      throw ApiError.badRequest(
        'Cannot deactivate Penduduk who is kepala keluarga. Update or deactivate keluarga first.'
      );
    }

    // Check for active keluarga membership
    const activeMembership = await prisma.anggotaKeluarga.findFirst({
      where: {
        pendudukId: id,
        isAktif: true,
      },
    });

    if (activeMembership) {
      throw ApiError.badRequest(
        'Cannot deactivate Penduduk with active keluarga membership.'
      );
    }

    // Soft delete in transaction
    const result = await prisma.$transaction(async (tx) => {
      return tx.penduduk.update({
        where: { id },
        data: {
          isAktif: false,
          deletedAt: new Date(),
        },
      });
    });

    // Audit log
    await this.auditService.log({
      entityType: 'penduduk',
      entityId: id,
      action: 'PENDUDUK_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: {
        id: existing.id.toString(),
        nik: existing.nik,
        namaLengkap: existing.namaLengkap,
        isAktif: existing.isAktif,
      },
      afterData: {
        id: result.id.toString(),
        nik: result.nik,
        namaLengkap: result.namaLengkap,
        isAktif: false,
      },
      reason: 'Soft delete - penduduk deactivated',
    });

    return { message: 'Penduduk deactivated successfully' };
  }

  /**
   * Get count statistics
   */
  async getStats() {
    const { desaId } = getInstanceContext();
    const where: any = {};
    if (desaId) where.desaId = desaId;

    const [total, aktif, nonAktif, byJenisKelamin, byAgama] = await Promise.all([
      prisma.penduduk.count({ where }),
      prisma.penduduk.count({ where: { ...where, isAktif: true } }),
      prisma.penduduk.count({ where: { ...where, isAktif: false } }),
      prisma.penduduk.groupBy({
        by: ['jenisKelamin'],
        where: { ...where, isAktif: true },
        _count: true,
      }),
      prisma.penduduk.groupBy({
        by: ['agama'],
        where: { ...where, isAktif: true, agama: { not: null } },
        _count: true,
      }),
    ]);

    return {
      total,
      aktif,
      nonAktif,
      byJenisKelamin: byJenisKelamin.reduce((acc, item) => {
        acc[item.jenisKelamin] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byAgama: byAgama.reduce((acc, item) => {
        if (item.agama) acc[item.agama] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const pendudukService = new PendudukService();

