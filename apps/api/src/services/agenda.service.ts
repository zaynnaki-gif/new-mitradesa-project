import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { CreateAgendaInput, UpdateAgendaInput, QueryAgendaInput } from '../dto/agenda.dto.js';


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

export class AgendaService {
  async findAll(query: QueryAgendaInput): Promise<PaginatedResult<any>> {
    const { page, limit, search, isAktif, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { };

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { penyelenggara: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isAktif !== undefined) {
      where.isAktif = isAktif === 'true';
    }

    if (status) {
      where.status = status;
    }

    const orderBy: any = [
      { tanggalMulai: 'asc' },
      { createdAt: 'desc' }
    ];

    const [agendaList, total] = await Promise.all([
      prisma.agenda.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.agenda.count({ where }),
    ]);

    return {
      data: agendaList.map(a => ({
        ...a,
        id: a.id.toString()
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
    const where: any = { id };
    const agenda = await prisma.agenda.findFirst({ where });
    if (!agenda) throw ApiError.notFound('Agenda tidak ditemukan');
    return { ...agenda, id: agenda.id.toString() };
  }

  async create(data: CreateAgendaInput) {
    const newAgenda = await prisma.agenda.create({
      data: {
        judul: data.judul,
        slug: data.slug,
        deskripsi: data.deskripsi,
        lokasi: data.lokasi,
        penyelenggara: data.penyelenggara,
        tanggalMulai: new Date(data.tanggalMulai),
        tanggalSelesai: new Date(data.tanggalSelesai),
        status: data.status,
        isAktif: data.isAktif,
      },
    });
    return { ...newAgenda, id: newAgenda.id.toString() };
  }

  async update(id: bigint, data: UpdateAgendaInput) {
    const where: any = { id };
    const agenda = await prisma.agenda.findFirst({ where });
    if (!agenda) throw ApiError.notFound('Agenda tidak ditemukan');

    const updated = await prisma.agenda.update({
      where: { id },
      data: {
        judul: data.judul,
        slug: data.slug,
        deskripsi: data.deskripsi,
        lokasi: data.lokasi,
        penyelenggara: data.penyelenggara,
        tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : undefined,
        tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : undefined,
        status: data.status,
        isAktif: data.isAktif,
      },
    });
    return { ...updated, id: updated.id.toString() };
  }

  async delete(id: bigint) {
    const where: any = { id };
    const agenda = await prisma.agenda.findFirst({ where });
    if (!agenda) throw ApiError.notFound('Agenda tidak ditemukan');
    await prisma.agenda.delete({ where: { id } });
  }
}

export const agendaService = new AgendaService();

