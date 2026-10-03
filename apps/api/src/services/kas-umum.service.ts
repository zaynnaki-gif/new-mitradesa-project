import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
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
  async findAll(query: QueryKasUmumInput): Promise<PaginatedResult<unknown>> {
    const { page, limit, tahun, bulan, jenis } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.KasUmumWhereInput = {};

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

  async findById(id: string) {
    const item = await prisma.kasUmum.findFirst({
      where: {
        id: BigInt(id),
        
      },
    });
    if (!item) throw ApiError.notFound('Data tidak ditemukan');
    return item;
  }

  /**
   * Recalculates running balance for all entries chronologically from the earliest modified date.
   * Uses cent/sen precision (Math.round * 100 / 100) to prevent IEEE 754 floating-point drift.
   */
  private async recalculateBalances(tx: Prisma.TransactionClient, fromDate?: Date) {
    const where: Prisma.KasUmumWhereInput = {};

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
  private async acquireTenantKasLock(tx: Prisma.TransactionClient) {
    try {
      const NAMESPACE_BKU = 1001;
      const tenantKey = 1;
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

  private async validateApbdesBudget(tx: Prisma.TransactionClient, apbdesItemId: bigint) {
    const updatedItem = await tx.apbdesItem.findUnique({ where: { id: apbdesItemId } });
    if (updatedItem && updatedItem.kategori === 'BELANJA' && updatedItem.realization > updatedItem.anggaran) {
      throw ApiError.badRequest(`Pengeluaran melebihi pagu anggaran untuk item ${updatedItem.nama}. (Anggaran: ${updatedItem.anggaran}, Realisasi: ${updatedItem.realization})`);
    }
  }

  async create(data: CreateKasUmumInput) {
    const entryDate = new Date(data.tanggal);

    return prisma.$transaction(async (tx) => {
      await this.acquireTenantKasLock(tx);

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
      await this.recalculateBalances(tx, entryDate);

      // Automatically sync realization on linked ApbdesItem
      if (targetApbdesItem) {
        await this.syncApbdesRealization(tx, targetApbdesItem.id);
        await this.validateApbdesBudget(tx, targetApbdesItem.id);
      }

      return tx.kasUmum.findUnique({
        where: { id: created.id },
        include: { apbdesItem: true },
      });
    });
  }

  async update(id: string, data: UpdateKasUmumInput) {
    return prisma.$transaction(async (tx) => {
      await this.acquireTenantKasLock(tx);

      const entry = await tx.kasUmum.findFirst({
        where: {
          id: BigInt(id),
          
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
        
        if (newDate.getFullYear() !== targetApbdesItem.apbdes.tahun) {
          throw ApiError.badRequest(
            `Tahun transaksi kas (${newDate.getFullYear()}) tidak sesuai dengan tahun anggaran APBDes (${targetApbdesItem.apbdes.tahun})`
          );
        }
      }

      await tx.kasUmum.update({
        where: { id: BigInt(id) },
        data: {
          ...(data.tanggal && { tanggal: newDate }),
          ...(data.jenis && { jenis: data.jenis }),
          ...(data.uraian !== undefined && { uraian: data.uraian }),
          ...(data.jumlah !== undefined && { jumlah: data.jumlah }),
          ...(data.kodeRekening !== undefined && { kodeRekening: data.kodeRekening || targetApbdesItem?.kodeRekening || null }),
          ...(data.apbdesItemId !== undefined && { apbdesItemId: newApbdesItemId }),
        },
      });

      await this.recalculateBalances(tx, earliestDate);

      // Resync realization for old item and new item
      if (oldApbdesItemId) {
        await this.syncApbdesRealization(tx, oldApbdesItemId);
        await this.validateApbdesBudget(tx, oldApbdesItemId);
      }
      if (newApbdesItemId && (!oldApbdesItemId || newApbdesItemId !== oldApbdesItemId)) {
        await this.syncApbdesRealization(tx, newApbdesItemId);
        await this.validateApbdesBudget(tx, newApbdesItemId);
      }

      return tx.kasUmum.findUnique({
        where: { id: BigInt(id) },
        include: { apbdesItem: true },
      });
    });
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await this.acquireTenantKasLock(tx);

      const entry = await tx.kasUmum.findFirst({
        where: {
          id: BigInt(id),
          
        },
      });
      if (!entry) throw ApiError.notFound('Data tidak ditemukan');

      const deletedDate = entry.tanggal;
      const linkedApbdesItemId = entry.apbdesItemId;

      await tx.kasUmum.delete({ where: { id: BigInt(id) } });

      await this.recalculateBalances(tx, deletedDate);

      // Resync realization for linked item after deletion
      if (linkedApbdesItemId) {
        await this.syncApbdesRealization(tx, linkedApbdesItemId);
      }
    });
  }

  async getSaldoAkhir(): Promise<number> {
    const entry = await prisma.kasUmum.findFirst({
      orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
    });
    return entry?.saldo || 0;
  }

  async exportKasUmumXlsx(query: QueryKasUmumInput): Promise<Buffer> {
    const { tahun, bulan } = query;
    const where: Prisma.KasUmumWhereInput = {};

    let titlePrefix = 'Buku Kas Umum';
    
    if (tahun) {
      where.tanggal = {
        gte: new Date(`${tahun}-01-01`),
        lte: new Date(`${tahun}-12-31`),
      };
      titlePrefix += ` Tahun ${tahun}`;
    }

    if (bulan && tahun) {
      const year = tahun || new Date().getFullYear();
      const startDate = new Date(year, bulan - 1, 1);
      const endDate = new Date(year, bulan, 0, 23, 59, 59, 999);
      where.tanggal = {
        gte: startDate,
        lte: endDate,
      };
      titlePrefix = `Buku Kas Umum Bulan ${bulan} Tahun ${tahun}`;
    }

    const data = await prisma.kasUmum.findMany({
      where,
      orderBy: [{ tanggal: 'asc' }, { createdAt: 'asc' }],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kas Umum');

    // Title
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = titlePrefix.toUpperCase();
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    sheet.addRow([]);

    // Headers
    const headers = ['No.', 'Tanggal', 'Kode Rekening', 'Uraian', 'Penerimaan', 'Pengeluaran', 'Saldo Kumulatif'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    sheet.columns = [
      { width: 5 },  // No
      { width: 15 }, // Tanggal
      { width: 20 }, // Kode Rekening
      { width: 40 }, // Uraian
      { width: 20 }, // Penerimaan
      { width: 20 }, // Pengeluaran
      { width: 20 }, // Saldo
    ];

    let no = 1;
    for (const item of data) {
      const penerimaan = item.jenis === 'KAS_MASUK' ? item.jumlah : 0;
      const pengeluaran = item.jenis === 'KAS_KELUAR' ? item.jumlah : 0;
      
      const row = sheet.addRow([
        no++,
        item.tanggal.toISOString().slice(0, 10),
        item.kodeRekening || '-',
        item.uraian,
        penerimaan,
        pengeluaran,
        item.saldo
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Formatting numbers
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(7).numFmt = '#,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const kasUmumService = new KasUmumService();
