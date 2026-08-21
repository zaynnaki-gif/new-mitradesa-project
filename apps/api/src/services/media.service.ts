import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { Prisma } from '@prisma/client';
import { getInstanceContext } from '../config/instance.js';

export interface QueryMediaInput {
  page?: number;
  limit?: number;
  search?: string;
  fileType?: string;
  kategori?: string;
  urutan?: 'asc' | 'desc';
}

export interface CreateMediaInput {
  nama: string;
  slug: string;
  deskripsi?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  alt?: string;
  kategori?: string;
}

export interface UpdateMediaInput {
  nama?: string;
  slug?: string;
  deskripsi?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  alt?: string;
  kategori?: string;
}

export class MediaService {
  /**
   * Get all media with pagination
   */
  async findAll(query: QueryMediaInput) {
    const { page = 1, limit = 20, urutan = 'desc' } = query;
    const { desaId } = getInstanceContext();
    const skip = (page - 1) * limit;

    const where: Prisma.MediaWhereInput = {
      AND: [
        {
          OR: [
            { uploadedBy: { perangkatDesa: { desaId } } },
            { uploadedById: null },
          ],
        },
      ],
    };

    const orderBy: Prisma.MediaOrderByWithRelationInput = {
      createdAt: urutan === 'asc' ? 'asc' : 'desc'
    };

    const [medias, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.media.count({ where }),
    ]);

