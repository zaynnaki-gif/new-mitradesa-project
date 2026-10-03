import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { identitasDesaService } from '../services/identitas-desa.service.js';

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
  _prisma: PrismaClient | Prisma.TransactionClient,
  
): Promise<{ nama: string; singkatan?: string | null }> {
  const identitasDesa = await identitasDesaService.getIdentitasDesa();

  return {
    nama: identitasDesa?.namaDesa || 'Desa',
    singkatan: identitasDesa?.singkatanDesa,
  };
}

/**
 * Get village head (kades) info
 */
async function getJabatanInfo(
  _prisma: PrismaClient | Prisma.TransactionClient,
  
): Promise<{ inisial: string; nama: string }> {
  // Use cached kades info from IdentitasDesaService
  const identitas = await identitasDesaService.getIdentitasDesa();
  const kadesInfo = (identitas as Record<string, unknown>)?.kadesInfo as Record<string, unknown>;
  
  if (kadesInfo) {
    return { inisial: 'KDS', nama: (kadesInfo.penduduk as Record<string, unknown>)?.namaLengkap as string || 'Kepala Desa' };
  }

  // Default initials for Kepala Desa is KDS
  return { inisial: 'KDS', nama: identitas?.kepalaDesa || 'Kepala Desa' };
}

/**
 * Generate document number with race condition protection.
 * Reads NomorSuratConfig from DB for this layanan to get the proper format template
 * and kodeKlasifikasi. Falls back to hardcoded format if no config found.
 */
export async function generateDocumentNumber(
  db: PrismaClient | Prisma.TransactionClient,
  kode?: string
): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;

  const NOMOR_DOKUMEN_SINGLETON_ID = 1n;

  const updateLogic = async (tx: PrismaClient | Prisma.TransactionClient) => {
    let nd = await (tx as PrismaClient).nomorDokumen.findUnique({
      where: { id: NOMOR_DOKUMEN_SINGLETON_ID },
    });

    if (!nd || nd.lastYear !== tahun) {
      nd = await (tx as PrismaClient).nomorDokumen.upsert({
        where: { id: NOMOR_DOKUMEN_SINGLETON_ID },
        update: {
          lastSequence: 1,
          lastYear: tahun,
        },
        create: {
          lastSequence: 1,
          lastYear: tahun,
        },
      });
    } else {
      nd = await (tx as PrismaClient).nomorDokumen.update({
        where: { id: NOMOR_DOKUMEN_SINGLETON_ID },
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
    getVillageInfo(db),
    getJabatanInfo(db),
  ]);

  // === FETCH NomorSuratConfig from DB for this layanan by kode ===
  let formatTemplate: string | null = null;
  let kodeKlasifikasi: string | undefined = kode;

  if (kode) {
    try {
      const layanan = await (db as PrismaClient).layanan.findFirst({
        where: { kode },
        include: { nomorConfig: true },
      });
      const config = layanan?.nomorConfig?.[0];
      if (config?.isActive && config.formatTemplate) {
        formatTemplate = config.formatTemplate;
        // Extract kodeKlasifikasi from formatTemplate (first segment before '/')
        const firstSegment = formatTemplate.split('/')[0];
        if (firstSegment && !firstSegment.includes('{')) {
          kodeKlasifikasi = firstSegment;
        }
      }
    } catch {
      // Silently fall through to default template
    }
  }

  // Use DB config template if available, otherwise fallback to standard format
  const template = formatTemplate ||
    (kode
      ? `{kode}/{seq:3}/{jabatan}.{desa}/{bulanRomawi}/{tahun}`
      : `000/{seq:3}/{jabatan}.{desa}/{bulanRomawi}/{tahun}`);

  return parseFormatTemplate(template, {
    sequence: newSequence,
    tahun,
    bulan,
    kode: kodeKlasifikasi,
    jabatan: jabatanInfo.inisial,
    desa: villageInfo.singkatan || villageInfo.nama.substring(0, 4).toUpperCase(),
  });
}

/**
 * Generate request number (service request)
 */
export async function generateRequestNumber(
  db: PrismaClient | Prisma.TransactionClient,
  layananKode: string
): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;

  // Fetch the layanan to get its ID
  const layanan = await (db as PrismaClient).layanan.findFirst({
    where: { kode: layananKode },
    include: { nomorConfig: true },
  });

  // Get numbering config for this service
  const config = layanan?.nomorConfig?.[0];
  const format = config?.formatTemplate || `REQ-{kode}/{tahun}/{seq:3}`;

  // Extract kodeKlasifikasi: use first segment of formatTemplate if it's a static code
  let kodeKlasifikasi = layananKode;
  if (config?.formatTemplate) {
    const firstSegment = config.formatTemplate.split('/')[0];
    if (firstSegment && !firstSegment.includes('{')) {
      kodeKlasifikasi = firstSegment;
    }
  }

  // Get village info
  const [villageInfo, jabatanInfo] = await Promise.all([
    getVillageInfo(db),
    getJabatanInfo(db),
  ]);

  // Count existing requests for THIS specific layanan in this year (per-layanan sequence)
  const count = await (db as PrismaClient).permintaanLayanan.count({
    where: {
      layananId: layanan?.id,
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
    kode: kodeKlasifikasi,
    jabatan: jabatanInfo.inisial,
    kades: jabatanInfo.inisial,
    desa: villageInfo.singkatan || villageInfo.nama.substring(0, 4).toUpperCase(),
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
