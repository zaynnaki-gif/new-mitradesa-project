/**
 * Public Service Catalog Routes
 *
 * Public endpoints for citizen service catalog.
 * No authentication required.
 */

import { Router } from 'express';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../../services/prisma.js';

const router = Router();

/**
 * Query input for public service listing
 */
interface PublicServiceQuery {
  page?: number;
  limit?: number;
  kategori?: string;
  search?: string;
}

/**
 * Find all active services for public catalog
 */
async function findAllPublicServices(query: PublicServiceQuery) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.LayananWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (query.kategori) {
    where.kategori = query.kategori;
  }

  if (query.search) {
    where.OR = [
      { nama: { contains: query.search, mode: 'insensitive' } },
      { kode: { contains: query.search, mode: 'insensitive' } },
      { deskripsi: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.layanan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nama: 'asc' },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { permintaan: true },
        },
      },
    }),
    prisma.layanan.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Find service by slug for public view
 */
async function findServiceBySlugPublic(slug: string) {
  return prisma.layanan.findFirst({
    where: {
      slug,
      isActive: true,
      deletedAt: null,
    },
    include: {
      fields: { orderBy: { orderIndex: 'asc' } },
      dokumen: {
        include: {
          templates: {
            include: {
              versions: {
                where: { status: 'PUBLISHED' },
                orderBy: { version: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
}

/**
 * GET /api/public/layanan
 * List all active services for public catalog
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const kategori = req.query.kategori as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await findAllPublicServices({ page, limit, kategori, search });

    return response.success(res, result.data, 'Daftar Layanan', result.meta);
  })
);

/**
 * GET /api/public/layanan/:slug
 * Get service detail by slug for public view
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const layanan = await findServiceBySlugPublic(slug);

    if (!layanan) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }

    return response.success(res, layanan, 'Detail Layanan');
  })
);

export default router;
