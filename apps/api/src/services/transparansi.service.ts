import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { CreateApbdesInput, UpdateApbdesInput, QueryApbdesInput } from '../dto/transparansi.dto.js';
import { Prisma } from '@prisma/client';

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
  async findAll(query: QueryApbdesInput): Promise<PaginatedResult<any>> {
    const { page, limit, tahun, isAktif } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ApbdesWhereInput = { };

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
        id: a.id.toString()
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
    const where: Prisma.ApbdesWhereInput = { id };
    const apbdes = await prisma.apbdes.findFirst({ 
      where, 
      include: { 
        items: {
          include: { Rkpdes: true }
        } 
      } 
    });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    return { 
      ...apbdes, 
      id: apbdes.id.toString(),
      items: apbdes.items.map(i => ({ 
        ...i, 
        id: i.id.toString(), 
        apbdesId: i.apbdesId.toString(),
        Rkpdes: i.Rkpdes ? {
          ...i.Rkpdes,
          id: i.Rkpdes.id.toString(),
          rpjmdesBidangId: i.Rkpdes.rpjmdesBidangId.toString(),
          apbdesItemId: i.Rkpdes.apbdesItemId?.toString() || null
        } : undefined
      }))
    };
  }

  async create(data: CreateApbdesInput) {
    // Check if APBDes for this year already exists
    const existing = await prisma.apbdes.findFirst({
      where: { tahun: data.tahun }
    });
    
    if (existing) {
      throw ApiError.badRequest(`APBDes untuk tahun ${data.tahun} sudah ada`);
    }

    const newApbdes = await prisma.apbdes.create({
      data: {
        tahun: data.tahun,
        totalPendapatan: data.totalPendapatan,
        totalBelanja: data.totalBelanja,
        totalPembiayaan: data.totalPembiayaan,
        isAktif: data.isAktif,
        dokumenUrl: data.dokumenUrl,
      },
    });
    return { ...newApbdes, id: newApbdes.id.toString() };
  }

  async update(id: bigint, data: UpdateApbdesInput) {
    const where: Prisma.ApbdesWhereInput = { id };
    const apbdes = await prisma.apbdes.findFirst({ where });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');

    if (data.tahun && data.tahun !== apbdes.tahun) {
      const existing = await prisma.apbdes.findFirst({
        where: { tahun: data.tahun }
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
    return { ...updated, id: updated.id.toString() };
  }

  async delete(id: bigint) {
    const where: Prisma.ApbdesWhereInput = { id };
    const apbdes = await prisma.apbdes.findFirst({ where });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    await prisma.apbdes.delete({ where: { id } });
  }
  
  async addItem(apbdesId: bigint, data: { kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN'; nama: string; anggaran: number; realization: number; rkpdesId?: bigint }) {
    const apbdes = await prisma.apbdes.findFirst({ where: { id: apbdesId } });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    
    // Auto-fill nama if rkpdesId is provided but nama is empty
    let finalNama = data.nama;
    if (data.rkpdesId && (!finalNama || finalNama.trim() === '')) {
      const rkpdes = await prisma.rkpdes.findFirst({ where: { id: data.rkpdesId } });
      if (rkpdes) {
        finalNama = rkpdes.namaKegiatan;
      }
    }

    const item = await prisma.apbdesItem.create({
      data: {
        apbdesId,
        kategori: data.kategori,
        nama: finalNama,
        anggaran: data.anggaran,
        realization: data.realization
      }
    });

    // Link to RKPDes
    if (data.rkpdesId) {
      await prisma.rkpdes.update({
        where: { id: data.rkpdesId },
        data: { apbdesItemId: item.id }
      });
    }

    return { ...item, id: item.id.toString(), apbdesId: item.apbdesId.toString() };
  }

  async updateItem(apbdesId: bigint, itemId: bigint, data: { nama?: string; anggaran?: number; realization?: number; rkpdesId?: bigint | null }) {
    const apbdes = await prisma.apbdes.findFirst({ where: { id: apbdesId } });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    const existing = await prisma.apbdesItem.findFirst({ where: { id: itemId, apbdesId } });
    if (!existing) throw ApiError.notFound('Data Rincian APBDes tidak ditemukan');
    
    const updated = await prisma.apbdesItem.update({
      where: { id: itemId },
      data: {
        ...(data.nama !== undefined && { nama: data.nama }),
        ...(data.anggaran !== undefined && { anggaran: data.anggaran }),
        ...(data.realization !== undefined && { realization: data.realization })
      }
    });

    if (data.rkpdesId !== undefined) {
      // Unlink previous RKPDes that points to this APBDes item
      await prisma.rkpdes.updateMany({
        where: { apbdesItemId: itemId },
        data: { apbdesItemId: null }
      });
      
      // Link the new RKPDes
      if (data.rkpdesId !== null) {
        await prisma.rkpdes.update({
          where: { id: data.rkpdesId },
          data: { apbdesItemId: itemId }
        });
      }
    }

    return { ...updated, id: updated.id.toString(), apbdesId: updated.apbdesId.toString() };
  }

  async deleteItem(apbdesId: bigint, itemId: bigint) {
    const apbdes = await prisma.apbdes.findFirst({ where: { id: apbdesId } });
    if (!apbdes) throw ApiError.notFound('Data APBDes tidak ditemukan');
    const existing = await prisma.apbdesItem.findFirst({ where: { id: itemId, apbdesId } });
    if (!existing) throw ApiError.notFound('Data Rincian APBDes tidak ditemukan');
    
    await prisma.apbdesItem.delete({ where: { id: itemId } });
  }
}

export const transparansiService = new TransparansiService();
