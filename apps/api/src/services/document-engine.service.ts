/**
 * Document Engine Service
 *
 * Orchestrates the complete document generation pipeline:
 * 1. Resolve bindings from context data
 * 2. Evaluate conditional visibility
 * 3. Process table/repeater sections
 * 4. Generate PDF
 * 5. Store PDF
 * 6. Create document record
 */

import crypto from 'node:crypto';
import { Prisma, PrismaClient, DocumentStatus, VersionStatus } from '@prisma/client';
import { prisma } from './prisma.js';
import { generatePdf, RenderOptions, Element } from './pdf-renderer.service.js';
import { notificationService } from './notification.service.js';
import {
  resolveBinding,
  BindingContext,
  validateTemplateBindings,
  getVillageContext,
  validateContextBindings,
} from '../utils/binding-resolver.js';
import {
  evaluateConditionString,
} from '../utils/condition-evaluator.js';
import {
  validateDataSource,
  resolveArray,
  validateTableConfig,
} from '../utils/table-resolver.js';
import { generateDocumentNumber, generateVerificationToken } from '../utils/numbering.js';
import { ApiError } from '../utils/response.js';
import { config } from '../config/index.js';
import { getStorageProvider } from './storage/index.js';
import type { IStorageProvider } from './storage/index.js';


// ============================================================
// Types
// ============================================================

export interface DocumentGenerationOptions {
  templateVersionId: bigint;
  context: BindingContext;
  judul: string;
  permintaanId?: bigint;
  generatePdf?: boolean;
  /** Pre-loaded citizen notification data to avoid a redundant DB round-trip */
  citizenNotificationHint?: {
    phone?: string | null;
    nomorPermintaan?: string;
    layananNama?: string;
  };
}

export interface DocumentGenerationResult {
  documentId: bigint;
  nomorDokumen: string;
  verificationToken: string;
  pdfUrl?: string;
  status: DocumentStatus;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProcessedElement {
  element: Element;
  visible: boolean;
}

// ============================================================
// Document Engine Service
// ============================================================

export class DocumentEngineService {
  private db: PrismaClient;
  private storage: IStorageProvider;

  constructor(db?: PrismaClient, storage?: IStorageProvider) {
    this.db = db || prisma;
    this.storage = storage || getStorageProvider();
  }

