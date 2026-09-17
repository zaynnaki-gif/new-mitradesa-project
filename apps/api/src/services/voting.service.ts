import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { AuditService } from './audit.service.js';
import type { CreateVotingInput, UpdateVotingInput, CreateKandidatInput, CastVoteInput } from '../dto/usulan-voting.dto.js';

export class VotingService {
  private auditService = new AuditService();

  // ============================================================
  // Voting CRUD
  // ============================================================
  async findAll() {
    const votings = await prisma.voting.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        kandidats: { orderBy: { nomorUrut: 'asc' } },
        _count: { select: { suaras: true } },
      },
    });

    return votings.map(this.toVotingResponse);
  }

  async findById(id: bigint) {
    const voting = await prisma.voting.findUnique({
      where: { id },
      include: {
        kandidats: { orderBy: { nomorUrut: 'asc' } },
        _count: { select: { suaras: true } },
      },
    });
    if (!voting) throw ApiError.notFound('Voting tidak ditemukan');
    return this.toVotingResponse(voting);
  }

  async create(input: CreateVotingInput, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const mulai = new Date(input.waktuMulai);
    const selesai = new Date(input.waktuSelesai);

    if (selesai <= mulai) {
      throw new ApiError(400, 'INVALID_INPUT', 'Waktu selesai harus setelah waktu mulai');
    }

    const result = await prisma.voting.create({
      data: {
        judul: input.judul,
        deskripsi: input.deskripsi,
        waktuMulai: mulai,
        waktuSelesai: selesai,
        status: 'MENDATANG',
      },
      include: {
        kandidats: true,
        _count: { select: { suaras: true } },
      },
    });

    await this.auditService.log({
      entityType: 'voting',
      entityId: result.id,
      action: 'VOTING_CREATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      afterData: { id: result.id.toString(), judul: result.judul },
    });

    return this.toVotingResponse(result);
  }

  async update(id: bigint, input: UpdateVotingInput, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.voting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Voting tidak ditemukan');

    const result = await prisma.voting.update({
      where: { id },
      data: {
        ...(input.judul && { judul: input.judul }),
        ...(input.deskripsi && { deskripsi: input.deskripsi }),
        ...(input.waktuMulai && { waktuMulai: new Date(input.waktuMulai) }),
        ...(input.waktuSelesai && { waktuSelesai: new Date(input.waktuSelesai) }),
        ...(input.status && { status: input.status }),
      },
      include: {
        kandidats: true,
        _count: { select: { suaras: true } },
      },
    });

    await this.auditService.log({
      entityType: 'voting',
      entityId: id,
      action: 'VOTING_UPDATED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
    });

    return this.toVotingResponse(result);
  }

  async remove(id: bigint, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const existing = await prisma.voting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Voting tidak ditemukan');

    await prisma.voting.delete({ where: { id } });
    await this.auditService.log({
      entityType: 'voting',
      entityId: id,
      action: 'VOTING_DELETED',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
    });
  }

  // ============================================================
  // Kandidat
  // ============================================================
  async addKandidat(votingId: bigint, input: CreateKandidatInput, actorId?: bigint) {
    const voting = await prisma.voting.findUnique({ where: { id: votingId } });
    if (!voting) throw ApiError.notFound('Voting tidak ditemukan');

    if (voting.status !== 'MENDATANG') {
      throw new ApiError(400, 'INVALID_STATE', 'Kandidat hanya bisa ditambah saat voting belum dimulai');
    }

    return prisma.votingKandidat.create({
      data: {
        votingId,
        nama: input.nama,
        deskripsi: input.deskripsi,
        fotoUrl: input.fotoUrl,
        nomorUrut: input.nomorUrut,
        rkpdesId: input.rkpdesId,
      },
    });
  }

  async removeKandidat(votingId: bigint, kandidatId: bigint) {
    const kandidat = await prisma.votingKandidat.findFirst({
      where: { id: kandidatId, votingId },
    });
    if (!kandidat) throw ApiError.notFound('Kandidat tidak ditemukan');
    await prisma.votingKandidat.delete({ where: { id: kandidatId } });
  }

  // ============================================================
  // Voting (Cast)
  // ============================================================
  async castVote(votingId: bigint, input: CastVoteInput) {
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: { kandidats: { select: { id: true } } },
    });
    if (!voting) throw ApiError.notFound('Voting tidak ditemukan');

    if (voting.status !== 'BERLANGSUNG') {
      throw new ApiError(400, 'VOTING_NOT_ACTIVE', 'Voting tidak sedang berlangsung');
    }

    const kandidat = await prisma.votingKandidat.findFirst({
      where: { id: input.kandidatId, votingId },
    });
    if (!kandidat) throw ApiError.notFound('Kandidat tidak ditemukan dalam voting ini');
    if (!kandidat.rkpdesId) throw new ApiError(400, 'INVALID_KANDIDAT', 'Kandidat tidak terkait dengan RKPDes (program usulan)');

    const rkpdes = await prisma.rkpdes.findUnique({ where: { id: kandidat.rkpdesId } });
    if (!rkpdes) throw ApiError.notFound('Data program RKPDes tidak ditemukan');
    const bidangId = rkpdes.rpjmdesBidangId;

    // Validate penduduk exists
    const penduduk = await prisma.penduduk.findUnique({ where: { id: input.pendudukId } });
    if (!penduduk) throw ApiError.notFound('Penduduk tidak ditemukan');

    // Check if already voted in this bidang
    const existingVote = await prisma.votingSuara.findFirst({
      where: { votingId, pendudukId: input.pendudukId, rpjmdesBidangId: bidangId },
    });
    if (existingVote) {
      throw new ApiError(409, 'ALREADY_VOTED', 'Anda sudah memberikan suara untuk program di Bidang ini.');
    }

    const suara = await prisma.votingSuara.create({
      data: {
        votingId,
        kandidatId: input.kandidatId,
        pendudukId: input.pendudukId,
        rpjmdesBidangId: bidangId,
      },
    });

    return {
      id: suara.id.toString(),
      votingId: suara.votingId.toString(),
      kandidatId: suara.kandidatId.toString(),
      pendudukId: suara.pendudukId.toString(),
      waktu: suara.waktu.toISOString(),
    };
  }

  // ============================================================
  // Hasil Voting
  // ============================================================
  async getHasil(votingId: bigint) {
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        kandidats: {
          orderBy: { nomorUrut: 'asc' },
          include: {
            _count: { select: { suaras: true } },
          },
        },
        _count: { select: { suaras: true } },
      },
    });
    if (!voting) throw ApiError.notFound('Voting tidak ditemukan');

    const totalSuara = voting._count.suaras;
    return {
      votingId: voting.id.toString(),
      judul: voting.judul,
      status: voting.status,
      totalSuara,
      kandidats: voting.kandidats.map((k) => ({
        id: k.id.toString(),
        nomorUrut: k.nomorUrut,
        nama: k.nama,
        perolehanSuara: k._count.suaras,
        persentase: totalSuara > 0 ? Math.round((k._count.suaras / totalSuara) * 100 * 100) / 100 : 0,
      })),
    };
  }

  private toVotingResponse(v: any) {
    return {
      id: v.id.toString(),
      judul: v.judul,
      deskripsi: v.deskripsi,
      waktuMulai: v.waktuMulai.toISOString(),
      waktuSelesai: v.waktuSelesai.toISOString(),
      status: v.status,
      totalSuara: v._count?.suaras ?? 0,
      kandidats: v.kandidats?.map((k: any) => ({
        id: k.id.toString(),
        nomorUrut: k.nomorUrut,
        nama: k.nama,
        deskripsi: k.deskripsi,
        fotoUrl: k.fotoUrl,
        rkpdesId: k.rkpdesId?.toString() ?? null,
        rkpdes: k.rkpdes ? {
          id: k.rkpdes.id.toString(),
          apbdesItemId: k.rkpdes.apbdesItemId?.toString() ?? null,
        } : null
      })) ?? [],
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    };
  }

  // ============================================================
  // Integrasi ke APBDes
  // ============================================================
  async jadikanApbdes(votingId: bigint, kandidatId: bigint, actorId?: bigint, actorIp?: string, actorAgent?: string) {
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
    });
    if (!voting) throw ApiError.notFound('Voting tidak ditemukan');
    if (voting.status !== 'SELESAI') {
      throw new ApiError(400, 'INVALID_STATE', 'Voting belum selesai, tidak dapat memasukkan ke APBDes.');
    }

    const kandidat = await prisma.votingKandidat.findFirst({
      where: { id: kandidatId, votingId },
      include: {
        rkpdes: true
      }
    });
    if (!kandidat) throw ApiError.notFound('Kandidat tidak ditemukan dalam voting ini');
    if (!kandidat.rkpdesId || !kandidat.rkpdes) {
      throw new ApiError(400, 'INVALID_KANDIDAT', 'Kandidat ini bukan program RKPDes');
    }

    if (kandidat.rkpdes.apbdesItemId) {
      throw new ApiError(400, 'ALREADY_EXISTS', 'Program ini sudah dimasukkan ke dalam APBDes');
    }

    const tahun = kandidat.rkpdes.tahun;
    
    // Cari APBDes untuk tahun tersebut
    let apbdes = await prisma.apbdes.findFirst({
      where: { tahun }
    });

    // Jika belum ada, buat baru
    if (!apbdes) {
      apbdes = await prisma.apbdes.create({
        data: {
          tahun,
          isAktif: true,
        }
      });
    }

    // Buat ApbdesItem untuk RKPDes
    const apbdesItem = await prisma.apbdesItem.create({
      data: {
        apbdesId: apbdes.id,
        kategori: 'BELANJA',
        nama: kandidat.rkpdes.namaKegiatan,
        anggaran: kandidat.rkpdes.perkiraanBiaya,
        realization: 0,
      }
    });

    // Update RKPDes agar terhubung
    await prisma.rkpdes.update({
      where: { id: kandidat.rkpdes.id },
      data: { apbdesItemId: apbdesItem.id }
    });

    // Update APBDes Total Belanja
    await prisma.apbdes.update({
      where: { id: apbdes.id },
      data: {
        totalBelanja: {
          increment: apbdesItem.anggaran
        }
      }
    });

    await this.auditService.log({
      entityType: 'apbdes_item',
      entityId: apbdesItem.id,
      action: 'VOTING_TO_APBDES',
      actorId,
      actorType: 'USER',
      actorIp,
      actorAgent,
      metadata: { votingId: voting.id.toString(), kandidatId: kandidat.id.toString() }
    });

    return apbdesItem;
  }
}

export const votingService = new VotingService();
