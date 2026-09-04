/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { CreatePotensiInput, UpdatePotensiInput, QueryPotensiInput } from '../dto/potensi.dto.js';
import { getInstanceContext } from '../config/instance.js';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export class PotensiService {
  async findAll(query: QueryPotensiInput) {
    const { page, limit, search, kategori, isAktif } = query;
    const { desaId } = getInstanceContext();
    const skip = (page - 1) * limit;

    const where: any = { desaId };

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (kategori) {
      where.kategori = kategori;
    }

    if (isAktif !== undefined) {
      where.isAktif = isAktif;
    }

    const [data, total] = await Promise.all([
      prisma.potensiDesa.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.potensiDesa.count({ where }),
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

  async findById(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: any = { id, desaId };
    const potensi = await prisma.potensiDesa.findFirst({ where });

    if (!potensi) {
      throw ApiError.notFound('Potensi Desa tidak ditemukan');
    }

    return potensi;
  }
  
  async findBySlug(slug: string) {
    const potensi = await prisma.potensiDesa.findUnique({
      where: { slug },
    });

    if (!potensi) {
      throw ApiError.notFound('Potensi Desa tidak ditemukan');
    }

    return potensi;
  }

  async create(data: CreatePotensiInput) {
    const { desaId } = getInstanceContext();
    let slug = slugify(data.nama);
    
    // Ensure slug is unique
    const existing = await prisma.potensiDesa.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return prisma.potensiDesa.create({
      data: {
        ...data,
        slug,
        desa: { connect: { id: desaId } }
      } as any,
    });
  }

  async update(id: bigint, data: UpdatePotensiInput) {
    await this.findById(id);

    let slug = undefined;
    if (data.nama) {
      slug = slugify(data.nama);
      const existing = await prisma.potensiDesa.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    return prisma.potensiDesa.update({
      where: { id },
      data: {
        ...data,
        ...(slug && { slug }),
      },
    });
  }

  async delete(id: bigint) {
    await this.findById(id);
    await prisma.potensiDesa.delete({
      where: { id },
    });
    return { success: true };
  }
}

export const potensiService = new PotensiService();

