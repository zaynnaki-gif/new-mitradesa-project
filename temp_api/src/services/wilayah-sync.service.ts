/* eslint-disable no-console */
/**
 * Wilayah Sync Service
 * Fetches wilayah data from external API and syncs to local database
 *
 * External API: https://emsifa.github.io/api-wilayah
 *
 * Data structure:
 * - provinces.json - all provinces
 * - regencies/{id}.json - regencies by province
 * - districts/{id}.json - districts by regency
 * - villages/{id}.json - villages by district
 */

import { prisma } from './prisma.js';

const EXTERNAL_API_BASE = 'https://emsifa.github.io/api-wilayah';

interface ExternalProvinsi {
  id: string;
  name: string;
}

interface ExternalKabupaten {
  id: string;
  province_id: string;
  name: string;
}

interface ExternalKecamatan {
  id: string;
  regency_id: string;
  name: string;
}

interface ExternalDesa {
  id: string;
  district_id: string;
  name: string;
  full_id: string;
  postal_code: string;
}

export class WilayahSyncService {
  private progress = {
    provinces: { total: 0, synced: 0 },
    regencies: { total: 0, synced: 0 },
    districts: { total: 0, synced: 0 },
    villages: { total: 0, synced: 0 },
  };

  async syncAll(): Promise<{ message: string; stats: { provinces: { total: number; synced: number }; regencies: { total: number; synced: number }; districts: { total: number; synced: number }; villages: { total: number; synced: number } } }> {
    console.log('Starting wilayah sync...');

    try {
      // Sync step by step
      await this.syncProvinsi();
      await this.syncKabupaten();
      await this.syncKecamatan();
      await this.syncDesa();

      console.log('Wilayah sync completed!');
      return {
        message: 'Sync completed successfully',
        stats: this.progress
      };
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  private async fetchJson<T>(url: string): Promise<T[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json() as Promise<T[]>;
  }

  private async syncProvinsi(): Promise<void> {
    console.log('Syncing provinces...');
    const data = await this.fetchJson<ExternalProvinsi>(`${EXTERNAL_API_BASE}/provinces.json`);
    this.progress.provinces.total = data.length;

    for (const item of data) {
      try {
        await prisma.provinsi.upsert({
          where: { kode: item.id },
          update: { nama: item.name },
          create: {
            kode: item.id,
            nama: item.name,
          },
        });
        this.progress.provinces.synced++;

        if (this.progress.provinces.synced % 5 === 0) {
          console.log(`  Synced ${this.progress.provinces.synced}/${this.progress.provinces.total} provinces`);
        }
      } catch (error) {
        console.error(`  Error syncing province ${item.id}:`, error);
      }
    }
    console.log(`Provinces: ${this.progress.provinces.synced}/${this.progress.provinces.total} synced`);
  }

  private async syncKabupaten(): Promise<void> {
    console.log('Syncing regencies...');

    // Get all provinces to fetch their regencies
    const provinces = await prisma.provinsi.findMany();
    this.progress.regencies.total = 0;
    this.progress.regencies.synced = 0;

    for (const prov of provinces) {
      try {
        const data = await this.fetchJson<ExternalKabupaten>(
          `${EXTERNAL_API_BASE}/regencies/${prov.kode}.json`
        );
        this.progress.regencies.total += data.length;

        for (const item of data) {
          try {
            await prisma.kabupaten.upsert({
              where: { provinsiId_kode: { provinsiId: prov.id, kode: item.id } },
              update: { nama: item.name },
              create: {
                provinsiId: prov.id,
                kode: item.id,
                nama: item.name,
              },
            });
            this.progress.regencies.synced++;
          } catch (error) {
            console.error(`  Error syncing regency ${item.id}:`, error);
          }
        }

        console.log(`  ${prov.nama}: ${data.length} regencies synced`);
      } catch (error) {
        console.error(`  Error fetching regencies for province ${prov.kode}:`, error);
      }
    }

    console.log(`Regencies: ${this.progress.regencies.synced}/${this.progress.regencies.total} synced`);
  }

  private async syncKecamatan(): Promise<void> {
    console.log('Syncing districts...');

    // Get all regencies to fetch their districts
    const regencies = await prisma.kabupaten.findMany();
    this.progress.districts.total = 0;
    this.progress.districts.synced = 0;

    for (const kab of regencies) {
      try {
        const data = await this.fetchJson<ExternalKecamatan>(
          `${EXTERNAL_API_BASE}/districts/${kab.kode}.json`
        );
        this.progress.districts.total += data.length;

        for (const item of data) {
          try {
            await prisma.kecamatan.upsert({
              where: { kabupatenId_kode: { kabupatenId: kab.id, kode: item.id } },
              update: { nama: item.name },
              create: {
                kabupatenId: kab.id,
                kode: item.id,
                nama: item.name,
              },
            });
            this.progress.districts.synced++;
          } catch (error) {
            console.error(`  Error syncing district ${item.id}:`, error);
          }
        }

        console.log(`  ${kab.nama}: ${data.length} districts synced`);
      } catch (error) {
        console.error(`  Error fetching districts for regency ${kab.kode}:`, error);
      }
    }

    console.log(`Districts: ${this.progress.districts.synced}/${this.progress.districts.total} synced`);
  }

  private async syncDesa(): Promise<void> {
    console.log('Syncing villages...');

    // Get all districts to fetch their villages
    const districts = await prisma.kecamatan.findMany();
    this.progress.villages.total = 0;
    this.progress.villages.synced = 0;

    for (const kec of districts) {
      try {
        const data = await this.fetchJson<ExternalDesa>(
          `${EXTERNAL_API_BASE}/villages/${kec.kode}.json`
        );
        this.progress.villages.total += data.length;

        for (const item of data) {
          try {
            await prisma.desa.upsert({
              where: { kecamatanId_kode: { kecamatanId: kec.id, kode: item.id } },
              update: { nama: item.name },
              create: {
                kecamatanId: kec.id,
                kode: item.id,
                nama: item.name,
              },
            });
            this.progress.villages.synced++;

            // Log progress every 1000 villages
            if (this.progress.villages.synced % 1000 === 0) {
              console.log(`  Villages: ${this.progress.villages.synced}/${this.progress.villages.total} synced`);
            }
          } catch (error) {
            console.error(`  Error syncing village ${item.id}:`, error);
          }
        }

        console.log(`  ${kec.nama}: ${data.length} villages synced`);
      } catch (error) {
        console.error(`  Error fetching villages for district ${kec.kode}:`, error);
      }
    }

    console.log(`Villages: ${this.progress.villages.synced}/${this.progress.villages.total} synced`);
  }

  async getStats(): Promise<{
    provinces: number;
    regencies: number;
    districts: number;
    villages: number;
    gubug: number;
    rw: number;
    rt: number;
  }> {
    const [provinces, regencies, districts, villages, gubugs, rws, rts] = await Promise.all([
      prisma.provinsi.count(),
      prisma.kabupaten.count(),
      prisma.kecamatan.count(),
      prisma.desa.count(),
      prisma.gubug.count(),
      prisma.rw.count(),
      prisma.rt.count(),
    ]);

    return { provinces, regencies, districts, villages, gubug: gubugs, rw: rws, rt: rts };
  }
}

export const wilayahSyncService = new WilayahSyncService();

