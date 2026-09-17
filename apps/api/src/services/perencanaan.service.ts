import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { 
  CreateRpjmdesInput, 
  UpdateRpjmdesInput, 
  QueryRpjmdesInput,
  CreateRpjmdesBidangInput,
  UpdateRpjmdesBidangInput,
  CreateRkpdesInput,
  UpdateRkpdesInput
} from '../dto/perencanaan.dto.js';
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

export class PerencanaanService {
  
  // ==========================================
  // RPJMDES
  // ==========================================
  
  async findAllRpjmdes(query: QueryRpjmdesInput): Promise<PaginatedResult<any>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RpjmdesWhereInput = { };

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.RpjmdesOrderByWithRelationInput[] = [
      { createdAt: 'desc' }
    ];

    const [rpjmdesList, total] = await Promise.all([
      prisma.rpjmdes.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.rpjmdes.count({ where }),
    ]);

    return {
      data: rpjmdesList.map(r => ({
        ...r,
        id: r.id.toString()
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findRpjmdesById(id: bigint) {
    const where: Prisma.RpjmdesWhereInput = { id };
    const rpjmdes = await prisma.rpjmdes.findFirst({ 
      where, 
      include: { 
        bidangs: {
          include: {
            rkpdes: true
          }
        } 
      } 
    });
    
    if (!rpjmdes) throw ApiError.notFound('Data RPJMDes tidak ditemukan');
    
    return { 
      ...rpjmdes, 
      id: rpjmdes.id.toString(),
      bidangs: rpjmdes.bidangs.map(b => ({
        ...b,
        id: b.id.toString(),
        rpjmdesId: b.rpjmdesId.toString(),
        rkpdes: b.rkpdes.map(k => ({
          ...k,
          id: k.id.toString(),
          rpjmdesBidangId: k.rpjmdesBidangId.toString(),
          apbdesItemId: k.apbdesItemId?.toString() || null
        }))
      }))
    };
  }

  async createRpjmdes(data: CreateRpjmdesInput) {
    if (data.status === 'AKTIF') {
      await prisma.rpjmdes.updateMany({
        where: { status: 'AKTIF' },
        data: { status: 'NON_AKTIF' }
      });
    }

    const newRpjmdes = await prisma.rpjmdes.create({
      data: {
        periode: data.periode,
        visi: data.visi,
        misi: data.misi,
        status: data.status,
      },
    });
    return { ...newRpjmdes, id: newRpjmdes.id.toString() };
  }

  async updateRpjmdes(id: bigint, data: UpdateRpjmdesInput) {
    const rpjmdes = await prisma.rpjmdes.findFirst({ where: { id } });
    if (!rpjmdes) throw ApiError.notFound('Data RPJMDes tidak ditemukan');

    if (data.status === 'AKTIF' && rpjmdes.status !== 'AKTIF') {
      await prisma.rpjmdes.updateMany({
        where: { status: 'AKTIF', id: { not: id } },
        data: { status: 'NON_AKTIF' }
      });
    }

    const updated = await prisma.rpjmdes.update({
      where: { id },
      data: {
        periode: data.periode,
        visi: data.visi,
        misi: data.misi,
        status: data.status,
      },
    });
    return { ...updated, id: updated.id.toString() };
  }

  async deleteRpjmdes(id: bigint) {
    const rpjmdes = await prisma.rpjmdes.findFirst({ where: { id } });
    if (!rpjmdes) throw ApiError.notFound('Data RPJMDes tidak ditemukan');
    await prisma.rpjmdes.delete({ where: { id } });
  }

  // ==========================================
  // RPJMDES BIDANG
  // ==========================================

  async createBidang(rpjmdesId: bigint, data: CreateRpjmdesBidangInput) {
    const rpjmdes = await prisma.rpjmdes.findFirst({ where: { id: rpjmdesId } });
    if (!rpjmdes) throw ApiError.notFound('Data RPJMDes tidak ditemukan');

    const bidang = await prisma.rpjmdesBidang.create({
      data: {
        rpjmdesId,
        namaBidang: data.namaBidang
      }
    });
    return { ...bidang, id: bidang.id.toString(), rpjmdesId: bidang.rpjmdesId.toString() };
  }

  async updateBidang(rpjmdesId: bigint, bidangId: bigint, data: UpdateRpjmdesBidangInput) {
    const existing = await prisma.rpjmdesBidang.findFirst({ where: { id: bidangId, rpjmdesId } });
    if (!existing) throw ApiError.notFound('Data Bidang RPJMDes tidak ditemukan');
    
    const updated = await prisma.rpjmdesBidang.update({
      where: { id: bidangId },
      data: {
        namaBidang: data.namaBidang
      }
    });
    return { ...updated, id: updated.id.toString(), rpjmdesId: updated.rpjmdesId.toString() };
  }

  async deleteBidang(rpjmdesId: bigint, bidangId: bigint) {
    const existing = await prisma.rpjmdesBidang.findFirst({ where: { id: bidangId, rpjmdesId } });
    if (!existing) throw ApiError.notFound('Data Bidang RPJMDes tidak ditemukan');
    
    await prisma.rpjmdesBidang.delete({ where: { id: bidangId } });
  }

  // ==========================================
  // RKPDES
  // ==========================================

  async getAllRkpdes(tahun: number) {
    const rkpdesList = await prisma.rkpdes.findMany({
      where: { tahun },
      include: {
        bidang: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return rkpdesList.map(r => ({
      ...r,
      id: r.id.toString(),
      rpjmdesBidangId: r.rpjmdesBidangId.toString(),
      apbdesItemId: r.apbdesItemId?.toString() || null,
      bidang: r.bidang ? {
        ...r.bidang,
        id: r.bidang.id.toString(),
        rpjmdesId: r.bidang.rpjmdesId.toString()
      } : undefined
    }));
  }

  async createRkpdes(bidangId: bigint, data: CreateRkpdesInput) {
    const bidang = await prisma.rpjmdesBidang.findFirst({ where: { id: bidangId } });
    if (!bidang) throw ApiError.notFound('Data Bidang RPJMDes tidak ditemukan');

    const rkpdes = await prisma.rkpdes.create({
      data: {
        rpjmdesBidangId: bidangId,
        tahun: data.tahun,
        namaKegiatan: data.namaKegiatan,
        lokasi: data.lokasi,
        perkiraanBiaya: data.perkiraanBiaya,
        apbdesItemId: data.apbdesItemId
      }
    });
    return { 
      ...rkpdes, 
      id: rkpdes.id.toString(), 
      rpjmdesBidangId: rkpdes.rpjmdesBidangId.toString(),
      apbdesItemId: rkpdes.apbdesItemId?.toString() || null 
    };
  }

  async updateRkpdes(bidangId: bigint, rkpdesId: bigint, data: UpdateRkpdesInput) {
    const existing = await prisma.rkpdes.findFirst({ where: { id: rkpdesId, rpjmdesBidangId: bidangId } });
    if (!existing) throw ApiError.notFound('Data RKPDes tidak ditemukan');
    
    const updated = await prisma.rkpdes.update({
      where: { id: rkpdesId },
      data: {
        tahun: data.tahun,
        namaKegiatan: data.namaKegiatan,
        lokasi: data.lokasi,
        perkiraanBiaya: data.perkiraanBiaya,
        apbdesItemId: data.apbdesItemId
      }
    });
    return { 
      ...updated, 
      id: updated.id.toString(), 
      rpjmdesBidangId: updated.rpjmdesBidangId.toString(),
      apbdesItemId: updated.apbdesItemId?.toString() || null
    };
  }

  async deleteRkpdes(bidangId: bigint, rkpdesId: bigint) {
    const existing = await prisma.rkpdes.findFirst({ where: { id: rkpdesId, rpjmdesBidangId: bidangId } });
    if (!existing) throw ApiError.notFound('Data RKPDes tidak ditemukan');
    
    await prisma.rkpdes.delete({ where: { id: rkpdesId } });
  }
}

export const perencanaanService = new PerencanaanService();
