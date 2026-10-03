import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import * as ExcelJS from 'exceljs';
import { z } from 'zod';
import { excelRowPendudukSchema, ImportPendudukResponse } from '../dto/kependudukan-import.dto.js';

export class PendudukImportService {
  /**
   * Parse and Import Excel File
   */
  async importFromExcel(buffer: any): Promise<ImportPendudukResponse> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw ApiError.badRequest('File Excel kosong atau tidak valid');
    }

    const response: ImportPendudukResponse = {
      totalRows: 0,
      successCount: 0,
      failedCount: 0,
      duplicateCount: 0,
      errors: [],
    };

    // Assumes row 1 is header
    const rows = worksheet.getRows(2, worksheet.rowCount) || [];
    response.totalRows = rows.length;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +1 for 1-based, +1 for header

      try {
        // Read columns based on standard template
        // [A] No KK, [B] NIK, [C] Nama, [D] Jenis Kelamin, [E] Tempat Lahir, [F] Tanggal Lahir, [G] Agama, [H] Pendidikan, [I] Pekerjaan, 
        // [J] Gol. Darah, [K] Status Kawin, [L] Hubungan, [M] WN, [N] Paspor, [O] Kitas, [P] Ayah, [Q] Ibu, [R] Alamat, [S] RT, [T] RW, [U] Dusun
        
        const noKk = row.getCell(1).text?.trim();
        const nik = row.getCell(2).text?.trim();
        if (!noKk && !nik) continue; // Skip empty rows

        // Parse date carefully
        let tanggalLahirStr = row.getCell(6).value;
        let tanggalLahirDate = new Date();
        if (tanggalLahirStr instanceof Date) {
            tanggalLahirDate = tanggalLahirStr;
        } else if (typeof tanggalLahirStr === 'string') {
            tanggalLahirDate = new Date(tanggalLahirStr);
        }

        const rawData = {
          noKk: noKk,
          nik: nik,
          namaLengkap: row.getCell(3).text?.trim(),
          jenisKelamin: row.getCell(4).text?.trim().toUpperCase(),
          tempatLahir: row.getCell(5).text?.trim(),
          tanggalLahir: tanggalLahirDate,
          agama: row.getCell(7).text?.trim(),
          pendidikan: row.getCell(8).text?.trim() || undefined,
          pekerjaan: row.getCell(9).text?.trim() || undefined,
          golonganDarah: row.getCell(10).text?.trim() || undefined,
          statusPerkawinan: row.getCell(11).text?.trim(),
          statusHubunganDalamKeluarga: row.getCell(12).text?.trim().toUpperCase(),
          kewarganegaraan: row.getCell(13).text?.trim() || 'WNI',
          noPaspor: row.getCell(14).text?.trim() || undefined,
          noKitasKitap: row.getCell(15).text?.trim() || undefined,
          namaAyah: row.getCell(16).text?.trim(),
          namaIbu: row.getCell(17).text?.trim(),
          alamatKeluarga: row.getCell(18).text?.trim() || undefined,
          rt: row.getCell(19).text?.trim() || undefined,
          rw: row.getCell(20).text?.trim() || undefined,
          dusun: row.getCell(21).text?.trim() || undefined,
        };

        const validatedData = excelRowPendudukSchema.parse(rawData);

        // Check Duplicate NIK
        const existingPenduduk = await prisma.penduduk.findUnique({
          where: { nik: validatedData.nik },
        });

        if (existingPenduduk) {
          response.duplicateCount++;
          response.errors.push({ row: rowNumber, error: 'NIK sudah terdaftar (Skipped)', nik: validatedData.nik });
          continue;
        }

        // Process inside a transaction for this specific row to avoid partial writes
        await prisma.$transaction(async (tx) => {
          // Check/Create Keluarga
          let keluarga = await tx.keluarga.findUnique({
            where: { noKk: validatedData.noKk },
          });

          // Insert Penduduk first
          const penduduk = await tx.penduduk.create({
            data: {
              nik: validatedData.nik,
              namaLengkap: validatedData.namaLengkap,
              jenisKelamin: validatedData.jenisKelamin as 'L' | 'P',
              tempatLahir: validatedData.tempatLahir,
              tanggalLahir: validatedData.tanggalLahir,
              agama: validatedData.agama,
              pendidikan: validatedData.pendidikan,
              pekerjaan: validatedData.pekerjaan,
              golDarah: validatedData.golonganDarah,
              statusPerkawinan: validatedData.statusPerkawinan,
              wargaNegara: validatedData.kewarganegaraan,
              namaAyahLengkap: validatedData.namaAyah,
              namaIbuLengkap: validatedData.namaIbu,
              isAktif: true,
            },
          });

          if (!keluarga) {
            keluarga = await tx.keluarga.create({
              data: {
                noKk: validatedData.noKk,
                kepalaId: penduduk.id, // Set first person as head initially
                alamat: validatedData.alamatKeluarga,
                rtId: validatedData.rt && !isNaN(Number(validatedData.rt)) ? BigInt(validatedData.rt) : null,
                rwId: validatedData.rw && !isNaN(Number(validatedData.rw)) ? BigInt(validatedData.rw) : null,
                gubugId: validatedData.dusun && !isNaN(Number(validatedData.dusun)) ? BigInt(validatedData.dusun) : null,
              },
            });
          } else {
             // If this row explicitly says KEPALA KELUARGA, we might want to update the head,
             // but to be safe we leave existing head if it's already created.
             if (validatedData.statusHubunganDalamKeluarga === 'KEPALA KELUARGA') {
                await tx.keluarga.update({
                  where: { id: keluarga.id },
                  data: { kepalaId: penduduk.id }
                });
             }
          }

          // Add as Anggota Keluarga
          await tx.anggotaKeluarga.create({
            data: {
              keluargaId: keluarga.id,
              pendudukId: penduduk.id,
              hubungan: validatedData.statusHubunganDalamKeluarga,
              isAktif: true,
            },
          });
        });

        response.successCount++;

      } catch (err: any) {
        response.failedCount++;
        response.errors.push({
          row: rowNumber,
          error: err instanceof z.ZodError ? err.errors.map(e => e.message).join(', ') : err.message,
        });
      }
    }

    return response;
  }

  /**
   * Generate Standard Excel Template
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Penduduk');

    // Define Columns
    worksheet.columns = [
      { header: 'No KK (16 digit)', key: 'noKk', width: 20 },
      { header: 'NIK (16 digit)', key: 'nik', width: 20 },
      { header: 'Nama Lengkap', key: 'namaLengkap', width: 25 },
      { header: 'Jenis Kelamin (L/P)', key: 'jenisKelamin', width: 15 },
      { header: 'Tempat Lahir', key: 'tempatLahir', width: 20 },
      { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'tanggalLahir', width: 25 },
      { header: 'Agama', key: 'agama', width: 15 },
      { header: 'Pendidikan', key: 'pendidikan', width: 20 },
      { header: 'Pekerjaan', key: 'pekerjaan', width: 20 },
      { header: 'Gol. Darah', key: 'golonganDarah', width: 12 },
      { header: 'Status Perkawinan', key: 'statusPerkawinan', width: 18 },
      { header: 'Hubungan (KEPALA KELUARGA/ISTRI/ANAK)', key: 'hubungan', width: 35 },
      { header: 'Kewarganegaraan', key: 'kewarganegaraan', width: 18 },
      { header: 'No Paspor', key: 'noPaspor', width: 15 },
      { header: 'No KITAS/KITAP', key: 'noKitas', width: 18 },
      { header: 'Nama Ayah', key: 'namaAyah', width: 20 },
      { header: 'Nama Ibu', key: 'namaIbu', width: 20 },
      { header: 'Alamat Keluarga', key: 'alamat', width: 30 },
      { header: 'RT', key: 'rt', width: 8 },
      { header: 'RW', key: 'rw', width: 8 },
      { header: 'Dusun', key: 'dusun', width: 15 },
    ];

    // Add 1 sample row
    worksheet.addRow({
      noKk: '3201010000000001',
      nik: '3201010000000002',
      namaLengkap: 'JHON DOE',
      jenisKelamin: 'L',
      tempatLahir: 'JAKARTA',
      tanggalLahir: '1990-01-01',
      agama: 'ISLAM',
      pendidikan: 'SMA',
      pekerjaan: 'WIRASWASTA',
      golonganDarah: 'O',
      statusPerkawinan: 'KAWIN',
      hubungan: 'KEPALA KELUARGA',
      kewarganegaraan: 'WNI',
      noPaspor: '',
      noKitas: '',
      namaAyah: 'FATHAN',
      namaIbu: 'SITI',
      alamat: 'JL. MERDEKA NO 1',
      rt: '001',
      rw: '002',
      dusun: 'CIBATU',
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export all Penduduk to Excel
   */
  async exportToExcel(): Promise<Buffer> {
    const pendudukList = await prisma.penduduk.findMany({
      include: {
        anggotaKeluarga: {
          include: { keluarga: true },
          where: { isAktif: true },
          take: 1, // assume only 1 active KK
        },
      },
      where: {
        isAktif: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Penduduk');

    worksheet.columns = [
      { header: 'No KK (16 digit)', key: 'noKk', width: 20 },
      { header: 'NIK (16 digit)', key: 'nik', width: 20 },
      { header: 'Nama Lengkap', key: 'namaLengkap', width: 25 },
      { header: 'Jenis Kelamin (L/P)', key: 'jenisKelamin', width: 15 },
      { header: 'Tempat Lahir', key: 'tempatLahir', width: 20 },
      { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 15 },
      { header: 'Agama', key: 'agama', width: 15 },
      { header: 'Pendidikan', key: 'pendidikan', width: 20 },
      { header: 'Pekerjaan', key: 'pekerjaan', width: 20 },
      { header: 'Gol. Darah', key: 'golonganDarah', width: 12 },
      { header: 'Status Perkawinan', key: 'statusPerkawinan', width: 18 },
      { header: 'Hubungan (KEPALA KELUARGA/ISTRI/ANAK)', key: 'hubungan', width: 35 },
      { header: 'Kewarganegaraan', key: 'kewarganegaraan', width: 18 },
      { header: 'No Paspor', key: 'noPaspor', width: 15 },
      { header: 'No KITAS/KITAP', key: 'noKitas', width: 18 },
      { header: 'Nama Ayah', key: 'namaAyah', width: 20 },
      { header: 'Nama Ibu', key: 'namaIbu', width: 20 },
      { header: 'Alamat Keluarga', key: 'alamat', width: 30 },
      { header: 'RT', key: 'rt', width: 8 },
      { header: 'RW', key: 'rw', width: 8 },
      { header: 'Dusun', key: 'dusun', width: 15 },
    ];

    for (const p of pendudukList) {
      const ak = p.anggotaKeluarga[0];
      const kk = ak?.keluarga;

      worksheet.addRow({
        noKk: kk?.noKk || '',
        nik: p.nik,
        namaLengkap: p.namaLengkap,
        jenisKelamin: p.jenisKelamin,
        tempatLahir: p.tempatLahir,
        tanggalLahir: p.tanggalLahir.toISOString().split('T')[0],
        agama: p.agama,
        pendidikan: p.pendidikan || '',
        pekerjaan: p.pekerjaan || '',
        golonganDarah: p.golDarah || '',
        statusPerkawinan: p.statusPerkawinan,
        hubungan: ak?.hubungan || '',
        kewarganegaraan: p.wargaNegara || 'Indonesia',
        noPaspor: '', // Field removed in Prisma
        noKitas: '', // Field removed in Prisma
        namaAyah: p.namaAyahLengkap || '',
        namaIbu: p.namaIbuLengkap || '',
        alamat: kk?.alamat || '',
        rt: kk?.rtId?.toString() || '',
        rw: kk?.rwId?.toString() || '',
        dusun: kk?.gubugId?.toString() || '',
      });
    }

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const pendudukImportService = new PendudukImportService();
