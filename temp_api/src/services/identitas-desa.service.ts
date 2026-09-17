import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { getInstanceContext } from '../config/instance.js';

export class IdentitasDesaService {
  /**
   * Get village identity (singleton - first village)
   */
  async getIdentitasDesa() {
    const { desaId } = getInstanceContext();
    // Get the configured desa and its identity
    const desa = await prisma.desa.findFirst({
      where: desaId ? { id: desaId } : undefined,
      include: {
        identitasDesa: true,
        kecamatan: {
          include: {
            kabupaten: {
              include: {
                provinsi: true
              }
            }
          }
        }
      },
    });

    if (!desa?.identitasDesa) {
      return null;
    }

    return {
      ...desa.identitasDesa,
      desa: {
        id: desa.id,
        kode: desa.kode,
        nama: desa.nama,
        kecamatan: {
          id: desa.kecamatan.id,
          nama: desa.kecamatan.nama,
          kode: desa.kecamatan.kode,
          kabupaten: {
            id: desa.kecamatan.kabupaten.id,
            nama: desa.kecamatan.kabupaten.nama,
            kode: desa.kecamatan.kabupaten.kode,
            provinsi: {
              id: desa.kecamatan.kabupaten.provinsi.id,
              nama: desa.kecamatan.kabupaten.provinsi.nama,
              kode: desa.kecamatan.kabupaten.provinsi.kode,
            }
          }
        },
      },
    };
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
      },
    });
  }
}

export const identitasDesaService = new IdentitasDesaService();
