import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { CreateHalamanInput, UpdateHalamanInput, QueryHalamanInput } from '../dto/cms.dto.js';
import { getInstanceContext } from '../config/instance.js';

import sanitizeHtml from 'sanitize-html';

export class HalamanService {
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
   * Get all halaman with pagination
   */
  async findAll(query: QueryHalamanInput) {
    const { page, limit, search, status, isMenu, urutan } = query;
    const skip = (page - 1) * limit;
    const { desaId } = getInstanceContext();

    const where: any = {};
    if (desaId) {
      where.desaId = desaId;
    }

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (isMenu !== undefined) {
      where.isMenu = isMenu === 'true';
    }

    const orderBy: any = [
      { urutan: urutan === 'desc' ? 'desc' : 'asc' },
      { createdAt: 'desc' }
    ];

    const [halamans, total] = await Promise.all([
      prisma.halaman.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.halaman.count({ where }),
    ]);

    return {
      data: halamans,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get published halaman (for public access)
   */
  async findPublished() {
    const { desaId } = getInstanceContext();
    const where: any = { status: 'PUBLISHED' };
    if (desaId) {
      where.desaId = desaId;
    }
    const halamans = await prisma.halaman.findMany({
      where,
      orderBy: {
        urutan: 'asc',
      },
      select: {
        id: true,
        judul: true,
        slug: true,
        excerpt: true,
        urutan: true,
      },
    });

    return halamans;
  }

  /**
   * Get menu items
   */
  async findMenuItems() {
    const { desaId } = getInstanceContext();
    const where: any = { status: 'PUBLISHED', isMenu: true };
    if (desaId) {
      where.desaId = desaId;
    }
    return prisma.halaman.findMany({
      where,
      orderBy: {
        urutan: 'asc',
      },
      select: {
        id: true,
        judul: true,
        slug: true,
        urutan: true,
      },
    });
  }

  /**
   * Get halaman by ID
   */
  async findById(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: any = { id };
    if (desaId) where.desaId = desaId;
    const halaman = await prisma.halaman.findFirst({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!halaman) {
      throw ApiError.notFound('Halaman tidak ditemukan');
    }

    return halaman;
  }

  /**
   * Get halaman by slug
   */
  async findBySlug(slug: string) {
    const { desaId } = getInstanceContext();
    const where: any = { slug };
    if (desaId) where.desaId = desaId;
    const halaman = await prisma.halaman.findFirst({
      where,
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!halaman) {
      throw ApiError.notFound('Halaman tidak ditemukan');
    }

    return halaman;
  }

  /**
   * Get published halaman by slug
   */
  async findPublishedBySlug(slug: string) {
    const { desaId } = getInstanceContext();
    const where: any = { slug, status: 'PUBLISHED' };
    if (desaId) where.desaId = desaId;
    const halaman = await prisma.halaman.findFirst({
      where,
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!halaman) {
      throw ApiError.notFound('Halaman tidak ditemukan');
    }

    return halaman;
  }

  /**
   * Create new halaman
   */
  async create(data: CreateHalamanInput, createdById?: bigint) {
    const { desaId } = getInstanceContext();
    // Check for duplicate slug
    const existing = await prisma.halaman.findFirst({
      where: { slug: data.slug },
    });

    if (existing) {
      throw ApiError.conflict('Slug sudah digunakan');
    }

    const sanitizedKonten = this.sanitizeContent(data.konten);

    const halaman = await prisma.halaman.create({
      data: {
        judul: data.judul,
        slug: data.slug,
        konten: sanitizedKonten,
        excerpt: data.excerpt,
        gambarUrl: data.gambarUrl,
        status: data.status ?? 'DRAFT',
        createdById: createdById ? BigInt(createdById) : null,
        desaId: desaId ?? null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        metaTitle: data.metaTitle,
        metaDeskripsi: data.metaDeskripsi,
        metaKeywords: data.metaKeywords,
        urutan: data.urutan ?? 0,
        isMenu: data.isMenu ?? false,
      },
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });

    return halaman;
  }

  /**
   * Update halaman
   */
  async update(id: bigint, data: UpdateHalamanInput) {
    const { desaId } = getInstanceContext();
    const where: any = { id };
    if (desaId) where.desaId = desaId;
    const existing = await prisma.halaman.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Halaman tidak ditemukan');
    }

    // Check for duplicate slug if being changed
    if (data.slug && data.slug !== existing.slug) {
      const duplicate = await prisma.halaman.findFirst({
        where: { slug: data.slug },
      });

      if (duplicate) {
        throw ApiError.conflict('Slug sudah digunakan');
      }
    }

    const updateData: any = {};
    if (data.judul !== undefined) updateData.judul = data.judul;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.konten !== undefined) updateData.konten = this.sanitizeContent(data.konten);
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.gambarUrl !== undefined) updateData.gambarUrl = data.gambarUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDeskripsi !== undefined) updateData.metaDeskripsi = data.metaDeskripsi;
    if (data.metaKeywords !== undefined) updateData.metaKeywords = data.metaKeywords;
    if (data.urutan !== undefined) updateData.urutan = data.urutan;
    if (data.isMenu !== undefined) updateData.isMenu = data.isMenu;

    const halaman = await prisma.halaman.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });

    return halaman;
  }

  /**
   * Publish halaman
   */
  async publish(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: any = { id };
    if (desaId) where.desaId = desaId;
    const existing = await prisma.halaman.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Halaman tidak ditemukan');
    }

    return prisma.halaman.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: existing.publishedAt || new Date(),
      },
    });
  }

  /**
   * Archive halaman
   */
  async archive(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: any = { id };
    if (desaId) where.desaId = desaId;
    const existing = await prisma.halaman.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Halaman tidak ditemukan');
    }

    return prisma.halaman.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  /**
   * Soft delete halaman
   */
  async softDelete(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: any = { id };
    if (desaId) where.desaId = desaId;
    const existing = await prisma.halaman.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Halaman tidak ditemukan');
    }

    await prisma.halaman.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Get halaman statistics
   */
  async getStats() {
    const { desaId } = getInstanceContext();
    const where: any = {};
    if (desaId) {
      where.desaId = desaId;
    }
    const [total, published, draft, archived] = await Promise.all([
      prisma.halaman.count({ where }),
      prisma.halaman.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.halaman.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.halaman.count({ where: { ...where, status: 'ARCHIVED' } }),
    ]);

    return {
      total,
      published,
      draft,
      archived,
    };
  }
}

export const halamanService = new HalamanService();
