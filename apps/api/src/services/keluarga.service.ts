import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import {
  CreateKeluargaInput,
  UpdateKeluargaInput,
  QueryKeluargaInput,
  CreateAnggotaInput,
  UpdateAnggotaInput,
  KeluargaResponse,
  KeluargaDetailResponse,
  AnggotaResponse,
} from '../dto/keluarga.dto.js';
import { ApiError } from '../utils/response.js';
import { Prisma } from '@prisma/client';
import { getInstanceContext } from '../config/instance.js';

/**
 * KeluargaService - ATOMIC operations for Keluarga + AnggotaKeluarga
 * Follows patterns from PendudukService
 */
export class KeluargaService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Map Prisma Keluarga to response DTO
   */
  private toResponse(keluarga: any): KeluargaResponse {
    return {
      id: keluarga.id.toString(),
      noKk: keluarga.noKk,
      kepalaId: keluarga.kepalaId.toString(),
      kepalaNik: keluarga.kepala?.nik || '',
      kepalaNama: keluarga.kepala?.namaLengkap || '',
      alamat: keluarga.alamat || null,
      rt: keluarga.rt || null,
      rw: keluarga.rw || null,
      dusun: keluarga.dusun || null,
      kodePos: keluarga.kodePos || null,
      desaId: keluarga.desaId?.toString() || null,
      desaNama: keluarga.desa?.nama || null,
      createdAt: keluarga.createdAt.toISOString(),
      updatedAt: keluarga.updatedAt.toISOString(),
      deletedAt: keluarga.deletedAt?.toISOString() || null,
      isAktif: !keluarga.deletedAt,
    };
  }

  /**
   * Map Prisma AnggotaKeluarga to response DTO
   */
  private toAnggotaResponse(anggota: any): AnggotaResponse {
    return {
      id: anggota.id.toString(),
      keluargaId: anggota.keluargaId.toString(),
      pendudukId: anggota.pendudukId.toString(),
      nik: anggota.penduduk?.nik || '',
      namaLengkap: anggota.penduduk?.namaLengkap || '',
      hubungan: anggota.hubungan,
      isAktif: anggota.isAktif,
      createdAt: anggota.createdAt.toISOString(),
    };
  }

  /**
   * List all keluarga with pagination
   */
  async findAll(query: QueryKeluargaInput) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };

    const { desaId } = getInstanceContext();

    if (query.search) {
      where.OR = [
        { noKk: { contains: query.search } },
        { kepala: { namaLengkap: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.noKk) where.noKk = query.noKk;
    if (query.kepalaId) where.kepalaId = query.kepalaId;
    if (desaId) where.desaId = desaId;

    const [data, total] = await Promise.all([
      prisma.keluarga.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          kepala: { select: { id: true, nik: true, namaLengkap: true } },
          desa: { select: { id: true, nama: true } },
        },
      }),
      prisma.keluarga.count({ where }),
    ]);

    return {
      data: data.map(r => this.toResponse(r)),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  /**
   * Get keluarga by ID with anggota
   */
  async findById(id: bigint): Promise<KeluargaDetailResponse> {
    const { desaId } = getInstanceContext();
    const keluarga = await prisma.keluarga.findFirst({
      where: { id, desaId },
      include: {
        kepala: { select: { id: true, nik: true, namaLengkap: true } },
        desa: { select: { id: true, nama: true } },
        anggota: {
          where: { isAktif: true },
          include: { penduduk: { select: { id: true, nik: true, namaLengkap: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!keluarga || keluarga.deletedAt) {
      throw ApiError.notFound('Keluarga tidak ditemukan');
    }

    return {
      ...this.toResponse(keluarga),
      anggota: keluarga.anggota.map(a => this.toAnggotaResponse(a)),
    };
  }

  /**
   * Get anggota for a keluarga
   */
  async getAnggota(keluargaId: bigint): Promise<AnggotaResponse[]> {
    const { desaId } = getInstanceContext();
    const keluarga = await prisma.keluarga.findFirst({ where: { id: keluargaId, desaId } });
    if (!keluarga || keluarga.deletedAt) {
      throw ApiError.notFound('Keluarga tidak ditemukan');
    }

    const anggota = await prisma.anggotaKeluarga.findMany({
      where: { keluargaId, isAktif: true },
      include: { penduduk: { select: { id: true, nik: true, namaLengkap: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return anggota.map(a => this.toAnggotaResponse(a));
  }

  /**
   * ATOMIC: create keluarga + kepala as anggota
   */
  async create(
    data: CreateKeluargaInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const kepalaId = typeof data.kepalaId === 'bigint' ? data.kepalaId : data.kepalaId;

    // Validate kepala exists and is active
    const { desaId } = getInstanceContext();
    const kepala = await prisma.penduduk.findFirst({ where: { id: kepalaId, desaId } });
    if (!kepala) throw ApiError.badRequest('Kepala keluarga tidak ditemukan');
    if (!kepala.isAktif) throw ApiError.badRequest('Kepala keluarga tidak aktif');

    // Check no duplicate noKk
    const dup = await prisma.keluarga.findFirst({ where: { noKk: data.noKk, desaId } });
    if (dup && !dup.deletedAt) throw ApiError.conflict('Nomor KK sudah terdaftar');

    // ATOMIC: kepala FK checked first, rollback on any failure
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create keluarga
        const keluarga = await tx.keluarga.create({
          data: {
            noKk: data.noKk,
            kepalaId: kepalaId,
            alamat: data.alamat || null,
            rt: data.rt || null,
            rw: data.rw || null,
            dusun: data.dusun || null,
            kodePos: data.kodePos || null,
            desaId,
          },
        });

        // Add kepala as first anggota
        await tx.anggotaKeluarga.create({
          data: {
            keluargaId: keluarga.id,
            pendudukId: kepalaId,
            hubungan: data.hubunganKepala || 'KEPALA',
            isAktif: true,
          },
        });

        return keluarga;
      });

      // Audit log (after transaction)
      await this.auditService.log({
        entityType: 'keluarga',
        entityId: result.id,
        action: 'KELUARGA_CREATED',
        actorId,
        actorType: 'USER',
        actorIp,
        actorAgent,
        afterData: { id: result.id.toString(), noKk: result.noKk },
      });

      return this.toResponse(result);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ApiError.conflict('Nomor KK sudah terdaftar');
        }
      }
      throw error;
    }
  }

  /**
   * Update keluarga
   */
  async update(
    id: bigint,
    data: UpdateKeluargaInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const existing = await prisma.keluarga.findFirst({ where: { id, desaId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Keluarga tidak ditemukan');

    // Check duplicate noKk if changing
    if (data.noKk && data.noKk !== existing.noKk) {
      const dup = await prisma.keluarga.findFirst({
        where: { noKk: data.noKk, id: { not: id }, desaId },
      });
      if (dup && !dup.deletedAt) throw ApiError.conflict('Nomor KK sudah terdaftar');
    }

    // Validate new kepala if changing
    if (data.kepalaId && data.kepalaId !== existing.kepalaId) {
      const kepala = await prisma.penduduk.findFirst({
        where: { id: data.kepalaId, desaId },
      });
      if (!kepala) throw ApiError.badRequest('Kepala tidak valid');
      if (!kepala.isAktif) throw ApiError.badRequest('Kepala tidak aktif');
    }

    // Build update data
    const updateData: any = {};
    if (data.noKk !== undefined) updateData.noKk = data.noKk;
    if (data.kepalaId !== undefined) updateData.kepalaId = data.kepalaId;
    if (data.alamat !== undefined) updateData.alamat = data.alamat;
    if (data.rt !== undefined) updateData.rt = data.rt;
    if (data.rw !== undefined) updateData.rw = data.rw;
    if (data.dusun !== undefined) updateData.dusun = data.dusun;
    if (data.kodePos !== undefined) updateData.kodePos = data.kodePos;

    const result = await prisma.keluarga.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await this.auditService.log({
      entityType: 'keluarga',
      entityId: id,
      action: 'KELUARGA_UPDATED',
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
   * Soft delete keluarga
   */
  async softDelete(
    id: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const existing = await prisma.keluarga.findFirst({ where: { id, desaId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Keluarga tidak ditemukan');

    // Check for active anggota (except kepala)
    const anggota = await prisma.anggotaKeluarga.findFirst({
      where: { keluargaId: id, isAktif: true },
    });
    if (anggota) throw ApiError.badRequest('Hapus anggota terlebih dahulu');

    // Soft delete in transaction
    await prisma.$transaction(async (tx) => {
      await tx.keluarga.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });

    // Audit log
    await this.auditService.log({
      entityType: 'keluarga',
      entityId: id,
      action: 'KELUARGA_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { id: existing.id.toString(), noKk: existing.noKk },
    });

    return { message: 'Keluarga dihapus' };
  }

  /**
   * Add anggota to keluarga
   */
  async addAnggota(
    keluargaId: bigint,
    data: CreateAnggotaInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const keluarga = await prisma.keluarga.findFirst({ where: { id: keluargaId, desaId } });
    if (!keluarga || keluarga.deletedAt) throw ApiError.notFound('Keluarga tidak ditemukan');

    const penduduk = await prisma.penduduk.findFirst({ where: { id: data.pendudukId, desaId } });
    if (!penduduk) throw ApiError.notFound('Penduduk tidak ditemukan');
    if (!penduduk.isAktif) throw ApiError.badRequest('Penduduk tidak aktif');

    // Prevent kepala being added as anggota
    if (data.pendudukId === keluarga.kepalaId) {
      throw ApiError.badRequest('Tidak dapat menambah kepala sebagai anggota');
    }

    // Check duplicate active membership
    const dup = await prisma.anggotaKeluarga.findFirst({
      where: { keluargaId, pendudukId: data.pendudukId, isAktif: true },
    });
    if (dup) throw ApiError.conflict('Sudah menjadi anggota keluarga ini');

    const result = await prisma.anggotaKeluarga.create({
      data: {
        keluargaId,
        pendudukId: data.pendudukId,
        hubungan: data.hubungan,
        isAktif: data.isAktif ?? true,
      },
    });

    await this.auditService.log({
      entityType: 'anggota_keluarga',
      entityId: result.id,
      action: 'ANGGOTA_ADDED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), keluargaId: keluargaId.toString() },
    });

    return this.toAnggotaResponse({ ...result, penduduk });
  }

  /**
   * Update anggota
   */
  async updateAnggota(
    keluargaId: bigint,
    anggotaId: bigint,
    data: UpdateAnggotaInput,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const existing = await prisma.anggotaKeluarga.findUnique({
      where: { id: anggotaId },
      include: { penduduk: { select: { id: true, nik: true, namaLengkap: true } } },
    });

    if (!existing) throw ApiError.notFound('Anggota tidak ditemukan');
    if (existing.keluargaId !== keluargaId) throw ApiError.notFound('Anggota tidak ditemukan di keluarga ini');

    // Build update data
    const updateData: any = {};
    if (data.hubungan !== undefined) updateData.hubungan = data.hubungan;
    if (data.isAktif !== undefined) updateData.isAktif = data.isAktif;

    const result = await prisma.anggotaKeluarga.update({
      where: { id: anggotaId },
      data: updateData,
      include: { penduduk: { select: { id: true, nik: true, namaLengkap: true } } },
    });

    await this.auditService.log({
      entityType: 'anggota_keluarga',
      entityId: anggotaId,
      action: 'ANGGOTA_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { hubungan: existing.hubungan, isAktif: existing.isAktif },
      afterData: { hubungan: result.hubungan, isAktif: result.isAktif },
    });

    return this.toAnggotaResponse(result);
  }

  /**
   * Remove anggota (soft delete)
   */
  async removeAnggota(
    keluargaId: bigint,
    anggotaId: bigint,
    actorId?: bigint,
    actorIp?: string,
    actorAgent?: string
  ) {
    const { desaId } = getInstanceContext();
    const existing = await prisma.anggotaKeluarga.findUnique({
      where: { id: anggotaId },
    });
    if (!existing) throw ApiError.notFound('Anggota tidak ditemukan');
    if (existing.keluargaId !== keluargaId) throw ApiError.notFound('Anggota tidak ditemukan di keluarga ini');

    const keluarga = await prisma.keluarga.findFirst({ where: { id: keluargaId, desaId } });
    if (!keluarga) throw ApiError.notFound('Keluarga tidak ditemukan');
    if (existing.pendudukId === keluarga.kepalaId) {
      throw ApiError.badRequest('Tidak dapat menghapus kepala keluarga');
    }

    await prisma.anggotaKeluarga.update({
      where: { id: anggotaId },
      data: { isAktif: false },
    });

    await this.auditService.log({
      entityType: 'anggota_keluarga',
      entityId: anggotaId,
      action: 'ANGGOTA_REMOVED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      beforeData: { isAktif: existing.isAktif },
    });

    return { message: 'Anggota dihapus dari keluarga' };
  }

  /**
   * Export all keluarga to CSV format
   */
  async exportToCsv(desaId?: bigint): Promise<string> {
    const where: any = { deletedAt: null };
    if (desaId) where.desaId = desaId;

    const keluargaList = await prisma.keluarga.findMany({
      where,
      include: {
        kepala: { select: { nik: true, namaLengkap: true } },
        anggota: {
          where: { isAktif: true },
          include: {
            penduduk: {
              select: { nik: true, namaLengkap: true, hubunganKeluarga: true },
            },
          },
        },
      },
      orderBy: { noKk: 'asc' },
    });

    // CSV Header
    const headers = ['No_KK', 'Nama_Kepala', 'NIK_Kepala', 'Alamat', 'Dusun', 'RW', 'RT', 'Nama_Anggota', 'NIK_Anggota', 'Hubungan'];

    // Generate rows - one row per anggota (including kepala)
    const rows: string[][] = [];

    for (const keluarga of keluargaList) {
      // Kepala keluarga row
      rows.push([
        keluarga.noKk,
        keluarga.kepala.namaLengkap,
        keluarga.kepala.nik,
        keluarga.alamat || '',
        keluarga.dusun || '',
        keluarga.rw || '',
        keluarga.rt || '',
        keluarga.kepala.namaLengkap,
        keluarga.kepala.nik,
        'KEPALA',
      ]);

      // Other anggota rows
      for (const anggota of keluarga.anggota) {
        if (anggota.penduduk.nik !== keluarga.kepala.nik) {
          rows.push([
            keluarga.noKk,
            keluarga.kepala.namaLengkap,
            keluarga.kepala.nik,
            keluarga.alamat || '',
            keluarga.dusun || '',
            keluarga.rw || '',
            keluarga.rt || '',
            anggota.penduduk.namaLengkap,
            anggota.penduduk.nik,
            anggota.penduduk.hubunganKeluarga || anggota.hubungan,
          ]);
        }
      }
    }

    // Convert to CSV string
    const escapeCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Import keluarga from CSV data
   */
  async importFromCsv(
    csvContent: string,
    _actorId?: bigint,
    _actorIp?: string,
    _actorAgent?: string
  ): Promise<{ keluargaCreated: number; keluargaUpdated: number; pendudukCreated: number; pendudukUpdated: number; failed: number; errors: string[] }> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { keluargaCreated: 0, keluargaUpdated: 0, pendudukCreated: 0, pendudukUpdated: 0, failed: 0, errors: ['File CSV kosong atau tidak valid'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const parseRow = (row: string): Record<string, string> => {
      const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const result: Record<string, string> = {};
      headers.forEach((h, i) => {
        result[h] = (values[i] || '').replace(/^"|"$/g, '').trim();
      });
      return result;
    };

    const result = {
      keluargaCreated: 0,
      keluargaUpdated: 0,
      pendudukCreated: 0,
      pendudukUpdated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Group by No_KK for batch processing
    const keluargaMap = new Map<string, any[]>();

    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      if (!row['No_KK']) continue;

      const keluargaData = keluargaMap.get(row['No_KK']) || [];
      keluargaData.push({ row, line: i + 1 });
      keluargaMap.set(row['No_KK'], keluargaData);
    }

    // Process each keluarga
    for (const [noKk, anggotaRows] of keluargaMap) {
      try {
        // Find or create kepala keluarga (first KEPALA row)
        const kepalaRow = anggotaRows.find(r => r.row['Hubungan'] === 'KEPALA');
        if (!kepalaRow) {
          result.failed++;
          result.errors.push(`No KK ${noKk}: Tidak ada baris KEPALA`);
          continue;
        }

        const kepalaNik = kepalaRow.row['NIK_Kepala']?.replace(/\D/g, '');
        if (!kepalaNik || kepalaNik.length !== 16) {
          result.failed++;
          result.errors.push(`Baris ${kepalaRow.line}: NIK Kepala tidak valid`);
          continue;
        }

        // Find or create penduduk for kepala
        let kepala = await prisma.penduduk.findUnique({ where: { nik: kepalaNik } });
        if (!kepala) {
          kepala = await prisma.penduduk.create({
            data: {
              nik: kepalaNik,
              namaLengkap: kepalaRow.row['Nama_Kepala'] || '',
              tempatLahir: '',
              tanggalLahir: new Date('1970-01-01'),
              jenisKelamin: 'L',
              statusPerkawinan: 'BK',
              hubunganKeluarga: 'KEPALA',
            },
          });
          result.pendudukCreated++;
        } else {
          result.pendudukUpdated++;
        }

        // Find or create keluarga
        let keluarga = await prisma.keluarga.findFirst({
          where: { noKk, deletedAt: null },
        });

        if (!keluarga) {
          keluarga = await prisma.keluarga.create({
            data: {
              noKk,
              kepalaId: kepala.id,
              alamat: kepalaRow.row['Alamat'] || null,
              dusun: kepalaRow.row['Dusun'] || null,
              rw: kepalaRow.row['RW'] || null,
              rt: kepalaRow.row['RT'] || null,
            },
          });
          result.keluargaCreated++;

          // Add kepala as anggota
          await prisma.anggotaKeluarga.create({
            data: {
              keluargaId: keluarga.id,
              pendudukId: kepala.id,
              hubungan: 'KEPALA',
              isAktif: true,
            },
          });
        } else {
          result.keluargaUpdated++;
        }

        // Process other anggota
        for (const { row: anggotaRow, line } of anggotaRows) {
          if (anggotaRow['Hubungan'] === 'KEPALA') continue;

          const nik = anggotaRow['NIK_Anggota']?.replace(/\D/g, '');
          if (!nik || nik.length !== 16) {
            result.errors.push(`Baris ${line}: NIK tidak valid, dilewati`);
            continue;
          }

          // Check if already in keluarga
          const existing = await prisma.anggotaKeluarga.findFirst({
            where: {
              keluargaId: keluarga.id,
              penduduk: { nik },
              isAktif: true,
            },
          });
          if (existing) continue;

          // Find or create penduduk
          let penduduk = await prisma.penduduk.findUnique({ where: { nik } });
          if (!penduduk) {
            penduduk = await prisma.penduduk.create({
              data: {
                nik,
                namaLengkap: anggotaRow['Nama_Anggota'] || '',
                tempatLahir: '',
                tanggalLahir: new Date('1970-01-01'),
                jenisKelamin: 'L',
                statusPerkawinan: 'BK',
                hubunganKeluarga: anggotaRow['Hubungan'] || 'ANAK',
              },
            });
            result.pendudukCreated++;
          } else {
            result.pendudukUpdated++;
          }

          // Add as anggota
          await prisma.anggotaKeluarga.create({
            data: {
              keluargaId: keluarga.id,
              pendudukId: penduduk.id,
              hubungan: anggotaRow['Hubungan'] || 'ANAK',
              isAktif: true,
            },
          });
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`No KK ${noKk}: ${err.message}`);
      }
    }

    return result;
  }
}

export const keluargaService = new KeluargaService();

