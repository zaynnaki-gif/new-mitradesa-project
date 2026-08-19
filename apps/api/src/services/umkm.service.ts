import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { CreateUmkmInput, UpdateUmkmInput, QueryUmkmInput } from '../dto/umkm.dto.js';
import { Prisma, Umkm } from '@prisma/client';
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

export class UmkmService {
  async findAll(query: QueryUmkmInput): Promise<PaginatedResult<Omit<Umkm, 'id' | 'desaId'> & { id: string, desaId: string }>> {
    const { page, limit, search, isAktif, kategori } = query;
    const { desaId } = getInstanceContext();
    const skip = (page - 1) * limit;

    const where: Prisma.UmkmWhereInput = { desaId };


    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
        { pemilik: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (kategori) {
      where.kategori = kategori;
    }

    if (isAktif !== undefined) {
      where.isAktif = isAktif === 'true';
    }

    const orderBy: Prisma.UmkmOrderByWithRelationInput[] = [
      { createdAt: 'desc' }
    ];

    const [umkmList, total] = await Promise.all([
      prisma.umkm.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.umkm.count({ where }),
    ]);

    return {
      data: umkmList.map(u => ({
        ...u,
        id: u.id.toString(),
        desaId: u.desaId.toString()
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
    const where: Prisma.UmkmWhereInput = { id, desaId };
    const umkm = await prisma.umkm.findFirst({ where });
    if (!umkm) throw ApiError.notFound('UMKM tidak ditemukan');
    return { ...umkm, id: umkm.id.toString(), desaId: umkm.desaId.toString() };
  }

  async create(data: CreateUmkmInput) {
    const { desaId } = getInstanceContext();
    const newUmkm = await prisma.umkm.create({
      data: {
        desaId,
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        kategori: data.kategori,
        gambarUrl: data.gambarUrl,
        harga: data.harga,
        kontak: data.kontak,
        pemilik: data.pemilik,
        isAktif: data.isAktif,
      },
    });
    return { ...newUmkm, id: newUmkm.id.toString(), desaId: newUmkm.desaId.toString() };
  }

  async update(id: bigint, data: UpdateUmkmInput) {
    const { desaId } = getInstanceContext();
    const where: Prisma.UmkmWhereInput = { id, desaId };
    
    const umkm = await prisma.umkm.findFirst({ where });
    if (!umkm) throw ApiError.notFound('UMKM tidak ditemukan');

    const updated = await prisma.umkm.update({
      where: { id },
      data: {
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        kategori: data.kategori,
        gambarUrl: data.gambarUrl,
        harga: data.harga,
        kontak: data.kontak,
        pemilik: data.pemilik,
        isAktif: data.isAktif,
      },
    });
    return { ...updated, id: updated.id.toString(), desaId: updated.desaId.toString() };
  }

  async delete(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.UmkmWhereInput = { id, desaId };
    
    const umkm = await prisma.umkm.findFirst({ where });
    if (!umkm) throw ApiError.notFound('UMKM tidak ditemukan');
    await prisma.umkm.delete({ where: { id } });
  }
}

export const umkmService = new UmkmService();
