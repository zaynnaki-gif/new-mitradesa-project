import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { prisma } from './prisma.js';

export class ReportEngineService {
  /**
   * Export Buku Induk Penduduk
   */
  static async exportBukuIndukPenduduk(): Promise<any> {
    const penduduks = await prisma.penduduk.findMany({
      where: {
        isAktif: true,
      },
      include: {
        gubug: true,
        rwRel: true,
        rtRel: true,
      },
      orderBy: [
        { gubugId: 'asc' },
        { rwId: 'asc' },
        { rtId: 'asc' },
        { nik: 'asc' },
      ],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MITRADESA';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Buku Induk Penduduk');
    
    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Lengkap', key: 'namaLengkap', width: 30 },
      { header: 'NIK', key: 'nik', width: 20 },
      { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 15 },
      { header: 'Tempat Lahir', key: 'tempatLahir', width: 20 },
      { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 15 },
      { header: 'Alamat / Dusun', key: 'alamat', width: 30 },
      { header: 'RT', key: 'rt', width: 6 },
      { header: 'RW', key: 'rw', width: 6 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    penduduks.forEach((p, index) => {
      worksheet.addRow({
        no: index + 1,
        namaLengkap: p.namaLengkap,
        nik: p.nik,
        jenisKelamin: p.jenisKelamin,
        tempatLahir: p.tempatLahir,
        tanggalLahir: p.tanggalLahir ? new Date(p.tanggalLahir).toLocaleDateString('id-ID') : '-',
        alamat: p.gubug?.nama || '-',
        rt: p.rtRel?.kode || '-',
        rw: p.rwRel?.kode || '-',
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Export Buku Kas Umum
   */
  static async exportBukuKasUmum(year: number, month?: number): Promise<any> {
    const where: Prisma.KasUmumWhereInput = {};
    if (year) {
      if (month !== undefined) {
        where.tanggal = {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        };
      } else {
        where.tanggal = {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        };
      }
    }
    
    const kasUmums = await prisma.kasUmum.findMany({
      where,
      orderBy: [
        { tanggal: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MITRADESA';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Buku Kas Umum');
    
    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Kode Rekening', key: 'kodeRekening', width: 20 },
      { header: 'Uraian', key: 'uraian', width: 40 },
      { header: 'Penerimaan (Rp)', key: 'penerimaan', width: 20 },
      { header: 'Pengeluaran (Rp)', key: 'pengeluaran', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    kasUmums.forEach((k, index) => {
      const penerimaan = k.jenis === 'KAS_MASUK' ? k.jumlah : 0;
      const pengeluaran = k.jenis === 'KAS_KELUAR' ? k.jumlah : 0;
      totalPenerimaan += penerimaan;
      totalPengeluaran += pengeluaran;

      worksheet.addRow({
        no: index + 1,
        tanggal: new Date(k.tanggal).toLocaleDateString('id-ID'),
        kodeRekening: k.kodeRekening || '-',
        uraian: k.uraian,
        penerimaan,
        pengeluaran,
      });
    });

    // Add totals row
    const totalsRow = worksheet.addRow({
      no: '',
      tanggal: '',
      kodeRekening: '',
      uraian: 'TOTAL',
      penerimaan: totalPenerimaan,
      pengeluaran: totalPengeluaran,
    });
    
    totalsRow.font = { bold: true };
    totalsRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };

    // Format currency columns
    worksheet.getColumn('penerimaan').numFmt = '#,##0.00';
    worksheet.getColumn('pengeluaran').numFmt = '#,##0.00';

    return workbook.xlsx.writeBuffer();
  }
}
