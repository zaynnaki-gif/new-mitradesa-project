import { PrismaClient, Prisma, VersionStatus, DocumentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from './prisma.js';
import {
  CreateDokumenDefinitionInput,
  UpdateDokumenDefinitionInput,
  QueryDokumenDefinitionInput,
  CreateTemplateSuratInput,
  UpdateTemplateSuratInput,
  QueryTemplateSuratInput,
  CreateTemplateVersionInput,
  UpdateTemplateVersionInput,
  QueryTemplateVersionInput,
  CreateInstanDokumenInput,
  QueryInstanDokumenInput,
  CreatePenandaTanganInput,
  UpdatePenandaTanganInput,
  QueryPenandaTanganInput,
} from '../dto/service-document.dto.js';
import { ApiError } from '../utils/response.js';
import { generateDocumentNumber, generateVerificationToken } from '../utils/numbering.js';
import { resolveBinding } from '../utils/binding-resolver.js';
import { getInstanceContext } from '../config/instance.js';

export class DokumenDefinitionService {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db || prisma;
  }

  async create(data: CreateDokumenDefinitionInput) {
    const layanan = await this.db.layanan.findUnique({ where: { id: data.layananId } });
    if (!layanan) throw ApiError.notFound('Layanan tidak ditemukan');

    const existingKode = await this.db.dokumenDefinition.findFirst({
      where: { layananId: data.layananId, kode: data.kode },
    });
    if (existingKode) throw ApiError.conflict('Kode dokumen sudah ada');

    const existingSlug = await this.db.dokumenDefinition.findUnique({ where: { slug: data.slug } });
    if (existingSlug) throw ApiError.conflict('Slug sudah digunakan');

    return this.db.dokumenDefinition.create({
      data: {
        layananId: data.layananId,
        kode: data.kode,
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        isActive: data.isActive,
      },
      include: { layanan: true },
    });
  }

  async findAll(query: QueryDokumenDefinitionInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.DokumenDefinitionWhereInput = {};
    if (query.layananId) where.layananId = query.layananId;
    if (query.search) {
      where.OR = [
        { nama: { contains: query.search, mode: 'insensitive' } },
        { kode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.db.dokumenDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { layanan: true },
      }),
      this.db.dokumenDefinition.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: bigint) {
    return this.db.dokumenDefinition.findUnique({
      where: { id },
      include: {
        layanan: true,
        templates: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  /**
   * Find document by ID with desa verification
   */
  async findByIdWithDesa(id: bigint) {
    const { desaId } = getInstanceContext();
    return this.db.dokumenDefinition.findFirst({
      where: {
        id,
        ...(desaId && { layanan: { desaId } }),
      },
      include: {
        layanan: true,
      },
    });
  }

  async update(id: bigint, data: UpdateDokumenDefinitionInput) {
    const existing = await this.db.dokumenDefinition.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Dokumen tidak ditemukan');
    return this.db.dokumenDefinition.update({
      where: { id },
      data: {
        kode: data.kode,
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        isActive: data.isActive,
      },
    });
  }
}

export class TemplateSuratService {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db || prisma;
  }

  async create(data: CreateTemplateSuratInput) {
    const dokumen = await this.db.dokumenDefinition.findUnique({ where: { id: data.dokumenId } });
    if (!dokumen) throw ApiError.notFound('Dokumen tidak ditemukan');

    if (data.blankoId) {
      const blanko = await this.db.blanko.findUnique({ where: { id: data.blankoId } });
      if (!blanko) throw ApiError.notFound('Blanko tidak ditemukan');
    }

    return this.db.templateSurat.create({
      data: {
        dokumenId: data.dokumenId,
        blankoId: data.blankoId,
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
      },
      include: { dokumen: true },
    });
  }

  async findAll(query: QueryTemplateSuratInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.TemplateSuratWhereInput = {};
    if (query.dokumenId) where.dokumenId = query.dokumenId;
    if (query.search) {
      where.OR = [
        { nama: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.db.templateSurat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { dokumen: true },
      }),
      this.db.templateSurat.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: bigint) {
    return this.db.templateSurat.findUnique({
      where: { id },
      include: {
        dokumen: { include: { layanan: true } },
        versions: { orderBy: { version: 'desc' } },
        fields: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  /**
   * Find all templates with their latest version info
   */
  async findAllWithVersions(query: QueryTemplateSuratInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.TemplateSuratWhereInput = {};
    if (query.dokumenId) where.dokumenId = query.dokumenId;
    if (query.search) {
      where.OR = [
        { nama: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.templateSurat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          dokumen: { include: { layanan: true } },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            include: { creator: { select: { username: true } } },
          },
        },
      }),
      this.db.templateSurat.count({ where }),
    ]);

    // Transform to include latest version info
    const transformed = data.map((t) => ({
      ...t,
      latestVersion: t.versions[0] || null,
      versionCount: t.versions.length,
    }));

    return { data: transformed, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Find template by ID with all version details
   */
  async findByIdWithVersions(id: bigint) {
    const template = await this.db.templateSurat.findUnique({
      where: { id },
      include: {
        dokumen: { include: { layanan: true } },
        versions: {
          orderBy: { version: 'desc' },
          include: { creator: { select: { username: true } } },
        },
        fields: { orderBy: { orderIndex: 'asc' } },
      },
    });
    return template;
  }

  async update(id: bigint, data: UpdateTemplateSuratInput) {
    const existing = await this.db.templateSurat.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Template tidak ditemukan');

    if (data.blankoId !== undefined && data.blankoId !== null) {
      const blanko = await this.db.blanko.findUnique({ where: { id: data.blankoId } });
      if (!blanko) throw ApiError.notFound('Blanko tidak ditemukan');
    }

    return this.db.templateSurat.update({
      where: { id },
      data: { blankoId: data.blankoId, nama: data.nama, slug: data.slug, deskripsi: data.deskripsi },
    });
  }
}

export class TemplateVersionService {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db || prisma;
  }

  async create(templateId: bigint, data: CreateTemplateVersionInput, createdBy: bigint) {
    const template = await this.db.templateSurat.findUnique({ where: { id: templateId } });
    if (!template) throw ApiError.notFound('Template tidak ditemukan');

    const latestVersion = await this.db.templateVersion.findFirst({
      where: { templateId },
      orderBy: { version: 'desc' },
    });
    const newVersion = (latestVersion?.version || 0) + 1;

    return this.db.templateVersion.create({
      data: {
        templateId,
        version: newVersion,
        content: data.content as Prisma.JsonObject,
        kopConfig: data.kopConfig as Prisma.JsonObject | undefined,
        signatureConfig: data.signatureConfig as Prisma.JsonObject | undefined,
        status: VersionStatus.DRAFT,
        changelog: data.changelog,
        createdBy,
      },
    });
  }

  async findByTemplate(templateId: bigint, query: QueryTemplateVersionInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.TemplateVersionWhereInput = { templateId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.db.templateVersion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { version: 'desc' },
      }),
      this.db.templateVersion.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: bigint) {
    return this.db.templateVersion.findUnique({
      where: { id },
      include: {
        template: {
          include: { dokumen: { include: { layanan: true } } },
        },
      },
    });
  }

  /**
   * Find version by ID with full relations
   */
  async findByIdWithRelations(id: bigint) {
    return this.db.templateVersion.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            dokumen: { include: { layanan: true } },
            fields: { orderBy: { orderIndex: 'asc' } },
          },
        },
        creator: { select: { id: true, username: true } },
      },
    });
  }

  /**
   * Create new version from designer (creates new version number)
   */
  async createFromDesigner(
    templateId: bigint,
    data: {
      content?: Record<string, unknown>;
      kopConfig?: Record<string, unknown>;
      signatureConfig?: Record<string, unknown>;
      changelog?: string;
    },
    createdBy: bigint
  ) {
    const template = await this.db.templateSurat.findUnique({ where: { id: templateId } });
    if (!template) throw ApiError.notFound('Template tidak ditemukan');

    // Get latest version number
    const latestVersion = await this.db.templateVersion.findFirst({
      where: { templateId },
      orderBy: { version: 'desc' },
    });
    const newVersion = (latestVersion?.version || 0) + 1;

    // If no content provided, use default
    const content = data.content || {
      metadata: {
        name: template.nama,
        description: '',
        createdAt: new Date().toISOString(),
        version: newVersion,
      },
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      elements: [],
    };

    return this.db.templateVersion.create({
      data: {
        templateId,
        version: newVersion,
        content: content as Prisma.InputJsonValue,
        kopConfig: data.kopConfig as Prisma.InputJsonValue ?? Prisma.JsonNull,
        signatureConfig: data.signatureConfig as Prisma.InputJsonValue ?? Prisma.JsonNull,
        status: VersionStatus.DRAFT,
        changelog: data.changelog,
        createdBy,
      },
      include: {
        template: { include: { dokumen: { include: { layanan: true } } } },
        creator: { select: { id: true, username: true } },
      },
    });
  }

  /**
   * Update version from designer (only DRAFT versions)
   */
  async updateFromDesigner(
    id: bigint,
    data: {
      content?: Record<string, unknown>;
      kopConfig?: Record<string, unknown>;
      signatureConfig?: Record<string, unknown>;
      changelog?: string;
    }
  ) {
    const existing = await this.db.templateVersion.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Version tidak ditemukan');
    if (existing.status !== VersionStatus.DRAFT) {
      throw ApiError.badRequest('Hanya versi DRAFT yang dapat diubah');
    }

    return this.db.templateVersion.update({
      where: { id },
      data: {
        content: data.content ? data.content as Prisma.JsonObject : undefined,
        kopConfig: data.kopConfig !== undefined ? data.kopConfig as Prisma.JsonObject : undefined,
        signatureConfig: data.signatureConfig !== undefined ? data.signatureConfig as Prisma.JsonObject : undefined,
        changelog: data.changelog !== undefined ? data.changelog : undefined,
      },
      include: {
        template: { include: { dokumen: { include: { layanan: true } } } },
        creator: { select: { id: true, username: true } },
      },
    });
  }

  async getActiveVersion(templateId: bigint) {
    return this.db.templateVersion.findFirst({
      where: { templateId, status: VersionStatus.PUBLISHED },
      orderBy: { version: 'desc' },
    });
  }

  async update(id: bigint, data: UpdateTemplateVersionInput) {
    const existing = await this.db.templateVersion.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Version tidak ditemukan');
    if (existing.status !== VersionStatus.DRAFT) {
      throw ApiError.badRequest('Hanya versi DRAFT yang dapat diubah');
    }
    return this.db.templateVersion.update({
      where: { id },
      data: {
        content: data.content as Prisma.JsonObject,
        kopConfig: data.kopConfig as Prisma.JsonObject | undefined,
        signatureConfig: data.signatureConfig as Prisma.JsonObject | undefined,
        changelog: data.changelog,
      },
    });
  }

  async publish(id: bigint) {
    const existing = await this.db.templateVersion.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!existing) throw ApiError.notFound('Version tidak ditemukan');
    if (existing.status === VersionStatus.PUBLISHED) {
      throw ApiError.badRequest('Version sudah dipublikasikan');
    }
    await this.db.templateVersion.updateMany({
      where: { templateId: existing.templateId, status: VersionStatus.PUBLISHED },
      data: { status: VersionStatus.ARCHIVED },
    });
    return this.db.templateVersion.update({
      where: { id },
      data: { status: VersionStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async archive(id: bigint) {
    const existing = await this.db.templateVersion.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Version tidak ditemukan');
    return this.db.templateVersion.update({
      where: { id },
      data: { status: VersionStatus.ARCHIVED },
    });
  }
}

export class InstanDokumenService {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db || prisma;
  }

  async generate(
    data: CreateInstanDokumenInput & { templateVersionId: bigint; requestData?: Record<string, unknown> }
  ) {
    const { desaId } = getInstanceContext();
    const templateVersion = await this.db.templateVersion.findUnique({
      where: { id: data.templateVersionId },
      include: { template: { include: { dokumen: true } } },
    });
    if (!templateVersion) throw ApiError.notFound('Template version tidak ditemukan');
    if (templateVersion.status !== VersionStatus.PUBLISHED) {
      throw ApiError.badRequest('Template version belum dipublikasikan');
    }

    const nomorDokumen = await generateDocumentNumber(this.db, desaId, templateVersion.template.dokumen.kode);
    const verificationToken = generateVerificationToken();
    const content = templateVersion.content as Record<string, unknown>;
    const resolvedContent = data.requestData ? resolveBinding(content, data.requestData) : content;

    return this.db.instanDokumen.create({
      data: {
        dokumenId: data.dokumenId,
        permintaanId: data.permintaanId,
        templateVersionId: data.templateVersionId,
        nomorDokumen,
        judul: data.judul,
        dataSnapshot: (data.requestData || {}) as Prisma.JsonObject,
        contentSnapshot: resolvedContent as Prisma.JsonObject,
        status: DocumentStatus.GENERATED,
        verificationToken,
      },
      include: {
        dokumen: true,
        templateVersion: { include: { template: true } },
      },
    });
  }

  async findAll(query: QueryInstanDokumenInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const { desaId } = getInstanceContext();
    const where: Prisma.InstanDokumenWhereInput = desaId ? { dokumen: { layanan: { desaId } } } : {};
    if (query.dokumenId) where.dokumenId = query.dokumenId;
    if (query.permintaanId) where.permintaanId = query.permintaanId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { nomorDokumen: { contains: query.search, mode: 'insensitive' } },
        { judul: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.db.instanDokumen.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { dokumen: true, templateVersion: { include: { template: true } } },
      }),
      this.db.instanDokumen.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: bigint) {
    return this.db.instanDokumen.findUnique({
      where: { id },
      include: {
        dokumen: { include: { layanan: true } },
        templateVersion: { include: { template: { include: { dokumen: true } } } },
        permintaan: { include: { penduduk: true } },
        signature: { include: { penandatangan: true } },
        verifikasi: true,
      },
    });
  }

  async findByVerificationToken(token: string) {
    return this.db.instanDokumen.findFirst({
      where: { verificationToken: token },
      include: {
        dokumen: { include: { layanan: true } },
        templateVersion: { include: { template: true } },
        signature: { include: { penandatangan: true } },
      },
    });
  }

  async updateStatus(id: bigint, status: DocumentStatus) {
    const existing = await this.db.instanDokumen.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Dokumen tidak ditemukan');
    return this.db.instanDokumen.update({
      where: { id },
      data: {
        status,
        signedAt: status === DocumentStatus.SIGNED ? new Date() : existing.signedAt,
      },
    });
  }
}

export class PenandaTanganService {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db || prisma;
  }

  async create(data: CreatePenandaTanganInput) {
    const { desaId } = getInstanceContext();
    const pinHash = data.pin ? await bcrypt.hash(data.pin, 10) : undefined;
    return this.db.penandaTangan.create({
      data: {
        desaId,
        nama: data.nama,
        jabatan: data.jabatan,
        nip: data.nip,
        tandaTanganUrl: data.tandaTanganUrl,
        isActive: data.isActive,
        accountId: data.accountId ?? undefined,
        pinHash,
      },
    });
  }

  async findAll(query: QueryPenandaTanganInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const { desaId } = getInstanceContext();
    const where: Prisma.PenandaTanganWhereInput = { desaId };
    if (query.isActive === 'true') where.isActive = true;
    if (query.isActive === 'false') where.isActive = false;
    if (query.search) {
      where.OR = [
        { nama: { contains: query.search, mode: 'insensitive' } },
        { jabatan: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.db.penandaTangan.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.db.penandaTangan.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: bigint) {
    return this.db.penandaTangan.findUnique({ where: { id }, include: { signatures: true } });
  }

  async update(id: bigint, data: UpdatePenandaTanganInput) {
    const { desaId } = getInstanceContext();
    const existing = await this.db.penandaTangan.findFirst({ where: { id, desaId } });
    if (!existing) throw ApiError.notFound('Penanda tangan tidak ditemukan');
    const pinHash = data.pin ? await bcrypt.hash(data.pin, 10) : undefined;
    return this.db.penandaTangan.update({
      where: { id },
      data: {
        nama: data.nama,
        jabatan: data.jabatan,
        nip: data.nip,
        tandaTanganUrl: data.tandaTanganUrl,
        isActive: data.isActive,
        ...(data.accountId !== undefined ? { accountId: data.accountId } : {}),
        ...(pinHash !== undefined ? { pinHash } : {}),
      },
    });
  }

  async delete(id: bigint) {
    const { desaId } = getInstanceContext();
    const existing = await this.db.penandaTangan.findFirst({ where: { id, desaId } });
    if (!existing) throw ApiError.notFound('Penanda tangan tidak ditemukan');
    await this.db.penandaTangan.delete({ where: { id } });
  }
}

// Export singleton instances
export const dokumenDefinitionService = new DokumenDefinitionService();
export const templateSuratService = new TemplateSuratService();
export const templateVersionService = new TemplateVersionService();
export const instanDokumenService = new InstanDokumenService();
export const penandaTanganService = new PenandaTanganService();

