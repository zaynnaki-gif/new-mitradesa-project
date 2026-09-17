import { prisma } from './prisma.js';

export class KodeIsianService {
  async getKodeIsianList(kategori?: string) {
    return prisma.kodeIsianMaster.findMany({
      where: kategori ? { kategori } : undefined,
      orderBy: { kode: 'asc' },
    });
  }
}

export const kodeIsianService = new KodeIsianService();
