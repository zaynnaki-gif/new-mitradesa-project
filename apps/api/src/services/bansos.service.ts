import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createBansosSchema, updateBansosSchema, queryBansosSchema, addPenerimaSchema, updatePenerimaSchema } from '../dto/bansos.dto.js';

type CreateBansosDTO = z.infer<typeof createBansosSchema>;
type UpdateBansosDTO = z.infer<typeof updateBansosSchema>;
type QueryBansosDTO = z.infer<typeof queryBansosSchema>;
type AddPenerimaDTO = z.infer<typeof addPenerimaSchema>;
type UpdatePenerimaDTO = z.infer<typeof updatePenerimaSchema>;

export const bansosService = {
  async findAll(query: QueryBansosDTO) {
    const { page = 1, limit = 10, tahun, jenis, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BansosWhereInput = {};

    if (tahun) {
      where.tahun = tahun;
    }
    if (jenis) {
      where.jenis = jenis;
    }
    if (search) {
      where.nama = { contains: search, mode: 'insensitive' };
    }

    const orderBy: Prisma.BansosOrderByWithRelationInput[] = [
      { tahun: 'desc' },
      { createdAt: 'desc' }
    ];

    const [data, total] = await Promise.all([
      prisma.bansos.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { penerima: true }
          }
        }
      }),
      prisma.bansos.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const bansos = await prisma.bansos.findUnique({ 
      where: { id },
      include: {
        _count: { select: { penerima: true } }
      }
    });
    if (!bansos) throw ApiError.notFound('Program Bansos tidak ditemukan');
    return bansos;
  },

  async create(data: CreateBansosDTO, desaId?: bigint) {
    return await prisma.bansos.create({
      data: {
        nama: data.nama,
        jenis: data.jenis,
        tahun: data.tahun,
        periode: data.periode,
        jumlahPenerima: data.jumlahPenerima,
        jumlahDana: data.jumlahDana || 0,
        Desa: desaId ? { connect: { id: desaId } } : undefined
      },
    });
  },

  async update(id: string, data: UpdateBansosDTO) {
    const bansos = await prisma.bansos.findUnique({ where: { id } });
    if (!bansos) throw ApiError.notFound('Program Bansos tidak ditemukan');

    return await prisma.bansos.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    const bansos = await prisma.bansos.findUnique({ where: { id } });
    if (!bansos) throw ApiError.notFound('Program Bansos tidak ditemukan');

    await prisma.bansos.delete({ where: { id } });
  },

  // PENERIMA BANSOS

  async getPenerima(bansosId: string) {
    return await prisma.bansosPenerima.findMany({
      where: { bansosId },
      include: {
        penduduk: {
          select: { id: true, namaLengkap: true, nik: true, alamat: true }
        },
        keluarga: {
          select: { id: true, noKk: true, kepala: { select: { namaLengkap: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async addPenerima(bansosId: string, data: AddPenerimaDTO) {
    const bansos = await prisma.bansos.findUnique({ where: { id: bansosId } });
    if (!bansos) throw ApiError.notFound('Program Bansos tidak ditemukan');

    // Check duplicate
    if (data.pendudukId) {
      const exists = await prisma.bansosPenerima.findFirst({
        where: { bansosId, pendudukId: BigInt(data.pendudukId) }
      });
      if (exists) throw ApiError.badRequest('Penduduk ini sudah terdaftar sebagai penerima program ini');
    } else if (data.keluargaId) {
      const exists = await prisma.bansosPenerima.findFirst({
        where: { bansosId, keluargaId: BigInt(data.keluargaId) }
      });
      if (exists) throw ApiError.badRequest('Keluarga ini sudah terdaftar sebagai penerima program ini');
    }

    return await prisma.bansosPenerima.create({
      data: {
        bansosId,
        pendudukId: data.pendudukId ? BigInt(data.pendudukId) : null,
        keluargaId: data.keluargaId ? BigInt(data.keluargaId) : null,
        statusPenerimaan: data.statusPenerimaan,
        tanggalDiterima: data.tanggalDiterima ? new Date(data.tanggalDiterima) : null,
      }
    });
  },

  async updatePenerima(id: bigint, data: UpdatePenerimaDTO) {
    const penerima = await prisma.bansosPenerima.findUnique({ where: { id } });
    if (!penerima) throw ApiError.notFound('Data penerima tidak ditemukan');

    return await prisma.bansosPenerima.update({
      where: { id },
      data: {
        statusPenerimaan: data.statusPenerimaan,
        tanggalDiterima: data.tanggalDiterima ? new Date(data.tanggalDiterima) : (data.tanggalDiterima === null ? null : undefined),
      }
    });
  },

  async deletePenerima(id: bigint) {
    const penerima = await prisma.bansosPenerima.findUnique({ where: { id } });
    if (!penerima) throw ApiError.notFound('Data penerima tidak ditemukan');

    await prisma.bansosPenerima.delete({ where: { id } });
  }
};