  /**
   * Generate a document from template
   */
  async generateDocument(options: DocumentGenerationOptions): Promise<DocumentGenerationResult> {
    const { templateVersionId, context, judul, permintaanId, generatePdf = true } = options;

    // 1. Load template version
    const version = await this.db.templateVersion.findUnique({
      where: { id: templateVersionId },
      include: {
        template: {
          include: {
            dokumen: { include: { layanan: true } },
            blanko: true,
          },
        },
      },
    });

    if (!version) {
      throw ApiError.notFound('Template versi tidak ditemukan');
    }

    if (version.status !== VersionStatus.PUBLISHED) {
      throw ApiError.badRequest('Template harus dalam status PUBLISHED');
    }

    // 2. Load permintaan data to extract dataJson (form DNA) and penduduk profile
    let customData: Record<string, unknown> = {};
    let pendudukFromPermintaan: Record<string, unknown> | undefined;

    if (permintaanId) {
      const permintaan = await this.db.permintaanLayanan.findUnique({
        where: { id: permintaanId },
        include: {
          penduduk: {
            include: {
              gubug: true,
              rwRel: true,
              rtRel: true,
            }
          },
        },
      });

      if (permintaan) {
        // Inject dataJson fields as custom.* — these are the DNA form fields from the warga
        const dataJson = (permintaan.dataJson as Record<string, unknown>) || {};
        customData = dataJson;

        // Also enrich penduduk bindings from actual DB record if available
        if (permintaan.penduduk) {
          const pd = permintaan.penduduk as Record<string, unknown>;
          pendudukFromPermintaan = {
            nik: pd.nik,
            namaLengkap: pd.namaLengkap || pd.nama_lengkap,
            nama_lengkap: pd.namaLengkap || pd.nama_lengkap,
            tempatLahir: pd.tempatLahir || pd.tempat_lahir,
            tempat_lahir: pd.tempatLahir || pd.tempat_lahir,
            tanggalLahir: pd.tanggalLahir || pd.tanggal_lahir,
            tanggal_lahir: pd.tanggalLahir || pd.tanggal_lahir,
            jenisKelamin: pd.jenisKelamin || pd.jenis_kelamin,
            jenis_kelamin: pd.jenisKelamin || pd.jenis_kelamin,
            agama: pd.agama,
            statusPerkawinan: pd.statusPerkawinan || pd.status_perkawinan,
            status_perkawinan: pd.statusPerkawinan || pd.status_perkawinan,
            pekerjaan: pd.pekerjaan,
            pendidikan: pd.pendidikan,
            golDarah: pd.golDarah || pd.gol_darah,
            gol_darah: pd.golDarah || pd.gol_darah,
            alamat: pd.alamat,
            rt: pd.rt || (pd.rtRel as any)?.nama || '-',
            rw: pd.rw || (pd.rwRel as any)?.nama || '-',
            dusun: pd.dusun || (pd.gubug as any)?.nama || '-',
            kewarganegaraan: pd.kewarganegaraan || 'WNI',
            wargaNegara: pd.wargaNegara || pd.kewarganegaraan || 'Indonesia',
            telepon: pd.telepon,
            email: pd.email,
          };
        }
      }
    }

    // 3. Generate document number using NomorSuratConfig from DB
    const nomorDokumen = await generateDocumentNumber(
      this.db,
      version.template.dokumen.kode
    );

    // 4. Generate verification token
    const verificationToken = generateVerificationToken();

    // 5. Load default penanda tangan for the village
    const defaultSignatory = await this.db.penandaTangan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    // 5.5 Merge village & system context into context so standard village/signatory/system bindings resolve
    const villageCtx = await getVillageContext(this.db);

    // 5.6 Build auto kop config from village identity if kopConfig is minimal
    let kopConfig = version.kopConfig as Record<string, unknown> | undefined;
    if (!kopConfig || (kopConfig as Record<string, unknown>).show === true) {
      // Build rich kop from village context
      const desaCtx = villageCtx.desa as Record<string, unknown>;
      kopConfig = {
        logoDesa: {
          visible: !!desaCtx?.logoDesa,
          position: 'left',
          size: 24,
          source: desaCtx?.logoDesa || null,
        },
        logoKabupaten: {
          visible: !!desaCtx?.logoKabupaten,
          position: 'right',
          size: 24,
          source: desaCtx?.logoKabupaten || null,
        },
        institutionNames: {
          pemda: { visible: true, text: `PEMERINTAH KABUPATEN ${String(desaCtx?.kabupaten || '').toUpperCase()}` },
          kecamatan: { visible: true, text: `KECAMATAN ${String(desaCtx?.kecamatan || '').toUpperCase()}` },
          desa: { visible: true, text: `DESA ${String(desaCtx?.nama || '').toUpperCase().replace(/^DESA\s*/i, '')}` },
        },
        addressBlock: {
          enabled: true,
          lines: [
            desaCtx?.alamat ? `Alamat: ${desaCtx.alamat}` : null,
            desaCtx?.telepon ? `Telp: ${desaCtx.telepon}` : null,
            desaCtx?.email ? `Email: ${desaCtx.email}` : null,
          ].filter(Boolean) as string[],
        },
        divider: { style: 'double', thickness: 2 },
      };
    }

    const now = new Date();
    const fullContext: BindingContext = {
      ...villageCtx,
      system: {
        tanggal: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        tanggalSurat: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        nomorSurat: nomorDokumen,
        nomor: nomorDokumen,
        penandatangan: defaultSignatory?.nama || (villageCtx.kepala_desa?.nama as string) || 'Kepala Desa',
        jabatanPenandatangan: defaultSignatory?.jabatan || (villageCtx.kepala_desa?.jabatan as string) || 'Kepala Desa',
        jabatan: defaultSignatory?.jabatan || (villageCtx.kepala_desa?.jabatan as string) || 'Kepala Desa',
        tahun: now.getFullYear().toString(),
        bulan: now.getMonth() + 1,
        bulanRomawi: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][now.getMonth()],
        hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()],
      },
      // Inject custom.* from dataJson so DNA form fields resolve in templates
      custom: {
        ...customData,
        // Also spread explicit context.custom if any
        ...((context.custom as Record<string, unknown>) || {}),
      },
      // Merge incoming context (may override some fields)
      ...context,
      // Override penduduk with DB data if available
      penduduk: {
        ...(pendudukFromPermintaan || (context.penduduk as Record<string, unknown>) || {}),
        // incoming context.penduduk can still override specific fields
        ...((context.penduduk as Record<string, unknown>) || {}),
      },
      kepala_desa: {
        nama: defaultSignatory?.nama || villageCtx.kepala_desa?.nama || 'Kepala Desa',
        jabatan: defaultSignatory?.jabatan || villageCtx.kepala_desa?.jabatan || 'Kepala Desa',
        nip: (villageCtx.kepala_desa?.nip as string) || '-',
        ...((context.kepala_desa as Record<string, unknown>) || {}),
      },
      sekretaris_desa: { ...villageCtx.sekretaris_desa, ...((context.sekretaris_desa as Record<string, unknown>) || {}) },
    };

