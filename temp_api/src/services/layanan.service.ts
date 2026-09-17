import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import {
  CreateLayananInput,
  UpdateLayananInput,
  QueryLayananInput,
  CreateFieldDefinitionInput,
  UpdateFieldDefinitionInput,
  QueryFieldDefinitionInput,
} from '../dto/service-document.dto.js';
import { ApiError } from '../utils/response.js';
import { getInstanceContext } from '../config/instance.js';

export class LayananService {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Create a new layanan (service)
   */
  async create(
    data: CreateLayananInput,
    _createdBy?: bigint
  ): Promise<Prisma.LayananGetPayload<object>> {
    const { desaId } = getInstanceContext();

    // Check if kode already exists for this desa
    const existing = await this.db.layanan.findFirst({
      where: {
        desaId,
        kode: data.kode,
      },
    });

    if (existing) {
      throw ApiError.conflict('Kode layanan sudah ada untuk desa ini');
    }

    // Check if slug already exists
    const existingSlug = await this.db.layanan.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw ApiError.conflict('Slug sudah digunakan');
    }

    const layanan = await this.db.layanan.create({
      data: {
        desaId,
        kode: data.kode,
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        kategori: data.kategori,
        requiresDocument: data.requiresDocument,
        requiresApproval: data.requiresApproval,
        isActive: data.isActive,
      },
    });

