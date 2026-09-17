import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';


export class IdentitasDesaService {
  /**
   * Get village identity (singleton - single-tenant, always first record)
   */
  async getIdentitasDesa() {
    let identitasDesa = await prisma.identitasDesa.findFirst();

    if (!identitasDesa) {
      // Auto-seed default identitas if missing to prevent 404 errors on fresh installations
      identitasDesa = await prisma.identitasDesa.create({
        data: {
          namaDesa: 'Desa Seruni Mumbul', // default fallback
          kodeDesa: '52.03.08.2014',
          alamat: 'Jl. Raya Seruni Mumbul',
        }
      });
    }

    // Auto-populate kepalaDesa and sekretarisDesa from PerangkatDesa table
    const kades = await prisma.perangkatDesa.findFirst({
      where: { jabatan: { contains: 'Kepala Desa', mode: 'insensitive' }, status: 'AKTIF' },
      include: { penduduk: true }
    });
    
    const sekdes = await prisma.perangkatDesa.findFirst({
      where: { jabatan: { contains: 'Sekretaris', mode: 'insensitive' }, status: 'AKTIF' },
      include: { penduduk: true }
    });

    if (kades && kades.penduduk) {
      identitasDesa.kepalaDesa = kades.penduduk.namaLengkap;
    }
    if (sekdes && sekdes.penduduk) {
      identitasDesa.sekretarisDesa = sekdes.penduduk.namaLengkap;
    }

    return identitasDesa;
  }

  /**
   * Update village identity
   */
  async updateIdentitasDesa(data: {
    namaDesa?: string;
    singkatanDesa?: string;
    kodeDesa?: string;
    alamat?: string;
    kodepos?: string;
    telepon?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    logoDesaUrl?: string;
    logoKabupatenUrl?: string;
    faviconUrl?: string;
    kepalaDesa?: string;
    sekretarisDesa?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  }) {
    const current = await this.getIdentitasDesa();

    if (!current) {
      throw ApiError.notFound('Village identity not configured');
    }

    // Update the identity
    return prisma.identitasDesa.update({
      where: { id: current.id },
      data: {
        namaDesa: data.namaDesa,
        singkatanDesa: data.singkatanDesa,
        kodeDesa: data.kodeDesa,
        alamat: data.alamat,
        kodepos: data.kodepos,
        telepon: data.telepon,
        whatsapp: data.whatsapp,
        email: data.email,
        website: data.website,
        logoDesaUrl: data.logoDesaUrl,
        logoKabupatenUrl: data.logoKabupatenUrl,
        faviconUrl: data.faviconUrl,
        kepalaDesa: data.kepalaDesa,
        sekretarisDesa: data.sekretarisDesa,
        facebook: data.facebook,
        instagram: data.instagram,
        twitter: data.twitter,
        youtube: data.youtube,
      },
    });
  }
}

export const identitasDesaService = new IdentitasDesaService();