    return {
      data: medias,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get media by ID
   */
  async findById(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.MediaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { uploadedBy: { perangkatDesa: { desaId } } },
            { uploadedById: null },
          ],
        },
      ],
    };
    const media = await prisma.media.findFirst({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!media) {
      throw ApiError.notFound('Media tidak ditemukan');
    }

    return media;
  }

  /**
   * Get media by slug
   */
  async findBySlug(slug: string) {
    const { desaId } = getInstanceContext();
    const where: Prisma.MediaWhereInput = {
      slug,
      AND: [
        {
          OR: [
            { uploadedBy: { perangkatDesa: { desaId } } },
            { uploadedById: null },
          ],
        },
      ],
    };
    const media = await prisma.media.findFirst({
      where,
      include: {
        uploadedBy: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!media) {
      throw ApiError.notFound('Media tidak ditemukan');
    }

    return media;
  }

  /**
   * Create new media
   */
  async create(data: CreateMediaInput, uploadedById?: bigint) {
    // Check for duplicate slug
    const existing = await prisma.media.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw ApiError.conflict('Slug sudah digunakan');
    }

    // Validate file type
    const validFileTypes = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'];
    if (!validFileTypes.includes(data.fileType)) {
      throw ApiError.badRequest('Tipe file tidak valid');
    }

    // Validate MIME type format
    if (!data.mimeType.includes('/')) {
      throw ApiError.badRequest('Format MIME type tidak valid');
    }

    // Strict validation based on fileType
    const mimeTypeStr = data.mimeType.toLowerCase();
    switch (data.fileType) {
      case 'IMAGE':
        const validImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!validImageMimes.includes(mimeTypeStr)) {
          throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file IMAGE');
        }
        // Limit image to 5MB
        if (data.fileSize > 5 * 1024 * 1024) {
          throw ApiError.badRequest('Ukuran file gambar maksimal 5MB');
        }
        break;
      case 'DOCUMENT':
        const validDocMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validDocMimes.includes(mimeTypeStr)) {
          throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file DOCUMENT');
        }
        // Limit document to 10MB
        if (data.fileSize > 10 * 1024 * 1024) {
          throw ApiError.badRequest('Ukuran file dokumen maksimal 10MB');
        }
        break;
      case 'VIDEO':
        const validVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!validVideoMimes.includes(mimeTypeStr)) {
          throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file VIDEO');
        }
        // Limit video to 50MB
        if (data.fileSize > 50 * 1024 * 1024) {
          throw ApiError.badRequest('Ukuran file video maksimal 50MB');
        }
        break;
      case 'AUDIO':
        const validAudioMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
        if (!validAudioMimes.includes(mimeTypeStr)) {
          throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file AUDIO');
        }
        // Limit audio to 20MB
        if (data.fileSize > 20 * 1024 * 1024) {
          throw ApiError.badRequest('Ukuran file audio maksimal 20MB');
        }
        break;
    }

    const media = await prisma.media.create({
      data: {
        nama: data.nama,
        slug: data.slug,
        deskripsi: data.deskripsi,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        width: data.width,
        height: data.height,
        alt: data.alt,
        kategori: data.kategori,
        uploadedById: uploadedById ? BigInt(uploadedById) : null,
      },
      include: {
        uploadedBy: {
          select: {
            username: true,
          },
        },
      },
    });

    return media;
  }

  /**
   * Update media
   */
  async update(id: bigint, data: UpdateMediaInput) {
    const { desaId } = getInstanceContext();
    const where: Prisma.MediaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { uploadedBy: { perangkatDesa: { desaId } } },
            { uploadedById: null },
          ],
        },
      ],
    };
    const existing = await prisma.media.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Media tidak ditemukan');
    }

    // Check for duplicate slug if being changed
    if (data.slug && data.slug !== existing.slug) {
      const duplicate = await prisma.media.findUnique({
        where: { slug: data.slug },
      });

      if (duplicate) {
        throw ApiError.conflict('Slug sudah digunakan');
      }
    }

    // Validate file type if being changed
    let activeFileType = data.fileType || existing.fileType;
    let activeMimeType = data.mimeType || existing.mimeType;
    let activeFileSize = data.fileSize || existing.fileSize;

    if (data.fileType || data.mimeType || data.fileSize) {
      const validFileTypes = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'];
      if (!validFileTypes.includes(activeFileType)) {
        throw ApiError.badRequest('Tipe file tidak valid');
      }

      if (!activeMimeType.includes('/')) {
        throw ApiError.badRequest('Format MIME type tidak valid');
      }

      const mimeTypeStr = activeMimeType.toLowerCase();
      switch (activeFileType) {
        case 'IMAGE':
          const validImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
          if (!validImageMimes.includes(mimeTypeStr)) {
            throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file IMAGE');
          }
          if (activeFileSize > 5 * 1024 * 1024) {
            throw ApiError.badRequest('Ukuran file gambar maksimal 5MB');
          }
          break;
        case 'DOCUMENT':
          const validDocMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          if (!validDocMimes.includes(mimeTypeStr)) {
            throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file DOCUMENT');
          }
          if (activeFileSize > 10 * 1024 * 1024) {
            throw ApiError.badRequest('Ukuran file dokumen maksimal 10MB');
          }
          break;
        case 'VIDEO':
          const validVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
          if (!validVideoMimes.includes(mimeTypeStr)) {
            throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file VIDEO');
          }
          if (activeFileSize > 50 * 1024 * 1024) {
            throw ApiError.badRequest('Ukuran file video maksimal 50MB');
          }
          break;
        case 'AUDIO':
          const validAudioMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
          if (!validAudioMimes.includes(mimeTypeStr)) {
            throw ApiError.badRequest('MIME type tidak sesuai dengan tipe file AUDIO');
          }
          if (activeFileSize > 20 * 1024 * 1024) {
            throw ApiError.badRequest('Ukuran file audio maksimal 20MB');
          }
          break;
      }
    }

    const updateData: Prisma.MediaUpdateInput = {};
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.fileType !== undefined) updateData.fileType = data.fileType;
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize;
    if (data.mimeType !== undefined) updateData.mimeType = data.mimeType;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.alt !== undefined) updateData.alt = data.alt;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;

    const media = await prisma.media.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            username: true,
          },
        },
      },
    });

    return media;
  }

  /**
   * Soft delete media
   */
  async softDelete(id: bigint) {
    const { desaId } = getInstanceContext();
    const where: Prisma.MediaWhereInput = {
      id,
      AND: [
        {
          OR: [
            { uploadedBy: { perangkatDesa: { desaId } } },
            { uploadedById: null },
          ],
        },
      ],
    };
    const existing = await prisma.media.findFirst({
      where,
    });

    if (!existing) {
      throw ApiError.notFound('Media tidak ditemukan');
    }

    await prisma.media.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Get media statistics
   */
  async getStats() {
    const { desaId } = getInstanceContext();
    const where: Prisma.MediaWhereInput = {
      AND: [
        {
          OR: [
            { uploadedBy: { perangkatDesa: { desaId } } },
            { uploadedById: null },
          ],
        },
      ],
    };

    const [total, images, videos, audio, documents] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.count({ where: { ...where, fileType: 'IMAGE' } }),
      prisma.media.count({ where: { ...where, fileType: 'VIDEO' } }),
      prisma.media.count({ where: { ...where, fileType: 'AUDIO' } }),
      prisma.media.count({ where: { ...where, fileType: 'DOCUMENT' } }),
    ]);

    return {
      total,
      images,
      videos,
      audio,
      documents,
    };
  }
}

export const mediaService = new MediaService();
