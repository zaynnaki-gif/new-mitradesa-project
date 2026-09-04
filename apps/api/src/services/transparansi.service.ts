import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { CreateApbdesInput, UpdateApbdesInput, QueryApbdesInput } from '../dto/transparansi.dto.js';
import { Prisma, Apbdes } from '@prisma/client';
import { getInstanceContext } from '../config/instance.js';

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

export class TransparansiService {
  async findAll(query: QueryApbdesInput): Promise<PaginatedResult<Omit<Apbdes, 'id' | 'desaId'> & { id: string, desaId: string }>> {
    const { page, limit, tahun, isAktif } = query;
    const { desaId } = getInstanceContext();
    const skip = (page - 1) * limit;

    const where: Prisma.ApbdesWhereInput = { desaId };

    if (tahun) {
      where.tahun = tahun;
    }

    if (isAktif !== undefined) {
      where.isAktif = isAktif === 'true';
    }

    const orderBy: Prisma.ApbdesOrderByWithRelationInput[] = [
      { tahun: 'desc' },
      { createdAt: 'desc' }
    ];

    const [apbdesList, total] = await Promise.all([
      prisma.apbdes.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.apbdes.count({ where }),
    ]);

    return {
      data: apbdesList.map(a => ({
        ...a,
        id: a.id.toString(),
        desaId: a.desaId.toString()
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.ApbdesWhereInput = { id, desaId };
    const apbdes = await prisma.apbdes.findFirst({ where, include: { items: true } });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    return { 
      ...apbdes, 
      id: apbdes.id.toString(), 
      desaId: apbdes.desaId.toString(),
      items: apbdes.items.map(i => ({ ...i, id: i.id.toString(), apbdesId: i.apbdesId.toString() }))
    };
  }

  async create(data: CreateApbdesInput) {
    const { desaId } = getInstanceContext();
    // Check if APBDes for this year already exists
    const existing = await prisma.apbdes.findFirst({
      where: { desaId, tahun: data.tahun }
    });
    
    if (existing) {
      throw ApiError.badRequest(`APBDes untuk tahun ${data.tahun} sudah ada`);
    }

    const newApbdes = await prisma.apbdes.create({
      data: {
        desaId,
        tahun: data.tahun,
        totalPendapatan: data.totalPendapatan,
        totalBelanja: data.totalBelanja,
        totalPembiayaan: data.totalPembiayaan,
        isAktif: data.isAktif,
        dokumenUrl: data.dokumenUrl,
      },
    });
    return { ...newApbdes, id: newApbdes.id.toString(), desaId: newApbdes.desaId.toString() };
  }

  async update(id: bigint, data: UpdateApbdesInput) {
    const { desaId } = getInstanceContext();
    const where: Prisma.ApbdesWhereInput = { id, desaId };
    const apbdes = await prisma.apbdes.findFirst({ where });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');

    if (data.tahun && data.tahun !== apbdes.tahun) {
      const existing = await prisma.apbdes.findFirst({
        where: { desaId: apbdes.desaId, tahun: data.tahun }
      });
      if (existing) {
        throw ApiError.badRequest(`APBDes untuk tahun ${data.tahun} sudah ada`);
      }
    }

    const updated = await prisma.apbdes.update({
      where: { id },
      data: {
        tahun: data.tahun,
        totalPendapatan: data.totalPendapatan,
        totalBelanja: data.totalBelanja,
        totalPembiayaan: data.totalPembiayaan,
        isAktif: data.isAktif,
        dokumenUrl: data.dokumenUrl,
      },
    });
    return { ...updated, id: updated.id.toString(), desaId: updated.desaId.toString() };
  }

  async delete(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.ApbdesWhereInput = { id, desaId };
    const apbdes = await prisma.apbdes.findFirst({ where });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    await prisma.apbdes.delete({ where: { id } });
  }
  async addItem(apbdesId: bigint, data: { kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN'; nama: string; anggaran: number; realization: number }) {
    const { desaId } = getInstanceContext();
    const apbdes = await prisma.apbdes.findFirst({ where: { id: apbdesId, desaId } });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    const item = await prisma.apbdesItem.create({
      data: {
        apbdesId,
        kategori: data.kategori,
        nama: data.nama,
        anggaran: data.anggaran,
        realization: data.realization
      }
    });
    return { ...item, id: item.id.toString(), apbdesId: item.apbdesId.toString() };
  }

  async updateItem(apbdesId: bigint, itemId: bigint, data: { nama?: string; anggaran?: number; realization?: number }) {
    const { desaId } = getInstanceContext();
    const apbdes = await prisma.apbdes.findFirst({ where: { id: apbdesId, desaId } });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    const existing = await prisma.apbdesItem.findFirst({ where: { id: itemId, apbdesId } });
    if (!existing) throw ApiError.notFound('Data Rincian APBDes tidak ditemukan');
    
    const updated = await prisma.apbdesItem.update({
      where: { id: itemId },
      data: {
        nama: data.nama,
        anggaran: data.anggaran,
        realization: data.realization
      }
    });
    return { ...updated, id: updated.id.toString(), apbdesId: updated.apbdesId.toString() };
  }

  async deleteItem(apbdesId: bigint, itemId: bigint) {
    const { desaId } = getInstanceContext();
    const apbdes = await prisma.apbdes.findFirst({ where: { id: apbdesId, desaId } });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    const existing = await prisma.apbdesItem.findFirst({ where: { id: itemId, apbdesId } });
    if (!existing) throw ApiError.notFound('Data Rincian APBDes tidak ditemukan');
    
    await prisma.apbdesItem.delete({ where: { id: itemId } });
  }
}

export const transparansiService = new TransparansiService();
