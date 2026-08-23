/**
 * Register Export Service
 *
 * Exports document registers to various formats (XLSX, CSV)
 */

import ExcelJS from 'exceljs';
import { prisma } from './prisma.js';
import { getInstanceContext } from '../config/instance.js';

export interface RegisterExportOptions {
  startDate?: Date;
  endDate?: Date;
  layananId?: bigint;
  status?: string;
  format?: 'xlsx' | 'csv';
}

/**
 * Generate XLSX export of document register
 */
export async function exportDokumenRegisterXlsx(
  options: RegisterExportOptions = {}
): Promise<Buffer> {
  const { startDate, endDate, layananId, status } = options;
  const { desaId } = getInstanceContext();

  // Build query
  const where: any = {
    dokumen: {
      layanan: {
        desaId,
      },
    },
  };

  if (startDate || endDate) {
    where.generatedAt = {};
    if (startDate) where.generatedAt.gte = startDate;
    if (endDate) where.generatedAt.lte = endDate;
  }

  if (layananId) {
    where.dokumen = { ...where.dokumen, layananId };
  }

  if (status) {
    where.status = status;
  }

  // Fetch data
  const dokumen = await prisma.instanDokumen.findMany({
    where,
    include: {
      dokumen: {
        include: {
          layanan: {
            select: { nama: true, kode: true },
          },
        },
      },
      signature: {
        include: {
          penandatangan: {
            select: { nama: true, jabatan: true },
          },
        },
      },
    },
    orderBy: { generatedAt: 'desc' },
  });

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MITRADESA';
  workbook.created = new Date();

  // Create worksheet
  const worksheet = workbook.addWorksheet('Register Dokumen');

  // Define columns
  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'No. Dokumen', key: 'nomorDokumen', width: 30 },
    { header: 'Jenis Layanan', key: 'jenisLayanan', width: 25 },
    { header: 'Judul', key: 'judul', width: 40 },
    { header: 'Tujuan', key: 'tujuan', width: 30 },
    { header: 'Tgl Generate', key: 'generatedAt', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Penanda Tangan', key: 'penandaTangan', width: 25 },
    { header: 'Tgl Tanda Tangan', key: 'signedAt', width: 18 },
    { header: 'Token Verifikasi', key: 'verificationToken', width: 35 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  let no = 1;
  for (const doc of dokumen) {
    const row = worksheet.addRow({
      no: no++,
      nomorDokumen: doc.nomorDokumen,
      jenisLayanan: doc.dokumen.layanan.nama,
      judul: doc.judul,
      tujuan: doc.tujuan || '-',
      generatedAt: formatDate(doc.generatedAt),
      status: formatStatus(doc.status),
      penandaTangan: doc.signature?.penandatangan?.nama || '-',
      signedAt: doc.signedAt ? formatDate(doc.signedAt) : '-',
      verificationToken: doc.verificationToken || '-',
    });

    // Color status cells
    const statusCell = row.getCell('status');
    switch (doc.status) {
      case 'SIGNED':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF00B050' }, // Green
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' } };
        break;
      case 'GENERATED':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' }, // Yellow/Gold
        };
        break;
      case 'REVOKED':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }, // Red
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' } };
        break;
    }
  }

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Freeze header row
  worksheet.views = [{ state: 'frozen', activeCell: 'A2' }];

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

/**
 * Generate CSV export of document register
 */