    return layanan;
  }

  /**
   * Find all layanan with pagination
   */
  async findAll(
    query: QueryLayananInput
  ): Promise<{
    data: Prisma.LayananGetPayload<object>[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const { desaId } = getInstanceContext();

    const where: Prisma.LayananWhereInput = {
      desaId,
      deletedAt: null,
    };

    if (query.kategori) {
      where.kategori = query.kategori;
    }

    if (query.isActive === 'true') {
      where.isActive = true;
    } else if (query.isActive === 'false') {
      where.isActive = false;
    }

    if (query.search) {
      where.OR = [
        { nama: { contains: query.search, mode: 'insensitive' } },
        { kode: { contains: query.search, mode: 'insensitive' } },
        { deskripsi: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.layanan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sort === 'asc' ? 'asc' : 'desc' },
        include: {
          _count: {
            select: {
              fields: true,
              dokumen: true,
              permintaan: true,
            },
          },
        },
      }),
      this.db.layanan.count({ where }),
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

  /**
   * Find layanan by ID
   */
  async findById(id: bigint): Promise<Prisma.LayananGetPayload<object> | null> {
    const { desaId } = getInstanceContext();
    return this.db.layanan.findFirst({
      where: { id, desaId },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
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
        _count: {
          select: {
            fields: true,
            dokumen: true,
            permintaan: true,
          },
        },
      },
    });
  }

  /**
   * Find layanan by slug
   */
  async findBySlug(slug: string): Promise<Prisma.LayananGetPayload<object> | null> {
    const { desaId } = getInstanceContext();
    return this.db.layanan.findFirst({
      where: { slug, desaId },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
        dokumen: true,
      },
    });
  }

  /**
   * Update layanan
   */
  async update(
    id: bigint,
    data: UpdateLayananInput
  ): Promise<Prisma.LayananGetPayload<object>> {
    const { desaId } = getInstanceContext();
    // Verify ownership
    const existing = await this.db.layanan.findFirst({
      where: { id, desaId },
    });

    if (!existing) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }

    // Check if new kode conflicts with another layanan
    if (data.kode && data.kode !== existing.kode) {
      const kodeConflict = await this.db.layanan.findFirst({
        where: {
          desaId,
          kode: data.kode,
          id: { not: id },
        },
      });

      if (kodeConflict) {
        throw ApiError.conflict('Kode layanan sudah digunakan');
      }
    }

    // Check if new slug conflicts
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await this.db.layanan.findFirst({
        where: { slug: data.slug },
      });

      if (slugConflict) {
        throw ApiError.conflict('Slug sudah digunakan');
      }
    }

    return this.db.layanan.update({
      where: { id },
      data: {
        kode: data.kode,
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        kategori: data.kategori,
        requiresDocument: data.requiresDocument,
        requiresApproval: data.requiresApproval,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Soft delete layanan
   */
  async softDelete(id: bigint): Promise<void> {
    const { desaId } = getInstanceContext();
    const existing = await this.db.layanan.findFirst({
      where: { id, desaId },
    });

    if (!existing) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }

    await this.db.layanan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get layanan statistics
   */
  async getStats(): Promise<{
    total: number;
    aktif: number;
    nonAktif: number;
    perKategori: Record<string, number>;
  }> {
    const { desaId } = getInstanceContext();
    const [total, aktif, nonAktif] = await Promise.all([
      this.db.layanan.count({
        where: { desaId, deletedAt: null },
      }),
      this.db.layanan.count({
        where: { desaId, isActive: true, deletedAt: null },
      }),
      this.db.layanan.count({
        where: { desaId, isActive: false, deletedAt: null },
      }),
    ]);

    // Group by kategori
    const allLayanan = await this.db.layanan.findMany({
      where: { desaId, deletedAt: null },
      select: { kategori: true },
    });

    const perKategori: Record<string, number> = {};
    for (const layanan of allLayanan) {
      const kategori = layanan.kategori || 'Tanpa Kategori';
      perKategori[kategori] = (perKategori[kategori] || 0) + 1;
    }

    return { total, aktif, nonAktif, perKategori };
  }

  /**
   * Find all active services for public catalog (no authentication required)
   */
  async findAllPublic(query: {
    page?: number;
    limit?: number;
    kategori?: string;
    search?: string;
  }): Promise<{
    data: Prisma.LayananGetPayload<object>[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const { desaId } = getInstanceContext();

    // For public catalog, we show only active services
    // In single-desa setup, this filters by isActive
    // In multi-desa setup, this could be filtered by instance
    const where: Prisma.LayananWhereInput = {
      desaId,
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
      this.db.layanan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nama: 'asc' },
        include: {
          fields: {
            where: { layananId: { not: undefined } },
            orderBy: { orderIndex: 'asc' },
          },
          _count: {
            select: {
              permintaan: true,
            },
          },
        },
      }),
      this.db.layanan.count({ where }),
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

  /**
   * Find service by slug for public view
   * Includes fields, document definitions, and published templates
   */
  async findBySlugPublic(slug: string): Promise<Prisma.LayananGetPayload<object> | null> {
    const { desaId } = getInstanceContext();
    return this.db.layanan.findFirst({
      where: {
        desaId,
        slug,
        isActive: true,
        deletedAt: null,
      },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
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
}

export class FieldDefinitionService {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Create a new field definition
   */
  async create(
    data: CreateFieldDefinitionInput
  ): Promise<Prisma.FieldDefinitionGetPayload<object>> {
    // Validate: must have either layananId or templateId
    if (!data.layananId && !data.templateId) {
      throw ApiError.badRequest('Field harus terkait dengan Layanan atau Template');
    }

    // Check for duplicate key within the same layanan/template
    const existing = await this.db.fieldDefinition.findFirst({
      where: {
        ...(data.layananId ? { layananId: data.layananId } : {}),
        ...(data.templateId ? { templateId: data.templateId } : {}),
        key: data.key,
      },
    });

    if (existing) {
      throw ApiError.conflict('Key field sudah ada');
    }

    return this.db.fieldDefinition.create({
      data: {
        layananId: data.layananId,
        templateId: data.templateId,
        key: data.key,
        label: data.label,
        type: data.type,
        source: data.source,
        required: data.required,
        validation: data.validation as Prisma.JsonObject,
        defaultValue: data.defaultValue,
        description: data.description,
        options: data.options as Prisma.JsonArray,
        placeholder: data.placeholder,
        orderIndex: data.orderIndex,
      },
    });
  }

  /**
   * Find all fields with pagination
   */
  async findAll(query: QueryFieldDefinitionInput): Promise<{
    data: Prisma.FieldDefinitionGetPayload<object>[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FieldDefinitionWhereInput = {};

    if (query.layananId) {
      where.layananId = query.layananId;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.search) {
      where.OR = [
        { key: { contains: query.search, mode: 'insensitive' } },
        { label: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.fieldDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderIndex: 'asc' },
      }),
      this.db.fieldDefinition.count({ where }),
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

  /**
   * Find field by ID
   */
  async findById(id: bigint): Promise<Prisma.FieldDefinitionGetPayload<object> | null> {
    return this.db.fieldDefinition.findUnique({
      where: { id },
    });
  }

  /**
   * Update field definition
   */
  async update(
    id: bigint,
    data: UpdateFieldDefinitionInput
  ): Promise<Prisma.FieldDefinitionGetPayload<object>> {
    const existing = await this.db.fieldDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('Field tidak ditemukan');
    }

    // Check for duplicate key
    if (data.key && data.key !== existing.key) {
      const duplicate = await this.db.fieldDefinition.findFirst({
        where: {
          ...(existing.layananId ? { layananId: existing.layananId } : {}),
          ...(existing.templateId ? { templateId: existing.templateId } : {}),
          key: data.key,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw ApiError.conflict('Key field sudah digunakan');
      }
    }

    return this.db.fieldDefinition.update({
      where: { id },
      data: {
        key: data.key,
        label: data.label,
        type: data.type,
        source: data.source,
        required: data.required,
        validation: data.validation as Prisma.JsonObject,
        defaultValue: data.defaultValue,
        description: data.description,
        options: data.options as Prisma.JsonArray,
        placeholder: data.placeholder,
        orderIndex: data.orderIndex,
      },
    });
  }

  /**
   * Delete field definition
   */
  async delete(id: bigint): Promise<void> {
    const existing = await this.db.fieldDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('Field tidak ditemukan');
    }

    await this.db.fieldDefinition.delete({
      where: { id },
    });
  }

  /**
   * Reorder fields
   */
  async reorder(
    ids: { id: bigint; orderIndex: number }[]
  ): Promise<void> {
    await Promise.all(
      ids.map(({ id, orderIndex }) =>
        this.db.fieldDefinition.update({
          where: { id },
          data: { orderIndex },
        })
      )
    );
  }
}

// Export singleton instances
export const layananService = new LayananService();
export const fieldDefinitionService = new FieldDefinitionService();

