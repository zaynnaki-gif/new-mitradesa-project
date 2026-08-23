import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { CreateKasUmumInput, UpdateKasUmumInput, QueryKasUmumInput } from '../dto/kas-umum.dto.js';

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
      const startDate = new Date(tahun || new Date().getFullYear(), bulan - 1, 1);
      const endDate = new Date(tahun || new Date().getFullYear(), bulan, 0);
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
        orderBy: { tanggal: 'desc' },
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
    const item = await prisma.kasUmum.findUnique({ where: { id } });
    if (!item) throw new Error('Data tidak ditemukan');
    return item;
  }

  async create(data: CreateKasUmumInput) {
    // Calculate running saldo
    const lastEntry = await prisma.kasUmum.findFirst({
      orderBy: { tanggal: 'desc' },
    });

    const saldoMasuk = data.jenis === 'KAS_MASUK' ? data.jumlah : 0;
    const saldoKeluar = data.jenis === 'KAS_KELUAR' ? data.jumlah : 0;
    const saldo = (lastEntry?.saldo || 0) + saldoMasuk - saldoKeluar;

    return prisma.kasUmum.create({
      data: {
        tanggal: new Date(data.tanggal),
        jenis: data.jenis,
        uraian: data.uraian,
        jumlah: data.jumlah,
        saldo,
      },
    });
  }

  async update(id: string, data: UpdateKasUmumInput) {
    // Recalculate all subsequent entries
    const entry = await prisma.kasUmum.findUnique({ where: { id } });
    if (!entry) throw new Error('Data tidak ditemukan');

    const updatedEntry = {
      ...(data.tanggal && { tanggal: new Date(data.tanggal) }),
      ...(data.jenis && { jenis: data.jenis }),
      ...(data.uraian !== undefined && { uraian: data.uraian }),
      ...(data.jumlah !== undefined && { jumlah: data.jumlah }),
    };

    return prisma.kasUmum.update({
      where: { id },
      data: updatedEntry,
    });
  }

  async delete(id: string) {
    return prisma.kasUmum.delete({ where: { id } });
  }

  async getSaldoAkhir(): Promise<number> {
    const last = await prisma.kasUmum.findFirst({ orderBy: { tanggal: 'desc' } });
    return last?.saldo || 0;
  }
}

export const kasUmumService = new KasUmumService();
