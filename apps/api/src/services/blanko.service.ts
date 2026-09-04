import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';

export interface BlankoInput {
  nama: string;
  paperSize?: string;
  margin?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  isDefault?: boolean;
}

export type UpdateBlankoInput = Partial<BlankoInput>;

export class BlankoService {
  async getBlankoList(desaId: bigint) {
    return prisma.blanko.findMany({
      where: { desaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBlankoById(id: bigint, desaId: bigint) {
    const blanko = await prisma.blanko.findFirst({
      where: { id, desaId },
    });
    if (!blanko) throw ApiError.notFound('Blanko not found');
    return blanko;
  }

  async createBlanko(desaId: bigint, data: BlankoInput) {
    const createData: Prisma.BlankoUncheckedCreateInput = {
      desaId,
      nama: data.nama,
      paperSize: data.paperSize || 'F4',
      margin: (data.margin as Prisma.InputJsonObject) ?? { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      layout: (data.layout as Prisma.InputJsonObject) ?? { orientation: 'portrait' },
      isDefault: data.isDefault || false,
    };
    return prisma.blanko.create({ data: createData });
  }

  async updateBlanko(id: bigint, desaId: bigint, data: UpdateBlankoInput) {
    const blanko = await this.getBlankoById(id, desaId);
    const updateData: Prisma.BlankoUncheckedUpdateInput = {};
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.paperSize !== undefined) updateData.paperSize = data.paperSize;
    if (data.margin !== undefined) updateData.margin = data.margin as Prisma.InputJsonObject;
    if (data.layout !== undefined) updateData.layout = data.layout as Prisma.InputJsonObject;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    return prisma.blanko.update({
      where: { id: blanko.id },
      data: updateData,
    });
  }

  async deleteBlanko(id: bigint, desaId: bigint) {
    const blanko = await this.getBlankoById(id, desaId);
    return prisma.blanko.delete({
      where: { id: blanko.id },
    });
  }

  async setDefaultBlanko(id: bigint, desaId: bigint) {
    const blanko = await this.getBlankoById(id, desaId);
    
    // Unset current default
    await prisma.blanko.updateMany({
      where: { desaId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    return prisma.blanko.update({
      where: { id: blanko.id },
      data: { isDefault: true },
    });
  }
}

export const blankoService = new BlankoService();
