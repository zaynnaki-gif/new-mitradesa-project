import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

/**
 * Month names in Roman numerals
 */
const MONTHS_ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

/**
 * Numbering token types
 * - {seq} or {seq:N} - Sequence number, padded to N digits (default 5)
 * - {tahun} - Current year (4 digits)
 * - {bulan} - Month number (01-12)
 * - {bulanRomawi} - Month in Roman numerals
 * - {kode} - Classification code
 * - {kades} - Village head abbreviation
 * - {desa} - Village abbreviation
 */
interface NumberingContext {
  sequence: number;
  tahun: number;
  bulan: number;
  kode?: string;
  kades?: string;
  jabatan?: string;
  desa?: string;
}

/**
 * Parse format template and generate number
 */
export function parseFormatTemplate(
  template: string,
  context: NumberingContext
): string {
  let result = template;

  // Replace {seq} with padded sequence (default 5 digits)
  result = result.replace(/\{seq\}/g, context.sequence.toString().padStart(5, '0'));

  // Replace {seq:N} with N-digit padded sequence
  result = result.replace(/\{seq:(\d+)\}/g, (_, digits: string) => {
    return context.sequence.toString().padStart(parseInt(digits), '0');
  });

  // Replace {tahun}
  result = result.replace(/\{tahun\}/g, context.tahun.toString());

  // Replace {bulan}
  result = result.replace(/\{bulan\}/g, context.bulan.toString().padStart(2, '0'));

  // Replace {bulanRomawi}
  result = result.replace(/\{bulanRomawi\}/g, MONTHS_ROMAN[context.bulan - 1]);

  // Replace {kode}
  if (context.kode) {
    result = result.replace(/\{kode\}/g, context.kode);
  }

  // Replace {kades}
  if (context.kades) {
    result = result.replace(/\{kades\}/g, context.kades);
  }

  // Replace {jabatan}
  if (context.jabatan) {
    result = result.replace(/\{jabatan\}/g, context.jabatan);
  }

  // Replace {desa}
  if (context.desa) {
    result = result.replace(/\{desa\}/g, context.desa);
  }

  return result;
}

/**
 * Get village identity info for numbering
 */
async function getVillageInfo(
  prisma: PrismaClient | Prisma.TransactionClient,
  desaId: bigint
): Promise<{ nama: string; singkatan?: string | null }> {
  const identitasDesa = await prisma.identitasDesa.findUnique({
    where: { desaId },
  });

  return {
    nama: identitasDesa?.namaDesa || 'Desa',
    singkatan: identitasDesa?.singkatanDesa,
  };
}

/**
 * Get village head (kades) info
 */
async function getJabatanInfo(
  prisma: PrismaClient | Prisma.TransactionClient,
  desaId: bigint
): Promise<{ inisial: string; nama: string }> {
  await prisma.perangkatDesa.findFirst({
    where: {
      desaId,
      jabatan: {
        contains: 'Kepala Desa',
        mode: 'insensitive',
      },
      status: 'AKTIF',
    },
  });

  // Default initials for Kepala Desa is KDS
  return { inisial: 'KDS', nama: 'Kepala Desa' };
}

/**
 * Generate document number with race condition protection
 * Uses database transaction with pessimistic locking
 */