export async function exportDokumenRegisterCsv(
  options: RegisterExportOptions = {}
): Promise<string> {
  const { startDate, endDate, layananId, status } = options;
  const { desaId } = getInstanceContext();

  // Build query
  const where: any = {
    dokumen: {
      layanan: {
        desaId,
      },
    },
  };

  if (startDate || endDate) {
    where.generatedAt = {};
    if (startDate) where.generatedAt.gte = startDate;
    if (endDate) where.generatedAt.lte = endDate;
  }

  if (layananId) {
    where.dokumen = { ...where.dokumen, layananId };
  }

  if (status) {
    where.status = status;
  }

  // Fetch data
  const dokumen = await prisma.instanDokumen.findMany({
    where,
    include: {
      dokumen: {
        include: {
          layanan: {
            select: { nama: true, kode: true },
          },
        },
      },
      signature: {
        include: {
          penandatangan: {
            select: { nama: true },
          },
        },
      },
    },
    orderBy: { generatedAt: 'desc' },
  });

  // Build CSV
  const headers = [
    'No',
    'No. Dokumen',
    'Jenis Layanan',
    'Judul',
    'Tujuan',
    'Tgl. Generate',
    'Status',
    'Penanda Tangan',
    'Tgl. Tanda Tangan',
    'Token Verifikasi',
  ];

  const rows = dokumen.map((doc, index) => [
    index + 1,
    doc.nomorDokumen,
    doc.dokumen.layanan.nama,
    doc.judul,
    doc.tujuan || '',
    formatDate(doc.generatedAt),
    formatStatus(doc.status),
    doc.signature?.penandatangan?.nama || '',
    doc.signedAt ? formatDate(doc.signedAt) : '',
    doc.verificationToken || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => escapeCsv(String(cell))).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Generate XLSX export of service request register
 */
export async function exportPermintaanRegisterXlsx(
  options: RegisterExportOptions = {}
): Promise<Buffer> {
  const { startDate, endDate, layananId, status } = options;
  const { desaId } = getInstanceContext();

  // Build query
  const where: any = {
    desaId,
    deletedAt: null,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (layananId) {
    where.layananId = layananId;
  }

  if (status) {
    where.status = status;
  }

  // Fetch data
  const permintaan = await prisma.permintaanLayanan.findMany({
    where,
    include: {
      layanan: {
        select: { nama: true, kode: true },
      },
      penduduk: {
        select: { namaLengkap: true, nik: true },
      },
      dokumen: {
        select: { nomorDokumen: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MITRADESA';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Register Permintaan');

  // Define columns
  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'No. Registrasi', key: 'nomorPermintaan', width: 30 },
    { header: 'Layanan', key: 'layanan', width: 25 },
    { header: 'Nama Pemohon', key: 'nama', width: 25 },
    { header: 'NIK', key: 'nik', width: 20 },
    { header: 'Tgl Pengajuan', key: 'createdAt', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'No. Dokumen', key: 'nomorDokumen', width: 30 },
    { header: 'Status Dokumen', key: 'dokumenStatus', width: 15 },
    { header: 'Catatan', key: 'catatan', width: 30 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  let no = 1;
  for (const req of permintaan) {
    const doc = req.dokumen[0];
    const row = worksheet.addRow({
      no: no++,
      nomorPermintaan: req.nomorPermintaan,
      layanan: req.layanan.nama,
      nama: req.penduduk?.namaLengkap || '-',
      nik: req.penduduk?.nik || '-',
      createdAt: formatDate(req.createdAt),
      status: formatRequestStatus(req.status),
      nomorDokumen: doc?.nomorDokumen || '-',
      dokumenStatus: doc ? formatStatus(doc.status) : '-',
      catatan: req.catatan || '-',
    });

    // Color status cells
    const statusCell = row.getCell('status');
    switch (req.status) {
      case 'COMPLETED':
      case 'APPROVED':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF00B050' },
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' } };
        break;
      case 'PROCESSING':
      case 'VERIFICATION':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' },
        };
        break;
      case 'REJECTED':
      case 'CANCELLED':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' },
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' } };
        break;
    }
  }

  // Add borders
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  worksheet.views = [{ state: 'frozen', activeCell: 'A2' }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

// ============================================================
// Helper Functions
// ============================================================

function formatDate(date: Date): string {
  if (!date) return '-';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_SIGNATURE: 'Menunggu TTD',
    GENERATED: 'Sudah Dibuat',
    SIGNED: 'Sudah Ditandatangani',
    REVOKED: 'Dicabut',
  };
  return statusMap[status] || status;
}

function formatRequestStatus(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    VERIFICATION: 'Verifikasi',
    PROCESSING: 'Diproses',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };
  return statusMap[status] || status;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
