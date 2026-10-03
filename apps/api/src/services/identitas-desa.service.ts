import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';


export class IdentitasDesaService {
  private cache: any = null;
  private lastFetch: number = 0;
  private readonly TTL: number = 60 * 1000 * 5; // 5 minutes cache

  /**
   * Get village identity (singleton - single-tenant, always first record)
   */
  async getIdentitasDesa() {
    const now = Date.now();
    if (this.cache && (now - this.lastFetch < this.TTL)) {
      return this.cache;
    }

    let identitasDesa: any = await prisma.identitasDesa.findFirst({
      include: {
        Desa: {
          include: {
            kecamatan: {
              include: {
                kabupaten: {
                  include: { provinsi: true }
                }
              }
            }
          }
        }
      }
    });

    if (!identitasDesa) {
      // Create it inside a transaction to ensure atomicity and attempt to link to a Desa record
      identitasDesa = await prisma.$transaction(async (tx) => {
        const newIdentitas = await tx.identitasDesa.create({
          data: {
            namaDesa: '', // To be configured via admin panel
            kodeDesa: '',
            alamat: '',
          }
        });

        // Try to link it to the first Desa record if it exists and lacks an identity link
        const firstDesa = await tx.desa.findFirst();
        if (firstDesa && !firstDesa.identitasDesaId) {
          await tx.desa.update({
            where: { id: firstDesa.id },
            data: { identitasDesaId: newIdentitas.id }
          });
        }

        return newIdentitas;
      });
    }

    // Auto-populate kepalaDesa and sekretarisDesa from PerangkatDesa table if they are available
    const kades = await prisma.perangkatDesa.findFirst({
      where: { jabatan: { contains: 'Kepala Desa', mode: 'insensitive' }, status: 'AKTIF' },
      include: { penduduk: true }
    });
    
    const sekdes = await prisma.perangkatDesa.findFirst({
      where: { jabatan: { contains: 'Sekretaris', mode: 'insensitive' }, status: 'AKTIF' },
      include: { penduduk: true }
    });

    // Only override the returned object if we found actual active personnel in the DB.
    // Otherwise, it keeps whatever was stored in the IdentitasDesa table as a fallback.
    if (kades && kades.penduduk) {
      identitasDesa.kepalaDesa = kades.penduduk.namaLengkap;
      (identitasDesa as any).kadesInfo = kades;
    }
    if (sekdes && sekdes.penduduk) {
      identitasDesa.sekretarisDesa = sekdes.penduduk.namaLengkap;
      (identitasDesa as any).sekdesInfo = sekdes;
    }

    this.cache = identitasDesa;
    this.lastFetch = Date.now();
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

    // Invalidate cache immediately
    this.cache = null;
    this.lastFetch = 0;

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
