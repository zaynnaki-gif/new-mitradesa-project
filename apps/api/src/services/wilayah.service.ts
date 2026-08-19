import { prisma } from './prisma.js';

export class WilayahService {
  /**
   * Get all provinces
   */
  async getProvinsiAll() {
    return prisma.provinsi.findMany({
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get province by ID
   */
  async getProvinsiById(id: number) {
    return prisma.provinsi.findUnique({
      where: { id },
      include: { kabupatens: true },
    });
  }

  /**
   * Create province
   */
  async createProvinsi(data: { kode: string; nama: string }) {
    return prisma.provinsi.create({ data });
  }

  /**
   * Update province
   */
  async updateProvinsi(id: number, data: { kode?: string; nama?: string }) {
    return prisma.provinsi.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete province
   */
  async deleteProvinsi(id: number) {
    await prisma.provinsi.delete({ where: { id } });
  }

  /**
   * Get all regencies
   */
  async getKabupatenAll(provinsiId?: number) {
    const where = provinsiId ? { provinsiId } : undefined;
    return prisma.kabupaten.findMany({
      where,
      include: { provinsi: true },
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get regency by ID
   */
  async getKabupatenById(id: number) {
    return prisma.kabupaten.findUnique({
      where: { id },
      include: { provinsi: true, kecamatans: true },
    });
  }

  /**
   * Create regency
   */
  async createKabupaten(data: { provinsiId: number; kode: string; nama: string }) {
    return prisma.kabupaten.create({ data });
  }

  /**
   * Update regency
   */
  async updateKabupaten(id: number, data: { kode?: string; nama?: string }) {
    return prisma.kabupaten.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete regency
   */
  async deleteKabupaten(id: number) {
    await prisma.kabupaten.delete({ where: { id } });
  }

  /**
   * Get all districts
   */
  async getKecamatanAll(kabupatenId?: number) {
    const where = kabupatenId ? { kabupatenId } : undefined;
    return prisma.kecamatan.findMany({
      where,
      include: { kabupaten: { include: { provinsi: true } } },
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get district by ID
   */
  async getKecamatanById(id: number) {
    return prisma.kecamatan.findUnique({
      where: { id },
      include: { kabupaten: true, desas: true },
    });
  }

  /**
   * Create district
   */
  async createKecamatan(data: { kabupatenId: number; kode: string; nama: string }) {
    return prisma.kecamatan.create({ data });
  }

  /**
   * Update district
   */
  async updateKecamatan(id: number, data: { kode?: string; nama?: string }) {
    return prisma.kecamatan.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete district
   */
  async deleteKecamatan(id: number) {
    await prisma.kecamatan.delete({ where: { id } });
  }

  /**
   * Get all villages
   */
  async getDesaAll(kecamatanId?: number) {
    const where = kecamatanId ? { kecamatanId } : undefined;
    return prisma.desa.findMany({
      where,
      include: { kecamatan: { include: { kabupaten: true } } },
      orderBy: { nama: 'asc' },
    });
  }

  /**
   * Get village by ID
   */
  async getDesaById(id: number) {
    return prisma.desa.findUnique({
      where: { id },
      include: { kecamatan: true },
    });
  }

  /**
   * Create village
   */
  async createDesa(data: { kecamatanId: number; kode: string; nama: string }) {
    return prisma.desa.create({ data });
  }

  /**
   * Update village
   */
  async updateDesa(id: number, data: { kode?: string; nama?: string }) {
    return prisma.desa.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete village
   */
  async deleteDesa(id: number) {
    await prisma.desa.delete({ where: { id } });
  }
}

export const wilayahService = new WilayahService();