    // 6. Validate context bindings — but in LENIENT mode: custom.* fields are always OK
    // We skip strict validation for custom.* to avoid false positives on optional DNA fields
    const contentForValidation = version.content as Record<string, unknown>;
    const bindingValidation = validateContextBindings(
      contentForValidation,
      fullContext as unknown as Record<string, unknown>
    );

    // Only block on NON-custom missing bindings (custom.* missing = optional DNA field = OK)
    const hardMissingBindings = bindingValidation.missingBindings.filter(
      (b) => !b.startsWith('custom.')
    );
    if (hardMissingBindings.length > 0) {
      throw ApiError.badRequest(
        `Template gagal di-generate karena ada data yang kosong atau belum diisi: ${hardMissingBindings.join(', ')}`
      );
    }

    // 7. Process template content
    const processedContent = this.processContent(
      version.content as Record<string, unknown>,
      fullContext as unknown as Record<string, unknown>
    );

    // 8. Create document record with snapshot
    const document = await this.db.instanDokumen.create({
      data: {
        dokumenId: version.template.dokumen.id,
        permintaanId,
        templateVersionId,
        nomorDokumen,
        judul,
        dataSnapshot: fullContext as unknown as Prisma.InputJsonValue,
        contentSnapshot: processedContent as Prisma.InputJsonValue,
        status: generatePdf ? DocumentStatus.GENERATED : DocumentStatus.PENDING_SIGNATURE,
        verificationToken,
      },
    });

