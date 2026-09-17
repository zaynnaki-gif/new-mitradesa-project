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
  async getBlankoList() {
    return prisma.blanko.findMany({
      where: { },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBlankoById(id: bigint) {
    const blanko = await prisma.blanko.findFirst({
      where: { id },
    });
    if (!blanko) throw ApiError.notFound('Blanko not found');
    return blanko;
  }

  async createBlanko(data: BlankoInput) {
    const createData: Prisma.BlankoUncheckedCreateInput = {
      nama: data.nama,
      paperSize: data.paperSize || 'F4',
      margin: (data.margin as Prisma.InputJsonObject) ?? { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      layout: (data.layout as Prisma.InputJsonObject) ?? { orientation: 'portrait' },
      isDefault: data.isDefault || false,
    };
    return prisma.blanko.create({ data: createData });
  }

  async updateBlanko(id: bigint, data: UpdateBlankoInput) {
    const blanko = await this.getBlankoById(id);
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

  async deleteBlanko(id: bigint) {
    const blanko = await this.getBlankoById(id);
    return prisma.blanko.delete({
      where: { id: blanko.id },
    });
  }

  async setDefaultBlanko(id: bigint) {
    const blanko = await this.getBlankoById(id);
    
    // Unset current default
    await prisma.blanko.updateMany({
      where: { isDefault: true },
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
