/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import { ApiError } from '../utils/response.js';
import {
  GubugResponse,
  RwResponse,
  RtResponse,
  WilayahTreeResponse,
  WilayahDropdownResponse,
} from '../dto/wilayah.dto.js';

export class WilayahService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  // ============================================
  // Mapper methods
  // ============================================
  private toGubugResponse(g: any): GubugResponse {
    return {
      id: g.id.toString(),
      desaId: g.desaId.toString(),
      kode: g.kode,
      nama: g.nama,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    };
  }

  private toRwResponse(r: any): RwResponse {
    return {
      id: r.id.toString(),
      gubugId: r.gubugId.toString(),
      kode: r.kode,
      nama: r.nama,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private toRtResponse(r: any): RtResponse {
    return {
      id: r.id.toString(),
      rwId: r.rwId.toString(),
      kode: r.kode,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  // ============================================
  // Gubug (Dusun) CRUD
  // ============================================
  async getGubugAll(desaId?: bigint) {
    const where = desaId ? { desaId } : undefined;
    const data = await prisma.gubug.findMany({
      where,
      orderBy: [{ kode: 'asc' }],
    });
    return data.map(g => this.toGubugResponse(g));
  }

  async getGubugById(id: bigint) {
    const g = await prisma.gubug.findUnique({ where: { id } });
    if (!g) throw ApiError.notFound('Gubug tidak ditemukan');
    return this.toGubugResponse(g);
  }

  async createGubug(
    data: { desaId: bigint; kode: string; nama: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    // Check duplicate
    const existing = await prisma.gubug.findFirst({
      where: { desaId: data.desaId, kode: data.kode },
    });
    if (existing) throw ApiError.conflict('Kode gubug sudah ada');

    const result = await prisma.gubug.create({ data });

    await this.auditService.log({
      entityType: 'gubug',
      entityId: result.id,
      action: 'GUBUG_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), kode: result.kode, nama: result.nama },
    });

    return this.toGubugResponse(result);
  }

  async updateGubug(
    id: bigint,
    data: { kode?: string; nama?: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.gubug.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Gubug tidak ditemukan');

    // Check duplicate kode if changing
    if (data.kode && data.kode !== existing.kode) {
      const dup = await prisma.gubug.findFirst({
        where: { desaId: existing.desaId, kode: data.kode, id: { not: id } },
      });
      if (dup) throw ApiError.conflict('Kode gubug sudah ada');
    }

    const result = await prisma.gubug.update({ where: { id }, data });

    await this.auditService.log({
      entityType: 'gubug',
      entityId: id,
      action: 'GUBUG_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode, nama: existing.nama },
      afterData: { kode: result.kode, nama: result.nama },
    });

    return this.toGubugResponse(result);
  }

  async deleteGubug(
    id: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.gubug.findUnique({
      where: { id },
      include: { _count: { select: { rws: true } } },
    });
    if (!existing) throw ApiError.notFound('Gubug tidak ditemukan');
    if (existing._count.rws > 0) {
      throw ApiError.badRequest('Hapus RW terlebih dahulu sebelum menghapus gubug');
    }

    await prisma.gubug.delete({ where: { id } });

    await this.auditService.log({
      entityType: 'gubug',
      entityId: id,
      action: 'GUBUG_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode, nama: existing.nama },
    });

    return { message: 'Gubug dihapus' };
  }

  // ============================================
  // Rw CRUD
  // ============================================
  async getRwAll(gubugId?: bigint) {
    const where = gubugId ? { gubugId } : undefined;
    const data = await prisma.rw.findMany({
      where,
      orderBy: [{ kode: 'asc' }],
    });
    return data.map(r => this.toRwResponse(r));
  }

  async getRwById(id: bigint) {
    const r = await prisma.rw.findUnique({ where: { id } });
    if (!r) throw ApiError.notFound('RW tidak ditemukan');
    return this.toRwResponse(r);
  }

  async getRwByGubug(gubugId: bigint) {
    const data = await prisma.rw.findMany({
      where: { gubugId },
      orderBy: { kode: 'asc' },
    });
    return data.map(r => this.toRwResponse(r));
  }

  async createRw(
    data: { gubugId: bigint; kode: string; nama: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    // Check duplicate
    const existing = await prisma.rw.findFirst({
      where: { gubugId: data.gubugId, kode: data.kode },
    });
    if (existing) throw ApiError.conflict('Kode RW sudah ada');

    const result = await prisma.rw.create({ data });

    await this.auditService.log({
      entityType: 'rw',
      entityId: result.id,
      action: 'RW_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), kode: result.kode, nama: result.nama },
    });

    return this.toRwResponse(result);
  }

  async updateRw(
    id: bigint,
    data: { kode?: string; nama?: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.rw.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('RW tidak ditemukan');

    // Check duplicate kode
    if (data.kode && data.kode !== existing.kode) {
      const dup = await prisma.rw.findFirst({
        where: { gubugId: existing.gubugId, kode: data.kode, id: { not: id } },
      });
      if (dup) throw ApiError.conflict('Kode RW sudah ada');
    }

    const result = await prisma.rw.update({ where: { id }, data });

    await this.auditService.log({
      entityType: 'rw',
      entityId: id,
      action: 'RW_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode, nama: existing.nama },
      afterData: { kode: result.kode, nama: result.nama },
    });

    return this.toRwResponse(result);
  }

  async deleteRw(
    id: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.rw.findUnique({
      where: { id },
      include: { _count: { select: { rts: true } } },
    });
    if (!existing) throw ApiError.notFound('RW tidak ditemukan');
    if (existing._count.rts > 0) {
      throw ApiError.badRequest('Hapus RT terlebih dahulu sebelum menghapus RW');
    }

    await prisma.rw.delete({ where: { id } });

    await this.auditService.log({
      entityType: 'rw',
      entityId: id,
      action: 'RW_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode, nama: existing.nama },
    });

    return { message: 'RW dihapus' };
  }

  // ============================================
  // Rt CRUD
  // ============================================
  async getRtAll(rwId?: bigint) {
    const where = rwId ? { rwId } : undefined;
    const data = await prisma.rt.findMany({
      where,
      orderBy: { kode: 'asc' },
    });
    return data.map(r => this.toRtResponse(r));
  }

  async getRtById(id: bigint) {
    const r = await prisma.rt.findUnique({ where: { id } });
    if (!r) throw ApiError.notFound('RT tidak ditemukan');
    return this.toRtResponse(r);
  }

  async getRtByRw(rwId: bigint) {
    const data = await prisma.rt.findMany({
      where: { rwId },
      orderBy: { kode: 'asc' },
    });
    return data.map(r => this.toRtResponse(r));
  }

  async createRt(
    data: { rwId: bigint; kode: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    // Check duplicate
    const existing = await prisma.rt.findFirst({
      where: { rwId: data.rwId, kode: data.kode },
    });
    if (existing) throw ApiError.conflict('Kode RT sudah ada');

    const result = await prisma.rt.create({ data });

    await this.auditService.log({
      entityType: 'rt',
      entityId: result.id,
      action: 'RT_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), kode: result.kode },
    });

    return this.toRtResponse(result);
  }

  async updateRt(
    id: bigint,
    data: { kode?: string },
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.rt.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('RT tidak ditemukan');

    // Check duplicate kode
    if (data.kode && data.kode !== existing.kode) {
      const dup = await prisma.rt.findFirst({
        where: { rwId: existing.rwId, kode: data.kode, id: { not: id } },
      });
      if (dup) throw ApiError.conflict('Kode RT sudah ada');
    }

    const result = await prisma.rt.update({ where: { id }, data });

    await this.auditService.log({
      entityType: 'rt',
      entityId: id,
      action: 'RT_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode },
      afterData: { kode: result.kode },
    });

    return this.toRtResponse(result);
  }

  async deleteRt(
    id: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.rt.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('RT tidak ditemukan');

    await prisma.rt.delete({ where: { id } });

    await this.auditService.log({
      entityType: 'rt',
      entityId: id,
      action: 'RT_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { kode: existing.kode },
    });

    return { message: 'RT dihapus' };
  }

  // ============================================
  // Tree & Dropdown
  // ============================================
  async getTree(desaId: bigint): Promise<WilayahTreeResponse[]> {
    const gubugs = await prisma.gubug.findMany({
      where: { desaId },
      orderBy: { kode: 'asc' },
      include: {
        rws: {
          orderBy: { kode: 'asc' },
          include: {
            rts: {
              orderBy: { kode: 'asc' },
              select: { id: true, kode: true },
            },
          },
        },
      },
    });

    return gubugs.map(g => ({
      id: g.id.toString(),
      kode: g.kode,
      nama: g.nama,
      rw: g.rws.map(r => ({
        id: r.id.toString(),
        kode: r.kode,
        nama: r.nama,
        rt: r.rts.map(rt => ({
          id: rt.id.toString(),
          kode: rt.kode,
        })),
      })),
    }));
  }

  async getDropdown(desaId?: bigint): Promise<WilayahDropdownResponse> {
    const [gubugs, rws, rts] = await Promise.all([
      prisma.gubug.findMany({
        where: desaId ? { desaId } : undefined,
        orderBy: { kode: 'asc' },
        select: { id: true, kode: true, nama: true },
      }),
      prisma.rw.findMany({
        where: desaId ? { gubug: { desaId } } : undefined,
        orderBy: { kode: 'asc' },
        select: { id: true, gubugId: true, kode: true, nama: true },
      }),
      prisma.rt.findMany({
        where: desaId ? { rw: { gubug: { desaId } } } : undefined,
        orderBy: { kode: 'asc' },
        select: { id: true, rwId: true, kode: true },
      }),
    ]);

    return {
      gubug: gubugs.map(g => ({
        id: g.id.toString(),
        kode: g.kode,
        nama: g.nama,
      })),
      rw: rws.map(r => ({
        id: r.id.toString(),
        gubugId: r.gubugId.toString(),
        kode: r.kode,
        nama: r.nama,
      })),
      rt: rts.map(rt => ({
        id: rt.id.toString(),
        rwId: rt.rwId.toString(),
        kode: rt.kode,
      })),
    };
  }
  async getProvinsiAll() {
    return prisma.provinsi.findMany({
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get province by ID
   */
  async getProvinsiById(id: number) {
    return prisma.provinsi.findUnique({
      where: { id },
      include: { kabupatens: true },
    });
  }

  /**
   * Create province
   */
  async createProvinsi(data: { kode: string; nama: string }) {
    return prisma.provinsi.create({ data });
  }

  /**
   * Update province
   */
  async updateProvinsi(id: number, data: { kode?: string; nama?: string }) {
    return prisma.provinsi.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete province
   */
  async deleteProvinsi(id: number) {
    await prisma.provinsi.delete({ where: { id } });
  }

  /**
   * Get all regencies
   */
  async getKabupatenAll(provinsiId?: number) {
    const where = provinsiId ? { provinsiId } : undefined;
    return prisma.kabupaten.findMany({
      where,
      include: { provinsi: true },
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get regency by ID
   */
  async getKabupatenById(id: number) {
    return prisma.kabupaten.findUnique({
      where: { id },
      include: { provinsi: true, kecamatans: true },
    });
  }

  /**
   * Create regency
   */
  async createKabupaten(data: { provinsiId: number; kode: string; nama: string }) {
    return prisma.kabupaten.create({ data });
  }

  /**
   * Update regency
   */
  async updateKabupaten(id: number, data: { kode?: string; nama?: string }) {
    return prisma.kabupaten.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete regency
   */
  async deleteKabupaten(id: number) {
    await prisma.kabupaten.delete({ where: { id } });
  }

  /**
   * Get all districts
   */
  async getKecamatanAll(kabupatenId?: number) {
    const where = kabupatenId ? { kabupatenId } : undefined;
    return prisma.kecamatan.findMany({
      where,
      include: { kabupaten: { include: { provinsi: true } } },
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get district by ID
   */
  async getKecamatanById(id: number) {
    return prisma.kecamatan.findUnique({
      where: { id },
      include: { kabupaten: true, desas: true },
    });
  }

  /**
   * Create district
   */
  async createKecamatan(data: { kabupatenId: number; kode: string; nama: string }) {
    return prisma.kecamatan.create({ data });
  }

  /**
   * Update district
   */
  async updateKecamatan(id: number, data: { kode?: string; nama?: string }) {
    return prisma.kecamatan.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete district
   */
  async deleteKecamatan(id: number) {
    await prisma.kecamatan.delete({ where: { id } });
  }

  /**
   * Get all villages
   */
  async getDesaAll(kecamatanId?: number) {
    const where = kecamatanId ? { kecamatanId } : undefined;
    return prisma.desa.findMany({
      where,
      include: { kecamatan: { include: { kabupaten: true } } },
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get village by ID
   */
  async getDesaById(id: number) {
    return prisma.desa.findUnique({
      where: { id },
      include: { kecamatan: true },
    });
  }

  /**
   * Create village
   */
  async createDesa(data: { kecamatanId: number; kode: string; nama: string }) {
    return prisma.desa.create({ data });
  }

  /**
   * Update village
   */
  async updateDesa(id: number, data: { kode?: string; nama?: string }) {
    return prisma.desa.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete village
   */
  async deleteDesa(id: number) {
    await prisma.desa.delete({ where: { id } });
  }
}

export const wilayahService = new WilayahService();