    // 8. Generate PDF if requested
    if (generatePdf) {
      try {
        // Auto-enrich signatureConfig with real data from DB before rendering
        const baseSignatureConfig = (version.signatureConfig as Record<string, unknown>) || {};
        const signatoryName = defaultSignatory?.nama || (villageCtx.kepala_desa?.nama as string) || '';
        const signatoryTitle = defaultSignatory?.jabatan || (villageCtx.kepala_desa?.jabatan as string) || 'Kepala Desa';
        const signatoryNip = (defaultSignatory?.nip as string) || (villageCtx.kepala_desa?.nip as string) || '';
        const desaNama = (villageCtx.desa as Record<string, unknown>)?.nama as string || '';
        const dateLocationStr = desaNama
          ? `${desaNama}, ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const enrichedSignatureConfig: Record<string, unknown> = {
          ...baseSignatureConfig,
          // Override dateLocation with real village name + current date
          dateLocation: (baseSignatureConfig.dateLocation as string) || dateLocationStr,
          // Override title text with real jabatan penandatangan
          title: {
            ...((baseSignatureConfig.title as Record<string, unknown>) || {}),
            enabled: true,
            text: ((baseSignatureConfig.title as Record<string, unknown>)?.text as string) || `${signatoryTitle},`,
          },
          // Override signatory with real data from DB
          signatory: {
            ...((baseSignatureConfig.signatory as Record<string, unknown>) || {}),
            name: ((baseSignatureConfig.signatory as Record<string, unknown>)?.name as string) || signatoryName,
            nip: ((baseSignatureConfig.signatory as Record<string, unknown>)?.nip as string) || signatoryNip,
            title: ((baseSignatureConfig.signatory as Record<string, unknown>)?.title as string) || signatoryTitle,
          },
        };

        const pdfBuffer = await this.generatePdfFromContent(
          processedContent,
          fullContext,
          kopConfig as Record<string, unknown> | undefined,
          enrichedSignatureConfig,
          version.template.blanko,
          {
            nomorDokumen,
            judul,
          }

        );

        // Store PDF with randomized UUID name in documents folder
        let storageKey: string | null = null;
        try {
          const randomSuffix = crypto.randomUUID();
          const safeSlug = nomorDokumen.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const storageFile = await this.storage.upload(pdfBuffer, {
            folder: 'documents',
            filename: `${safeSlug}-${randomSuffix}.pdf`,
            contentType: 'application/pdf',
          });
          storageKey = storageFile.key;

          // Update document with PDF URL
          await this.db.instanDokumen.update({
            where: { id: document.id },
            data: { fileUrl: storageFile.url },
          });

          // If linked to a service request, notify citizen via WhatsApp (non-blocking)
          if (permintaanId) {
            const hint = options.citizenNotificationHint;
            // Use pre-loaded hint if available, otherwise fall back to a DB fetch
            const notifyWithData = (phone: string, nomorPermintaan: string, layananNama: string) => {
              notificationService
                .notifyDocumentReady(phone, nomorPermintaan, layananNama, nomorDokumen, storageFile.url)
                .catch((waErr) => {
                  console.error(`[WA] Gagal kirim notifikasi dokumen siap untuk ${nomorDokumen}:`, waErr);
                });
            };

            if (hint?.phone && hint?.nomorPermintaan && hint?.layananNama) {
              // Fast path: use already-loaded data
              notifyWithData(hint.phone, hint.nomorPermintaan, hint.layananNama);
            } else {
              // Fallback: fetch from DB (e.g. when called from re-generate endpoint)
              this.db.permintaanLayanan
                .findUnique({
                  where: { id: permintaanId },
                  include: { penduduk: true, layanan: true },
                })
                .then((req) => {
                  const targetPhone = req?.penduduk?.telepon;
                  if (targetPhone && req) {
                    notifyWithData(targetPhone, req.nomorPermintaan, req.layanan.nama);
                  }
                })
                .catch((fetchErr) => {
                  console.error(`[WA] Gagal fetch data request untuk notifikasi dokumen siap:`, fetchErr);
                });
            }
          }

          return {
            documentId: document.id,
            nomorDokumen,
            verificationToken,
            pdfUrl: storageFile.url,
            status: document.status,
          };
        } catch (innerErr) {
          if (storageKey) {
            await this.storage.delete(storageKey).catch((delStorageErr) => {
              console.error('Failed to cleanup orphan storage file after PDF generation/DB failure:', delStorageErr);
            });
          }
          throw innerErr;
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.stack || error.message : String(error);
        console.error('PDF generation failed, marking document as REVOKED (orphan):', errMsg);
        // Mark document as REVOKED (not deleted) to maintain audit trail of the numbering sequence.
        // ISO kearsipan standard: numbers are never recycled; revoked ones remain in sequence.
        const errorNote = `[REVOKED] Gagal generate PDF: ${error instanceof Error ? error.message : String(error)}`;
        await this.db.instanDokumen.update({
          where: { id: document.id },
          data: {
            status: DocumentStatus.REVOKED,
            // Store error note in tujuan field (re-used here as audit note for revoked docs)
            tujuan: errorNote.substring(0, 250),
          },
        }).catch((updateErr) => {
          console.error('Failed to mark document as REVOKED, attempting delete as fallback:', updateErr);
          this.db.instanDokumen.delete({ where: { id: document.id } }).catch((delErr) => {
            console.error('Failed to cleanup orphan document after PDF generation failure:', delErr);
          });
        });
        throw ApiError.internal('Gagal menghasilkan PDF: ' + (error instanceof Error ? error.message : String(error)));
      }
    }

    return {
      documentId: document.id,
      nomorDokumen,
      verificationToken,
      status: document.status,
    };
  }

  /**
   * Generate PDF from content snapshot
   */
  async generatePdfFromContent(
    content: unknown,
    context: BindingContext,
    kopConfig?: Record<string, unknown>,
    signatureConfig?: Record<string, unknown>,
    blanko?: import('@prisma/client').Blanko | null,
    options?: {
      signatureImageUrl?: string;
      verificationToken?: string;
      nomorDokumen?: string;
      judul?: string;
    }
  ): Promise<Buffer> {
    const contentObj = content as Record<string, unknown>;

    // Handle margin from Blanko or use default (1 inch / ~25.4mm)
    const marginConfig = blanko?.margin && typeof blanko.margin === 'object' ? (blanko.margin as Record<string, unknown>) : undefined;
    let margins = { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 };
    
    if (marginConfig) {
      margins = {
        top: Number(marginConfig.top) || 25.4,
        right: Number(marginConfig.right) || 25.4,
        bottom: Number(marginConfig.bottom) || 25.4,
        left: Number(marginConfig.left) || 25.4,
      };
    }

    // Determine orientation based on Blanko layout or default to portrait
    let orientation = 'portrait';
    const layoutObj = blanko?.layout && typeof blanko.layout === 'object' ? (blanko.layout as Record<string, unknown>) : undefined;
    if (layoutObj && typeof layoutObj.orientation === 'string') {
      orientation = layoutObj.orientation;
    }

    // Setup PDF rendering context
    const pdfOptions = {
      size: blanko?.paperSize || 'F4',
      margin: margins,
      layout: orientation as 'portrait' | 'landscape',
    };
    
    // Add Blanko's elements (usually absolute positioned layout elements)
    const blankoElements = layoutObj?.elements && Array.isArray(layoutObj.elements) ? this.extractAndProcessElements(
      layoutObj.elements as Element[],
      context as unknown as Record<string, unknown>
    ) : [];

    // Extract and process main content elements
    const elements = this.extractAndProcessElements(
      contentObj.elements as Element[] || [],
      context as unknown as Record<string, unknown>
    );
    const combinedElements = [...blankoElements, ...elements];

    // Merge signature config with TTE image and QR verification URL
    const mergedSignatureConfig = this.mergeSignatureConfig(
      signatureConfig as Record<string, unknown>,
      options?.signatureImageUrl,
      options?.verificationToken
    );

    // Build render options
    const renderOptions: RenderOptions = {
      layout: {
        pageSize: (pdfOptions.size as 'A4' | 'FOLIO' | 'LETTER' | 'LEGAL') || 'A4',
        orientation: (pdfOptions.layout as 'portrait' | 'landscape') || 'portrait',
        margins: (pdfOptions.margin as { top: number; right: number; bottom: number; left: number }) || {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        },
      },
      kop: kopConfig as RenderOptions['kop'],
      elements: combinedElements,
      signature: mergedSignatureConfig,
      pageNumber: {
        enabled: true,
        format: 'Page {page} of {total}',
        position: 'bottom-center',
      },
    };

    // Generate PDF with TTE and QR
    // Note: QR overlay in PDF requires post-processing, currently handled in signature config
    const pdfBuffer = await generatePdf(renderOptions);

    return pdfBuffer;
  }

  /**
   * Merge signature config with TTE image URL and QR verification URL
   */
  private mergeSignatureConfig(
    signatureConfig?: Record<string, unknown>,
    signatureImageUrl?: string,
    verificationToken?: string
  ): RenderOptions['signature'] {
    if (!signatureConfig && !signatureImageUrl && !verificationToken) {
      return undefined;
    }

    const merged = signatureConfig ? { ...signatureConfig } : {};

    if (signatureImageUrl) {
      merged.signatureImage = {
        enabled: true,
        url: signatureImageUrl,
        width: 100,
        height: 40,
      };
    }

    if (verificationToken) {
      const webUrl = config.publicWebUrl;
      merged.qrCode = {
        enabled: true,
        data: `${webUrl.replace(/\/+$/, '')}/verifikasi/${verificationToken}`,
        size: 22,
      };
    }

    return merged as RenderOptions['signature'];
  }

  /**
   * Validate template for document generation
   */
  async validateForGeneration(templateVersionId: bigint): Promise<TemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const version = await this.db.templateVersion.findUnique({
      where: { id: templateVersionId },
      include: {
        template: {
          include: {
            dokumen: { include: { layanan: true } },
          },
        },
      },
    });

    if (!version) {
      errors.push('Template versi tidak ditemukan');
      return { valid: false, errors, warnings };
    }

    if (version.status !== VersionStatus.PUBLISHED) {
      errors.push('Template harus dalam status PUBLISHED');
    }

    // Validate bindings
    const content = version.content as Record<string, unknown>;
    const bindingValidation = validateTemplateBindings(content);
    if (!bindingValidation.valid) {
      errors.push(...bindingValidation.errors.map((e) => `Binding: ${e}`));
    }

    // Validate table data sources
    const tableErrors = this.validateTables(content);
    errors.push(...tableErrors.map((e) => `Table: ${e}`));

    // Check kop config
    if (version.kopConfig) {
      const kopValidation = validateTemplateBindings(version.kopConfig as Record<string, unknown>);
      if (!kopValidation.valid) {
        errors.push(...kopValidation.errors.map((e) => `Kop: ${e}`));
      }
    }

    // Check signature config
    if (version.signatureConfig) {
      const sigValidation = validateTemplateBindings(version.signatureConfig as Record<string, unknown>);
      if (!sigValidation.valid) {
        errors.push(...sigValidation.errors.map((e) => `Signature: ${e}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================
  // Private Methods
  // ============================================================

  private processContent(
    content: Record<string, unknown>,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    // Resolve all bindings
    let processed = resolveBinding(content, context) as Record<string, unknown>;

    // Process conditionals
    processed = this.processConditionals(processed, context);

    // Process repeaters/tables
    processed = this.processRepeaters(processed, context);

    return processed;
  }

  private processConditionals(
    content: Record<string, unknown>,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const processed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          processed[key] = value.map((item) => {
            if (typeof item === 'object' && item !== null) {
              return this.processConditionals(item as Record<string, unknown>, context);
            }
            return item;
          });
        } else {
          // Check for conditional properties
          const val = value as Record<string, unknown>;
          if (val._condition) {
            const condition = String(val._condition);
            const visible = evaluateConditionString(condition, context);
            if (!visible) {
              continue;
            }
          }
          processed[key] = this.processConditionals(val, context);
        }
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  private processRepeaters(
    content: Record<string, unknown>,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const processed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;

        // Check if this is a repeater
        if (obj._dataSource) {
          const dataSource = String(obj._dataSource);
          const data = resolveArray(dataSource, context);

          if (Array.isArray(data) && data.length > 0) {
            const template = obj._template as string;
            if (template) {
              // Process each row
              const rows = data.map((row) => {
                const rowContext = { ...context, item: row, row };
                return resolveBinding(JSON.parse(template), rowContext);
              });
              processed[key] = rows;
              continue;
            }
          } else {
            processed[key] = [];
            continue;
          }
        }

        processed[key] = this.processRepeaters(obj, context);
      } else if (Array.isArray(value)) {
        processed[key] = value.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return this.processRepeaters(item as Record<string, unknown>, context);
          }
          return item;
        });
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  private extractAndProcessElements(
    elements: Element[],
    context: Record<string, unknown>
  ): Element[] {
    const processed: Element[] = [];

    for (const element of elements) {
      // Check conditional visibility
      if ('visible' in element && element.visible === false) {
        continue;
      }

      // Check condition binding
      if ('condition' in element && element.condition) {
        const visible = evaluateConditionString(element.condition as string, context);
        if (!visible) {
          continue;
        }
      }

      // Process table elements
      if (element.type === 'table') {
        const tableElement = element as {
          type: 'table';
          dataSource?: string;
          columns?: Array<{ binding?: string }>;
        };

        if (tableElement.dataSource) {
          const data = resolveArray(tableElement.dataSource, context);
          if (Array.isArray(data) && tableElement.columns) {
            // Convert data to row strings for each column
            const rows: Array<Record<string, string>> = data.map((row) => {
              const rowData: Record<string, string> = {};
              const columns = tableElement.columns ?? [];
              for (const col of columns) {
                if (col.binding) {
                  // Resolve binding in row context
                  const value = this.resolveInContext(col.binding, { ...context, item: row, row });
                  rowData[col.binding] = String(value ?? '');
                }
              }
              return rowData;
            });

            processed.push({
              ...element,
              rows,
            } as Element);
            continue;
          }
        }
      }

      // For field elements, resolve the value
      if (element.type === 'field') {
        const fieldElement = element as {
          type: 'field';
          binding?: string;
          value?: string;
        };

        if (fieldElement.binding && fieldElement.value === undefined) {
          const value = this.resolveInContext(fieldElement.binding, context);
          processed.push({
            ...element,
            value: String(value ?? ''),
          } as Element);
          continue;
        }
      }

      processed.push(element);
    }

    return processed;
  }

