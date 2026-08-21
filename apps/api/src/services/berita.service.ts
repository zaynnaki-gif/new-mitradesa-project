import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { Prisma } from '@prisma/client';
import { CreateBeritaInput, UpdateBeritaInput, QueryBeritaInput } from '../dto/cms.dto.js';
import { getInstanceContext } from '../config/instance.js';
import sanitizeHtml from 'sanitize-html';

export class BeritaService {
  /**
   * Helper to sanitize rich text
   */
  private sanitizeContent(content?: string): string | undefined {
    if (!content) return content;
    return sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['style', 'class'],
      }
    });
  }
  /**
   * Get all berita with pagination
   */
  async findAll(query: QueryBeritaInput) {
    const { page, limit, search, status, kategoriId, penulisId, urutan } = query;
    const { desaId } = getInstanceContext();
    const skip = (page - 1) * limit;

    const where: Prisma.BeritaWhereInput = {
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { konten: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (kategoriId) {
      where.kategoriId = BigInt(kategoriId);
    }

    if (penulisId) {
      where.penulisId = BigInt(penulisId);
    }


    const orderBy: Prisma.BeritaOrderByWithRelationInput[] = [
      { publishedAt: urutan === 'asc' ? 'asc' : 'desc' },
      { createdAt: 'desc' }
    ];

    const [beritas, total] = await Promise.all([
      prisma.berita.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          kategori: {
            select: {
              id: true,
              nama: true,
              slug: true,
              warna: true,
            },
          },
          penulis: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.berita.count({ where }),
    ]);

    return {
      data: beritas,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get published berita (for public access)
   */
  async findPublished(query: QueryBeritaInput) {
    const { page, limit, search, kategoriId, urutan } = query;
    const { desaId } = getInstanceContext();
    const skip = (page - 1) * limit;

    const where: Prisma.BeritaWhereInput = {
      status: 'PUBLISHED',
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (kategoriId) {
      where.kategoriId = BigInt(kategoriId);
    }


    const orderBy: Prisma.BeritaOrderByWithRelationInput[] = [
      { publishedAt: urutan === 'asc' ? 'asc' : 'desc' },
      { createdAt: 'desc' }
    ];

    const [beritas, total] = await Promise.all([
      prisma.berita.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          kategori: {
            select: {
              id: true,
              nama: true,
              slug: true,
              warna: true,
            },
          },
          penulis: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.berita.count({ where }),
    ]);

    return {
      data: beritas.map((b) => ({
        ...b,
        konten: undefined, // Hide full content in list
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
   * Get berita by ID
   */
  async findById(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };
    const berita = await prisma.berita.findFirst({
      where,
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            slug: true,
            warna: true,
          },
        },
        penulis: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!berita) {
      throw ApiError.notFound('Berita tidak ditemukan');
    }

    return berita;
  }

  /**
   * Get berita by slug
   */
  async findBySlug(slug: string) {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      slug,
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };
    const berita = await prisma.berita.findFirst({
      where,
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            slug: true,
            warna: true,
          },
        },
        penulis: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!berita) {
      throw ApiError.notFound('Berita tidak ditemukan');
    }

    return berita;
  }

  /**
   * Get published berita by slug
   */
  async findPublishedBySlug(slug: string) {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      slug,
      status: 'PUBLISHED',
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };
    const berita = await prisma.berita.findFirst({
      where,
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            slug: true,
            warna: true,
          },
        },
        penulis: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!berita) {
      throw ApiError.notFound('Berita tidak ditemukan');
    }

    return berita;
  }

  /**
   * Create new berita
   */
  async create(data: CreateBeritaInput, penulisId?: bigint) {
    // Check for duplicate slug
    const existing = await prisma.berita.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw ApiError.conflict('Slug sudah digunakan');
    }

    // Validate kategori exists if provided
    if (data.kategoriId) {
      const kategori = await prisma.kategori.findUnique({
        where: { id: BigInt(data.kategoriId) },
      });

      if (!kategori) {
        throw ApiError.badRequest('Kategori tidak ditemukan');
      }
    }

    const sanitizedKonten = this.sanitizeContent(data.konten);

    const berita = await prisma.berita.create({
      data: {
        judul: data.judul,
        slug: data.slug,
        excerpt: data.excerpt,
        konten: sanitizedKonten,
        gambarUrl: data.gambarUrl,
        status: data.status ?? 'DRAFT',
        kategoriId: data.kategoriId ? BigInt(data.kategoriId) : null,
        penulisId: penulisId ? BigInt(penulisId) : null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        metaTitle: data.metaTitle,
        metaDeskripsi: data.metaDeskripsi,
        metaKeywords: data.metaKeywords,
        ogImageUrl: data.ogImageUrl,
      },
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            slug: true,
          },
        },
      },
    });

    return berita;
  }

  /**
   * Update berita
   */
  async update(id: bigint, data: UpdateBeritaInput) {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };
    const existing = await prisma.berita.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Berita tidak ditemukan');
    }

    // Check for duplicate slug if being changed
    if (data.slug && data.slug !== existing.slug) {
      const duplicate = await prisma.berita.findUnique({
        where: { slug: data.slug },
      });

      if (duplicate) {
        throw ApiError.conflict('Slug sudah digunakan');
      }
    }

    // Validate kategori if being changed
    if (data.kategoriId !== undefined) {
      if (data.kategoriId) {
        const kategori = await prisma.kategori.findUnique({
          where: { id: BigInt(data.kategoriId) },
        });

        if (!kategori) {
          throw ApiError.badRequest('Kategori tidak ditemukan');
        }
      }
    }

    const updateData: Prisma.BeritaUncheckedUpdateInput = {};
    if (data.judul !== undefined) updateData.judul = data.judul;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.konten !== undefined) updateData.konten = this.sanitizeContent(data.konten);
    if (data.gambarUrl !== undefined) updateData.gambarUrl = data.gambarUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.kategoriId !== undefined) {
      updateData.kategoriId = data.kategoriId ? BigInt(data.kategoriId) : null;
    }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDeskripsi !== undefined) updateData.metaDeskripsi = data.metaDeskripsi;
    if (data.metaKeywords !== undefined) updateData.metaKeywords = data.metaKeywords;
    if (data.ogImageUrl !== undefined) updateData.ogImageUrl = data.ogImageUrl;

    const berita = await prisma.berita.update({
      where: { id },
      data: updateData,
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            slug: true,
          },
        },
      },
    });

    return berita;
  }

  /**
   * Publish berita
   */
  async publish(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };
    const existing = await prisma.berita.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Berita tidak ditemukan');
    }

    return prisma.berita.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: existing.publishedAt || new Date(),
      },
    });
  }

  /**
   * Archive berita
   */
  async archive(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };
    const existing = await prisma.berita.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Berita tidak ditemukan');
    }

    return prisma.berita.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  /**
   * Soft delete berita
   */
  async softDelete(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };
    const existing = await prisma.berita.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Berita tidak ditemukan');
    }

    await prisma.berita.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Get berita statistics
   */
  async getStats() {
    const { desaId } = getInstanceContext();
    const where: Prisma.BeritaWhereInput = {
      AND: [
        {
          OR: [
            { kategori: { desaId } },
            { penulis: { perangkatDesa: { desaId } } },
            { AND: [{ kategoriId: null }, { penulisId: null }] },
          ],
        },
      ],
    };

    const [total, published, draft, archived] = await Promise.all([
      prisma.berita.count({ where }),
      prisma.berita.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.berita.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.berita.count({ where: { ...where, status: 'ARCHIVED' } }),
    ]);

    return {
      total,
      published,
      draft,
      archived,
    };
  }
}

export const beritaService = new BeritaService();