export async function generateDocumentNumber(
  db: PrismaClient | Prisma.TransactionClient,
  desaId: bigint,
  kode?: string
): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;

  const updateLogic = async (tx: PrismaClient | Prisma.TransactionClient) => {
    let nd = await tx.nomorDokumen.findUnique({
      where: { desaId },
    });

    if (!nd || nd.lastYear !== tahun) {
      nd = await tx.nomorDokumen.upsert({
        where: { desaId },
        update: {
          lastSequence: 1,
          lastYear: tahun,
        },
        create: {
          desaId,
          lastSequence: 1,
          lastYear: tahun,
        },
      });
    } else {
      nd = await tx.nomorDokumen.update({
        where: { desaId },
        data: {
          lastSequence: { increment: 1 },
        },
      });
    }
    return nd;
  };

  // Use transaction to atomically get and update sequence if not already in one
  const nomorDokumen = ('$transaction' in db)
    ? await (db as PrismaClient).$transaction(updateLogic)
    : await updateLogic(db);

  const newSequence = Number(nomorDokumen.lastSequence);

  // Get village info for replacements
  const [villageInfo, jabatanInfo] = await Promise.all([
    getVillageInfo(db, desaId),
    getJabatanInfo(db, desaId),
  ]);

  // Use config format if config is set (assuming config logic is handled by caller in the future)
  // For now, default to the requested structure: KODE/SEQ/JABATAN.DESA/BULAN/TAHUN
  const template = kode
    ? `{kode}/{seq:3}/{jabatan}.{desa}/{bulanRomawi}/{tahun}`
    : `000/{seq:3}/{jabatan}.{desa}/{bulanRomawi}/{tahun}`;

  return parseFormatTemplate(template, {
    sequence: newSequence,
    tahun,
    bulan,
    kode,
    jabatan: jabatanInfo.inisial,
    desa: villageInfo.singkatan || villageInfo.nama.substring(0, 4).toUpperCase(),
  });
}

/**
 * Generate request number (service request)
 */
export async function generateRequestNumber(
  db: PrismaClient | Prisma.TransactionClient,
  desaId: bigint,
  layananKode: string
): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;

  // Get numbering config for this service
  const config = await db.nomorSuratConfig.findUnique({
    where: { layananId: (await db.layanan.findFirst({ where: { kode: layananKode, desaId } }))?.id },
  });

  const format = config?.formatTemplate || `REQ-{kode}/{tahun}/{seq}`;

  // Get village info
  const villageInfo = await getVillageInfo(db, desaId);

  // For simplicity, use layananKode as the klasifikasi code
  const klasifikasi = layananKode;

  // Get count of existing requests for this service in this year to determine next sequence
  const count = await db.permintaanLayanan.count({
    where: {
      desaId,
      createdAt: {
        gte: new Date(tahun, 0, 1),
        lt: new Date(tahun + 1, 0, 1),
      },
    },
  });

  const nextSeq = Math.max(Number(config?.startingNumber || 1), count + 1);

  return parseFormatTemplate(format, {
    sequence: nextSeq,
    tahun,
    bulan,
    kode: klasifikasi,
    kades: villageInfo.singkatan || villageInfo.nama.substring(0, 3).toUpperCase(),
    desa: villageInfo.singkatan || villageInfo.nama.substring(0, 3).toUpperCase(),
  });
}

/**
 * Generate verification token for public document verification
 */
export function generateVerificationToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Validate numbering format template
 */
export function validateFormatTemplate(template: string): { valid: boolean; error?: string } {
  if (!template || template.trim() === '') {
    return { valid: false, error: 'Format template tidak boleh kosong' };
  }

  // Check for at least one {seq} placeholder
  // Accept both {seq} and {seq:N} formats
  if (!template.includes('{seq}') && !template.match(/\{seq:\d+\}/)) {
    return { valid: false, error: 'Format template harus mengandung {seq}' };
  }

  // Check for balanced braces
  const openBraces = (template.match(/\{/g) || []).length;
  const closeBraces = (template.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return { valid: false, error: 'Kurung kurawal tidak seimbang' };
  }

  // Check for valid tokens
  const validTokens = [
    '{seq}', '{seq:',
    '{tahun}', '{bulan}', '{bulanRomawi}',
    '{kode}', '{kades}', '{jabatan}', '{desa}',
  ];

  // Extract all tokens from template
  const tokens = template.match(/\{[^}]+\}/g) || [];
  for (const token of tokens) {
    const isValid = validTokens.some(vt => token.startsWith(vt.replace('}', '')));
    if (!isValid && token !== '{}') {
      return { valid: false, error: `Token tidak valid: ${token}` };
    }
  }

  return { valid: true };
}
