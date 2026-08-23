import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/response.js';
import { CreateNomorSuratConfigInput, UpdateNomorSuratConfigInput } from '../dto/service-document.dto.js';

export class NomorSuratConfigService {
  constructor(private db: PrismaClient) {}

  async getConfig(layananId: string) {
    const config = await this.db.nomorSuratConfig.findUnique({
      where: { layananId: BigInt(layananId) },
    });
    
    if (!config) {
      // Return default config if not found
      return {
        layananId: BigInt(layananId),
        formatTemplate: '{nomor}/{kode_surat}/{bulan}/{tahun}',
        startingNumber: BigInt(1),
        isActive: true,
      };
    }
    
    return config;
  }

  async upsertConfig(layananId: string, data: CreateNomorSuratConfigInput | UpdateNomorSuratConfigInput) {
    // Validate that layanan exists
    const layanan = await this.db.layanan.findUnique({
      where: { id: BigInt(layananId) }
    });
    
    if (!layanan) {
      throw ApiError.notFound('Layanan tidak ditemukan');
    }
    
    const config = await this.db.nomorSuratConfig.upsert({
      where: { layananId: BigInt(layananId) },
      update: {
        formatTemplate: data.formatTemplate || "",
        startingNumber: BigInt(data.startingNumber ?? 1),
        isActive: data.isActive ?? true,
      },
      create: {
        layananId: BigInt(layananId),
        formatTemplate: data.formatTemplate || "",
        startingNumber: BigInt(data.startingNumber ?? 1),
        isActive: data.isActive ?? true,
      }
    });
    
    return config;
  }
}