  private resolveInContext(path: string, context: Record<string, unknown>): unknown {
    // Simple path resolution
    const parts = path.split('.');
    let current = context;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part] as Record<string, unknown>;
    }

    return current;
  }

  private validateTables(content: Record<string, unknown>): string[] {
    const errors: string[] = [];

    function checkElement(element: unknown): void {
      if (!element || typeof element !== 'object') return;

      const el = element as Record<string, unknown>;

      if (el.type === 'table') {
        if (!el.dataSource) {
          errors.push('Table missing dataSource');
          return;
        }

        const validation = validateDataSource(el.dataSource as string);
        if (!validation.valid) {
          errors.push(validation.error || 'Invalid data source');
        }

        if (Array.isArray(el.columns)) {
          const colValidation = validateTableConfig({
            dataSource: el.dataSource as string,
            columns: el.columns as Array<{ header?: string; binding?: string }>,
          });

          if (!colValidation.valid) {
            errors.push(...colValidation.errors);
          }
        }
      }

      // Recursively check nested elements
      if (Array.isArray(el.elements)) {
        for (const child of el.elements) {
          checkElement(child);
        }
      }

      if (Array.isArray(el.children)) {
        for (const child of el.children) {
          checkElement(child);
        }
      }
    }

    checkElement(content);
    return errors;
  }

  // ============================================================
  // High-Level: Generate Blanko from DB PermintaanLayanan
  // ============================================================

  /**
   * Generate a blanko PDF document for a given PermintaanLayanan ID.
   *
   * This is the main "connect DB to blanko" method:
   *  1. Load permintaan + penduduk + layanan + template chain
   *  2. Find the PUBLISHED template version for the service
   *  3. Build full context from real DB fields (penduduk, desa, kepala_desa, custom DNA)
   *  4. Call generateDocument() to produce and store the PDF
   */
  async generateDocumentForPermintaan(
    permintaanId: bigint,
    options?: { overrideContext?: Partial<BindingContext> }
  ): Promise<DocumentGenerationResult> {
    // 1. Load the full permintaan with all relations
    const permintaan = await this.db.permintaanLayanan.findUnique({
      where: { id: permintaanId },
      include: {
        penduduk: {
          include: {
            gubug: true,
            rwRel: true,
            rtRel: true,
          }
        },
        layanan: {
          include: {
            dokumen: {
              include: {
                templates: {
                  include: {
                    versions: {
                      where: { status: 'PUBLISHED' },
                      orderBy: { version: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!permintaan) {
      throw ApiError.notFound('Permintaan layanan tidak ditemukan');
    }

    // 2. Find the PUBLISHED template version
    const dokumenList = permintaan.layanan.dokumen;
    if (!dokumenList || dokumenList.length === 0) {
      throw ApiError.badRequest(
        `Layanan "${permintaan.layanan.nama}" belum memiliki template dokumen. Hubungi administrator.`
      );
    }

    let templateVersion: { id: bigint } | null = null;
    for (const dok of dokumenList) {
      for (const tmpl of dok.templates) {
        if (tmpl.versions.length > 0) {
          templateVersion = tmpl.versions[0];
          break;
        }
      }
      if (templateVersion) break;
    }

    if (!templateVersion) {
      throw ApiError.badRequest(
        `Template surat untuk layanan "${permintaan.layanan.nama}" belum dipublikasi. Hubungi administrator.`
      );
    }

    // 3. Build context from DB data
    //    - penduduk.* comes from the actual Penduduk record
    //    - custom.* comes from dataJson (form DNA submitted by the warga)
    //    - desa/kepala_desa/system come from identitas desa (resolved inside generateDocument)
    const pd = permintaan.penduduk as Record<string, unknown> | null;
    const pendudukCtx: Record<string, unknown> = pd
      ? {
          nik: pd.nik,
          namaLengkap: pd.namaLengkap || pd.nama_lengkap,
          nama_lengkap: pd.namaLengkap || pd.nama_lengkap,
          tempatLahir: pd.tempatLahir || pd.tempat_lahir,
          tempat_lahir: pd.tempatLahir || pd.tempat_lahir,
          tanggalLahir: pd.tanggalLahir || pd.tanggal_lahir,
          tanggal_lahir: pd.tanggalLahir || pd.tanggal_lahir,
          jenisKelamin: pd.jenisKelamin || pd.jenis_kelamin,
          jenis_kelamin: pd.jenisKelamin || pd.jenis_kelamin,
          agama: pd.agama,
          statusPerkawinan: pd.statusPerkawinan || pd.status_perkawinan,
          status_perkawinan: pd.statusPerkawinan || pd.status_perkawinan,
          pekerjaan: pd.pekerjaan,
          pendidikan: pd.pendidikan,
          golDarah: pd.golDarah || pd.gol_darah,
          gol_darah: pd.golDarah || pd.gol_darah,
          alamat: pd.alamat,
          rt: pd.rt || (pd.rtRel as any)?.nama || '-',
          rw: pd.rw || (pd.rwRel as any)?.nama || '-',
          dusun: pd.dusun || (pd.gubug as any)?.nama || '-',
          kewarganegaraan: pd.kewarganegaraan || 'WNI',
          wargaNegara: pd.wargaNegara || pd.kewarganegaraan || 'Indonesia',
          telepon: pd.telepon,
          email: pd.email,
        }
      : {};

    const customCtx = (permintaan.dataJson as Record<string, unknown>) || {};

    const context: BindingContext = {
      penduduk: pendudukCtx,
      custom: customCtx,
      ...((options?.overrideContext as BindingContext) || {}),
    };

    // 4. Generate (and store) the document, passing citizen data as a hint to avoid re-fetching
    const targetPhone = (permintaan.penduduk as any)?.telepon;
    return this.generateDocument({
      templateVersionId: templateVersion.id,
      context,
      judul: permintaan.layanan.nama,
      permintaanId,
      generatePdf: true,
      citizenNotificationHint: {
        phone: targetPhone || null,
        nomorPermintaan: permintaan.nomorPermintaan,
        layananNama: permintaan.layanan.nama,
      },
    });
  }
}

// ============================================================
// Export
// ============================================================

export const documentEngineService = new DocumentEngineService();

