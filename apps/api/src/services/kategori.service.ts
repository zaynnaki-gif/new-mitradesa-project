/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { CreateKategoriInput, UpdateKategoriInput, QueryKategoriInput } from '../dto/cms.dto.js';
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

export class KategoriService {
  /**
   * Get all kategoris with pagination
   */
  async findAll(query: QueryKategoriInput): Promise<PaginatedResult<any>> {
    const { page, limit, search, isAktif, urutan } = query;
    const skip = (page - 1) * limit;

    const { desaId } = getInstanceContext();
    const where: any = { desaId };

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isAktif !== undefined) {
      where.isAktif = isAktif === 'true';
    }

    const orderBy: any = [
      { urutan: urutan === 'desc' ? 'desc' : 'asc' },
      { createdAt: 'desc' }
    ];

    const [kategoris, total] = await Promise.all([
      prisma.kategori.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { berita: true },
          },
        },
      }),
      prisma.kategori.count({ where }),
    ]);

    return {
      data: kategoris.map((k) => ({
        ...k,
        jumlahBerita: k._count.berita,
        _count: undefined,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get kategori by ID
   */
  async findById(id: bigint) {
    const { desaId } = getInstanceContext();
    const kategori = await prisma.kategori.findFirst({
      where: { id, desaId },
      include: {
        _count: {
          select: { berita: true },
        },
      },
    });

    if (!kategori) {
      throw ApiError.notFound('Kategori tidak ditemukan');
    }

    return {
      ...kategori,
      jumlahBerita: kategori._count.berita,
      _count: undefined,
    };
  }

  /**
   * Get kategori by slug
   */
  async findBySlug(slug: string) {
    const { desaId } = getInstanceContext();
    const kategori = await prisma.kategori.findFirst({
      where: { slug, desaId },
      include: {
        _count: {
          select: { berita: true },
        },
      },
    });

    if (!kategori) {
      throw ApiError.notFound('Kategori tidak ditemukan');
    }

    return {
      ...kategori,
      jumlahBerita: kategori._count.berita,
      _count: undefined,
    };
  }

  /**
   * Create new kategori
   */
  async create(data: CreateKategoriInput) {
    const { desaId } = getInstanceContext();
    // Check for duplicate slug
    const existing = await prisma.kategori.findFirst({
      where: { slug: data.slug },
    });

    if (existing) {
      throw ApiError.conflict('Slug sudah digunakan');
    }

    const kategori = await prisma.kategori.create({
      data: {
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        ikon: data.ikon,
        warna: data.warna,
        urutan: data.urutan ?? 0,
        isAktif: data.isAktif ?? true,
        desaId: desaId ?? null,
      },
    });

    return kategori;
  }

  /**
   * Update kategori
   */
  async update(id: bigint, data: UpdateKategoriInput) {
    const { desaId } = getInstanceContext();
    const existing = await prisma.kategori.findFirst({
      where: { id, desaId },
    });

    if (!existing) {
      throw ApiError.notFound('Kategori tidak ditemukan');
    }

    // Check for duplicate slug if being changed
    if (data.slug && data.slug !== existing.slug) {
      const duplicate = await prisma.kategori.findFirst({
        where: { slug: data.slug },
      });

      if (duplicate) {
        throw ApiError.conflict('Slug sudah digunakan');
      }
    }

    const updateData: any = {};
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi;
    if (data.ikon !== undefined) updateData.ikon = data.ikon;
    if (data.warna !== undefined) updateData.warna = data.warna;
    if (data.urutan !== undefined) updateData.urutan = data.urutan;
    if (data.isAktif !== undefined) updateData.isAktif = data.isAktif;

    const kategori = await prisma.kategori.update({
      where: { id },
      data: updateData,
    });

    return kategori;
  }

  /**
   * Delete kategori
   */
  async delete(id: bigint) {
    const { desaId } = getInstanceContext();
    const existing = await prisma.kategori.findFirst({
      where: { id, desaId },
      include: {
        _count: {
          select: { berita: true },
        },
      },
    });

    if (!existing) {
      throw ApiError.notFound('Kategori tidak ditemukan');
    }

    if (existing._count.berita > 0) {
      throw ApiError.badRequest('Tidak dapat menghapus kategori yang memiliki berita');
    }

    await prisma.kategori.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get all active kategoris (for dropdown/selection)
   */
  async findActive() {
    const { desaId } = getInstanceContext();
    return prisma.kategori.findMany({
      where: { isAktif: true, desaId },
      orderBy: { urutan: 'asc' },
      select: {
        id: true,
        nama: true,
        slug: true,
        warna: true,
        ikon: true,
      },
    });
  }

  /**
   * Get statistics
   */
  async getStats() {
    const { desaId } = getInstanceContext();
    const where = { desaId };
    const total = await prisma.kategori.count({ where });
    const aktif = await prisma.kategori.count({ where: { ...where, isAktif: true } });
    return { total, aktif };
  }
}

export const kategoriService = new KategoriService();


