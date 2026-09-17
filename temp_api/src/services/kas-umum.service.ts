import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { CreateKasUmumInput, UpdateKasUmumInput, QueryKasUmumInput } from '../dto/kas-umum.dto.js';
import { ApiError } from '../utils/response.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export class KasUmumService {
  async findAll(query: QueryKasUmumInput, desaId?: bigint): Promise<PaginatedResult<unknown>> {
    const { page, limit, tahun, bulan, jenis } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.KasUmumWhereInput = {};
    if (desaId !== undefined) {
      where.desaId = desaId;
    }

    if (tahun) {
      where.tanggal = {
        gte: new Date(`${tahun}-01-01`),
        lte: new Date(`${tahun}-12-31`),
      };
    }

    if (bulan) {
      const year = tahun || new Date().getFullYear();
      const startDate = new Date(year, bulan - 1, 1);
      const endDate = new Date(year, bulan, 0, 23, 59, 59, 999);
      where.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (jenis) {
      where.jenis = jenis;
    }

    const [data, total] = await Promise.all([
      prisma.kasUmum.findMany({
        where,
        orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.kasUmum.count({ where }),
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

  async findById(id: string, desaId?: bigint) {
    const item = await prisma.kasUmum.findFirst({
      where: {
        id,
        ...(desaId !== undefined ? { desaId } : {}),
      },
    });
    if (!item) throw ApiError.notFound('Data tidak ditemukan');
    return item;
  }

  /**
   * Recalculates running balance for all entries chronologically from the earliest modified date.
   * Uses cent/sen precision (Math.round * 100 / 100) to prevent IEEE 754 floating-point drift.
   */
  private async recalculateBalances(tx: Prisma.TransactionClient, desaId?: bigint, fromDate?: Date) {
    const where: Prisma.KasUmumWhereInput = {};
    if (desaId !== undefined) {
      where.desaId = desaId;
    }

    // Get previous entry before fromDate to get starting balance
    let currentBalance = 0;
    if (fromDate) {
      const prevEntry = await tx.kasUmum.findFirst({
        where: {
          ...where,
          tanggal: { lt: fromDate },
        },
        orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
      });
      if (prevEntry) {
        currentBalance = prevEntry.saldo;
      }
      where.tanggal = { gte: fromDate };
    }

    const entriesToUpdate = await tx.kasUmum.findMany({
      where,
      orderBy: [{ tanggal: 'asc' }, { createdAt: 'asc' }],
    });

    for (const entry of entriesToUpdate) {
      const masuk = entry.jenis === 'KAS_MASUK' ? entry.jumlah : 0;
      const keluar = entry.jenis === 'KAS_KELUAR' ? entry.jumlah : 0;
      // Fixed cent/sen precision arithmetic:
      const rawNewBalance = Math.round((currentBalance + masuk - keluar) * 100) / 100;
      currentBalance = rawNewBalance;

      if (currentBalance < 0) {
        throw ApiError.badRequest(`Transaksi pada ${entry.tanggal.toISOString().slice(0, 10)} mengakibatkan saldo kas menjadi negatif (${currentBalance})`);
      }

      if (entry.saldo !== currentBalance) {
        await tx.kasUmum.update({
          where: { id: entry.id },
          data: { saldo: currentBalance },
        });
      }
    }
  }

  /**
   * Acquire PostgreSQL transaction-level advisory lock per tenant.
   * Uses two 32-bit integer keys: namespace (1001 for BKU Kas) and tenant ID modulo 2^31 - 1
   * to eliminate cross-domain hash collision and avoid cross-tenant lock bottlenecks.
   */
  private async acquireTenantKasLock(tx: Prisma.TransactionClient, desaId?: bigint) {
    try {
      const NAMESPACE_BKU = 1001;
      const tenantKey = desaId !== undefined ? Number(desaId & 0x7fffffffn) : 0;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${NAMESPACE_BKU}::integer, ${tenantKey}::integer)`;
    } catch {
      // Fallback for non-Postgres test environments
    }
  }

  private async syncApbdesRealization(tx: Prisma.TransactionClient, apbdesItemId: bigint) {
    const totalRealisasi = await tx.kasUmum.aggregate({
      where: { apbdesItemId },
      _sum: { jumlah: true },
    });
    await tx.apbdesItem.update({
      where: { id: apbdesItemId },
      data: { realization: totalRealisasi._sum.jumlah || 0 },
    });
  }

  async create(data: CreateKasUmumInput, desaId?: bigint) {
    const entryDate = new Date(data.tanggal);

    return prisma.$transaction(async (tx) => {
      await this.acquireTenantKasLock(tx, desaId);

      // Verify ApbdesItem if provided
      let targetApbdesItem = null;
      if (data.apbdesItemId) {
        targetApbdesItem = await tx.apbdesItem.findUnique({
          where: { id: BigInt(data.apbdesItemId) },
          include: { apbdes: true },
        });
        if (!targetApbdesItem) {
          throw ApiError.badRequest('Item APBDes tidak ditemukan');
        }
        if (desaId && targetApbdesItem.apbdes.desaId !== desaId) {
          throw ApiError.forbidden('Item APBDes bukan milik desa ini');
        }
        // Budget year validation
        if (entryDate.getFullYear() !== targetApbdesItem.apbdes.tahun) {
          throw ApiError.badRequest(
            `Tahun transaksi kas (${entryDate.getFullYear()}) tidak sesuai dengan tahun anggaran APBDes (${targetApbdesItem.apbdes.tahun})`
          );
        }
      }

      // Create with placeholder saldo
      const created = await tx.kasUmum.create({
        data: {
          ...(desaId !== undefined ? { desaId } : {}),
          tanggal: entryDate,
          jenis: data.jenis,
          uraian: data.uraian,
          jumlah: data.jumlah,
          saldo: 0,
          kodeRekening: data.kodeRekening || targetApbdesItem?.kodeRekening || null,
          apbdesItemId: data.apbdesItemId ? BigInt(data.apbdesItemId) : null,
        },
      });

      // Recalculate from entry date
      await this.recalculateBalances(tx, desaId, entryDate);

      // Automatically sync realization on linked ApbdesItem
      if (targetApbdesItem) {
        await this.syncApbdesRealization(tx, targetApbdesItem.id);
      }

      return tx.kasUmum.findUnique({
        where: { id: created.id },
        include: { apbdesItem: true },
      });
    });
  }

  async update(id: string, data: UpdateKasUmumInput, desaId?: bigint) {
    return prisma.$transaction(async (tx) => {
      await this.acquireTenantKasLock(tx, desaId);

      const entry = await tx.kasUmum.findFirst({
        where: {
          id,
          ...(desaId !== undefined ? { desaId } : {}),
        },
      });
      if (!entry) throw ApiError.notFound('Data tidak ditemukan');

      const oldDate = entry.tanggal;
      const newDate = data.tanggal ? new Date(data.tanggal) : oldDate;
      const earliestDate = oldDate < newDate ? oldDate : newDate;

      // Handle new or updated apbdesItemId
      const oldApbdesItemId = entry.apbdesItemId;
      let newApbdesItemId = oldApbdesItemId;
      let targetApbdesItem = null;

      if (data.apbdesItemId !== undefined) {
        newApbdesItemId = data.apbdesItemId ? BigInt(data.apbdesItemId) : null;
      }

      if (newApbdesItemId) {
        targetApbdesItem = await tx.apbdesItem.findUnique({
          where: { id: newApbdesItemId },
          include: { apbdes: true },
        });
        if (!targetApbdesItem) {
          throw ApiError.badRequest('Item APBDes tidak ditemukan');
        }
        if (desaId && targetApbdesItem.apbdes.desaId !== desaId) {
          throw ApiError.forbidden('Item APBDes bukan milik desa ini');
        }
        if (newDate.getFullYear() !== targetApbdesItem.apbdes.tahun) {
          throw ApiError.badRequest(
            `Tahun transaksi kas (${newDate.getFullYear()}) tidak sesuai dengan tahun anggaran APBDes (${targetApbdesItem.apbdes.tahun})`
          );
        }
      }

      await tx.kasUmum.update({
        where: { id },
        data: {
          ...(data.tanggal && { tanggal: newDate }),
          ...(data.jenis && { jenis: data.jenis }),
          ...(data.uraian !== undefined && { uraian: data.uraian }),
          ...(data.jumlah !== undefined && { jumlah: data.jumlah }),
          ...(data.kodeRekening !== undefined && { kodeRekening: data.kodeRekening || targetApbdesItem?.kodeRekening || null }),
          ...(data.apbdesItemId !== undefined && { apbdesItemId: newApbdesItemId }),
        },
      });

      await this.recalculateBalances(tx, desaId, earliestDate);

      // Resync realization for old item and new item
      if (oldApbdesItemId) {
        await this.syncApbdesRealization(tx, oldApbdesItemId);
      }
      if (newApbdesItemId && (!oldApbdesItemId || newApbdesItemId !== oldApbdesItemId)) {
        await this.syncApbdesRealization(tx, newApbdesItemId);
      }

      return tx.kasUmum.findUnique({
        where: { id },
        include: { apbdesItem: true },
      });
    });
  }

  async delete(id: string, desaId?: bigint) {
    return prisma.$transaction(async (tx) => {
      await this.acquireTenantKasLock(tx, desaId);

      const entry = await tx.kasUmum.findFirst({
        where: {
          id,
          ...(desaId !== undefined ? { desaId } : {}),
        },
      });
      if (!entry) throw ApiError.notFound('Data tidak ditemukan');

      const deletedDate = entry.tanggal;
      const linkedApbdesItemId = entry.apbdesItemId;

      await tx.kasUmum.delete({ where: { id } });

      await this.recalculateBalances(tx, desaId, deletedDate);

      // Resync realization for linked item after deletion
      if (linkedApbdesItemId) {
        await this.syncApbdesRealization(tx, linkedApbdesItemId);
      }
    });
  }

  async getSaldoAkhir(desaId?: bigint): Promise<number> {
    const where: Prisma.KasUmumWhereInput = {};
    if (desaId !== undefined) {
      where.desaId = desaId;
    }
    const last = await prisma.kasUmum.findFirst({
      where,
      orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
    });
    return last?.saldo || 0;
  }
}

export const kasUmumService = new KasUmumService();

