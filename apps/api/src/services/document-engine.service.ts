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
import { getStorageProvider } from './storage/index.js';
import type { IStorageProvider } from './storage/index.js';
import { getInstanceContext } from '../config/instance.js';

// ============================================================
// Types
// ============================================================

export interface DocumentGenerationOptions {
  templateVersionId: bigint;
  context: BindingContext;
  judul: string;
  permintaanId?: bigint;
  generatePdf?: boolean;
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

    // 2. Get desaId from instance context (primary) or template relation (fallback)
    const { desaId: ctxDesaId } = getInstanceContext();
    const desaId = ctxDesaId ?? (await this.getDesaId(context, version.template.dokumen.layanan.desaId));

    // 3. Generate document number
    const nomorDokumen = await generateDocumentNumber(
      this.db,
      desaId,
      version.template.dokumen.kode
    );

    // 4. Generate verification token
    const verificationToken = generateVerificationToken();

    // 5. Load default penanda tangan for the village
    let signatureImageUrl: string | undefined;
    const defaultSignatory = await this.db.penandaTangan.findFirst({
      where: { desaId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (defaultSignatory?.tandaTanganUrl) {
      signatureImageUrl = defaultSignatory.tandaTanganUrl;
    }

    // 6. Validate context bindings
    const { validateContextBindings } = await import('../utils/binding-resolver.js');
    const bindingValidation = validateContextBindings(
      version.content as Record<string, unknown>,
      context as unknown as Record<string, unknown>
    );

    if (!bindingValidation.valid) {
      throw ApiError.badRequest(
        `Template gagal di-generate karena ada data yang kosong atau belum diisi: ${bindingValidation.missingBindings.join(', ')}`
      );
    }

    // 7. Process template content
    const processedContent = this.processContent(
      version.content as Record<string, unknown>,
      context as unknown as Record<string, unknown>
    );

    // 8. Create document record with snapshot
    const document = await this.db.instanDokumen.create({
      data: {
        dokumenId: version.template.dokumen.id,
        permintaanId,
        templateVersionId,
        nomorDokumen,
        judul,
        dataSnapshot: context as unknown as Prisma.InputJsonValue,
        contentSnapshot: processedContent as Prisma.InputJsonValue,
        status: generatePdf ? DocumentStatus.GENERATED : DocumentStatus.PENDING_SIGNATURE,
        verificationToken,
      },
    });

    // 8. Generate PDF if requested
    if (generatePdf) {
      try {
        const pdfBuffer = await this.generatePdfFromContent(
          processedContent,
          context,
          version.kopConfig as Record<string, unknown> | undefined,
          version.signatureConfig as Record<string, unknown> | undefined,
          version.template.blanko,
          {
            signatureImageUrl,
            verificationToken,
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
            this.db.permintaanLayanan
              .findUnique({
                where: { id: permintaanId },
                include: { penduduk: true, layanan: true },
              })
              .then((req) => {
                const targetPhone = req?.penduduk?.telepon;
                if (targetPhone && req) {
                  notificationService
                    .notifyDocumentReady(
                      targetPhone,
                      req.nomorPermintaan,
                      req.layanan.nama,
                      nomorDokumen,
                      storageFile.url
                    )
                    .catch((waErr) => {
                      console.error(`Failed to send WhatsApp document ready notification for ${nomorDokumen}:`, waErr);
                    });
                }
              })
              .catch((fetchErr) => {
                console.error(`Failed to fetch request for document ready notification:`, fetchErr);
              });
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
        console.error('PDF generation failed, cleaning up created document record:', error);
        await this.db.instanDokumen.delete({ where: { id: document.id } }).catch((delErr) => {
          console.error('Failed to cleanup orphan document after PDF generation failure:', delErr);
        });
        throw ApiError.internal('Gagal menghasilkan PDF');
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

    // Merge signature config with TTE image
    const mergedSignatureConfig = this.mergeSignatureConfig(
      signatureConfig as Record<string, unknown>,
      options?.signatureImageUrl
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
   * Merge signature config with TTE image URL
   */
  private mergeSignatureConfig(
    signatureConfig?: Record<string, unknown>,
    signatureImageUrl?: string
  ): RenderOptions['signature'] {
    if (!signatureConfig && !signatureImageUrl) {
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

  private async getDesaId(context: BindingContext, fallback: bigint): Promise<bigint> {
    // Try to get from context
    if (context.desa && typeof context.desa === 'object') {
      const desa = context.desa as Record<string, unknown>;
      if (desa.id) {
        return BigInt(String(desa.id));
      }
    }
    return fallback;
  }

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

        if (fieldElement.binding) {
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
}

// ============================================================
// Export
// ============================================================

export const documentEngineService = new DocumentEngineService();

