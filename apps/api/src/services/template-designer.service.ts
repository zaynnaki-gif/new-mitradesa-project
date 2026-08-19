/**
 * Template Designer Service
 *
 * Handles template preview, validation, and designer operations.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import {
  validateTemplateBindings,
  resolveBinding,
  getSampleData,
  BindingContext,
} from '../utils/binding-resolver.js';
import {
  getAvailableBindings,
  getBindingsByCategory,
  getAvailableFormatters,
} from '../utils/formatter-registry.js';
import { validateFormatTemplate } from '../utils/numbering.js';
import { ApiError } from '../utils/response.js';

// ============================================================
// Types
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface PreviewResult {
  html: string;
  bindings: string[];
  resolvedData: BindingContext;
}

// ============================================================
// Template Designer Service
// ============================================================

export class TemplateDesignerService {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db || prisma;
  }

  /**
   * Validate a template version
   */
  async validateTemplate(templateVersionId: bigint): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

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
      errors.push({
        field: 'templateVersionId',
        message: 'Template versi tidak ditemukan',
        code: 'NOT_FOUND',
      });
      return { valid: false, errors, warnings };
    }

    const content = version.content as Record<string, unknown>;

    // 1. Validate bindings in content
    const bindingValidation = validateTemplateBindings(content);
    if (!bindingValidation.valid) {
      for (const error of bindingValidation.errors) {
        errors.push({
          field: 'content',
          message: `Binding tidak valid: ${error}`,
          code: 'INVALID_BINDING',
        });
      }
    }

    // 2. Validate kop config if present
    if (version.kopConfig) {
      const kopConfig = version.kopConfig as Record<string, unknown>;
      // Check for invalid bindings in kop config
      const kopValidation = validateTemplateBindings(kopConfig);
      if (!kopValidation.valid) {
        for (const error of kopValidation.errors) {
          errors.push({
            field: 'kopConfig',
            message: `Binding kop tidak valid: ${error}`,
            code: 'INVALID_KOP_BINDING',
          });
        }
      }
    }

    // 3. Validate signature config if present
    if (version.signatureConfig) {
      const signatureConfig = version.signatureConfig as Record<string, unknown>;
      const sigValidation = validateTemplateBindings(signatureConfig);
      if (!sigValidation.valid) {
        for (const error of sigValidation.errors) {
          errors.push({
            field: 'signatureConfig',
            message: `Binding signature tidak valid: ${error}`,
            code: 'INVALID_SIGNATURE_BINDING',
          });
        }
      }
    }

    // 4. Check if elements exist
    const elements = this.extractElements(content);
    if (elements.length === 0) {
      warnings.push({
        field: 'content',
        message: 'Template tidak memiliki elemen',
        code: 'EMPTY_TEMPLATE',
      });
    }

    // 5. Check for required sections
    const hasBody = this.hasSection(content, 'body');
    if (!hasBody) {
      warnings.push({
        field: 'content',
        message: 'Template tidak memiliki section body',
        code: 'MISSING_BODY',
      });
    }

    // 6. Validate numbering config for the service
    const layanan = version.template.dokumen.layanan;
    const nomorConfig = await this.db.nomorSuratConfig.findUnique({
      where: { layananId: layanan.id },
    });

    if (nomorConfig) {
      const formatValidation = validateFormatTemplate(nomorConfig.formatTemplate);
      if (!formatValidation.valid) {
        errors.push({
          field: 'nomorSuratConfig',
          message: `Format nomor surat tidak valid: ${formatValidation.error}`,
          code: 'INVALID_NUMBERING',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate preview with sample data
   */
  async generatePreview(
    templateVersionId: bigint,
    customData?: Record<string, unknown>
  ): Promise<PreviewResult> {
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
      throw ApiError.notFound('Template versi tidak ditemukan');
    }

    if (version.status !== 'PUBLISHED' && version.status !== 'DRAFT') {
      throw ApiError.badRequest('Template harus dalam status DRAFT atau PUBLISHED');
    }

    // Get sample data and merge with custom data
    const sampleData = getSampleData();
    const mergedData = this.mergeData(sampleData, customData || {});

    // Resolve bindings in content
    const content = version.content as Record<string, unknown>;
    const resolvedContent = resolveBinding(content, mergedData as unknown as Record<string, unknown>);

    // Extract bindings used
    const bindings = this.extractBindings(content);

    // Generate HTML preview
    const html = this.renderToHtml(resolvedContent, version.kopConfig as Record<string, unknown>);

    return {
      html,
      bindings,
      resolvedData: mergedData,
    };
  }

  /**
   * Get field registry for template designer
   */
  getFieldRegistry(): {
    bindings: ReturnType<typeof getAvailableBindings>;
    bindingsByCategory: ReturnType<typeof getBindingsByCategory>;
    formatters: ReturnType<typeof getAvailableFormatters>;
  } {
    return {
      bindings: getAvailableBindings(),
      bindingsByCategory: getBindingsByCategory(),
      formatters: getAvailableFormatters(),
    };
  }

  /**
   * Get numbering tokens for template
   */
  async getNumberingTokens(layananId: bigint): Promise<{
    tokens: NumberingToken[];
    currentConfig?: { formatTemplate: string };
  }> {
    const config = await this.db.nomorSuratConfig.findUnique({
      where: { layananId },
    });

    const tokens: NumberingToken[] = [
      { token: '{seq}', label: 'Nomor Urut', description: 'Nomor urut dokumen (auto-increment)', example: '001' },
      { token: '{seq:3}', label: 'Nomor 3 Digit', description: 'Nomor dengan padding 3 digit', example: '001' },
      { token: '{seq:5}', label: 'Nomor 5 Digit', description: 'Nomor dengan padding 5 digit', example: '00001' },
      { token: '{tahun}', label: 'Tahun', description: 'Tahun saat ini (4 digit)', example: '2026' },
      { token: '{bulan}', label: 'Bulan', description: 'Bulan saat ini (01-12)', example: '08' },
      { token: '{bulanRomawi}', label: 'Bulan Romawi', description: 'Bulan dalam angka Romawi', example: 'VIII' },
      { token: '{kode}', label: 'Kode Dokumen', description: 'Kode dokumen layanan', example: 'SKD' },
      { token: '{kades}', label: 'Singkatan Kades', description: 'Singkatan nama kepala desa', example: 'HZA' },
      { token: '{desa}', label: 'Singkatan Desa', description: 'Singkatan nama desa', example: 'SRM' },
    ];

    return {
      tokens,
      currentConfig: config ? { formatTemplate: config.formatTemplate } : undefined,
    };
  }

  /**
   * Create a new template with initial version
   */
  async createTemplateWithVersion(data: {
    dokumenId: bigint;
    nama: string;
    slug: string;
    deskripsi?: string;
    content?: Record<string, unknown>;
    kopConfig?: Record<string, unknown>;
    signatureConfig?: Record<string, unknown>;
    createdBy: bigint;
  }): Promise<{ template: Prisma.TemplateSuratGetPayload<object>; version: Prisma.TemplateVersionGetPayload<object> }> {
    // Check if dokumen exists
    const dokumen = await this.db.dokumenDefinition.findUnique({
      where: { id: data.dokumenId },
    });

    if (!dokumen) {
      throw ApiError.notFound('Dokumen tidak ditemukan');
    }

    // Check slug uniqueness
    const existingSlug = await this.db.templateSurat.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw ApiError.conflict('Slug template sudah digunakan');
    }

    // Create template and initial version in transaction
    const result = await this.db.$transaction(async (tx) => {
      // Create template
      const template = await tx.templateSurat.create({
        data: {
          dokumenId: data.dokumenId,
          nama: data.nama,
          slug: data.slug,
          deskripsi: data.deskripsi,
        },
      });

      // Create initial version
      const defaultContent = data.content || this.getDefaultContent(data.nama);
      const version = await tx.templateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          content: defaultContent as Prisma.JsonObject,
          kopConfig: (data.kopConfig || this.getDefaultKopConfig()) as Prisma.JsonObject,
          signatureConfig: (data.signatureConfig || this.getDefaultSignatureConfig()) as Prisma.JsonObject,
          status: 'DRAFT',
          createdBy: data.createdBy,
        },
      });

      return { template, version };
    });

    return result;
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(
    templateId: bigint,
    newNama: string,
    newSlug: string,
    createdBy: bigint
  ): Promise<{ template: Prisma.TemplateSuratGetPayload<object>; version: Prisma.TemplateVersionGetPayload<object> }> {
    const original = await this.db.templateSurat.findUnique({
      where: { id: templateId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!original) {
      throw ApiError.notFound('Template tidak ditemukan');
    }

    const latestVersion = original.versions[0];
    if (!latestVersion) {
      throw ApiError.notFound('Versi template tidak ditemukan');
    }

    return this.createTemplateWithVersion({
      dokumenId: original.dokumenId,
      nama: newNama,
      slug: newSlug,
      deskripsi: original.deskripsi || undefined,
      content: latestVersion.content as Record<string, unknown>,
      kopConfig: latestVersion.kopConfig as Record<string, unknown>,
      signatureConfig: latestVersion.signatureConfig as Record<string, unknown>,
      createdBy,
    });
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private extractElements(content: Record<string, unknown>): unknown[] {
    const elements: unknown[] = [];

    // Check new flat elements array
    if (Array.isArray(content.elements)) {
      elements.push(...content.elements);
    }

    // Check legacy sections
    if (content.sections) {
      const sections = content.sections as Record<string, unknown>;
      for (const key of ['header', 'body', 'footer']) {
        if (sections[key] && typeof sections[key] === 'object') {
          const section = sections[key] as Record<string, unknown>;
          if (Array.isArray(section.elements)) {
            elements.push(...section.elements);
          }
        }
      }
    }

    return elements;
  }

  private hasSection(content: Record<string, unknown>, sectionName: string): boolean {
    if (content.sections) {
      const sections = content.sections as Record<string, unknown>;
      return sectionName in sections;
    }
    return false;
  }

  private extractBindings(content: Record<string, unknown>): string[] {
    const bindings: string[] = [];

    function traverse(value: unknown): void {
      if (typeof value === 'string') {
        const matches = value.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          for (const match of matches) {
            const inner = match.replace(/\{\{|\}\}/g, '');
            const path = inner.split('|')[0].trim();
            if (!bindings.includes(path)) {
              bindings.push(path);
            }
          }
        }
      } else if (Array.isArray(value)) {
        for (const item of value) {
          traverse(item);
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [, v] of Object.entries(value)) {
          traverse(v);
        }
      }
    }

    traverse(content);
    return bindings;
  }

  private mergeData(
    base: BindingContext,
    custom: Record<string, unknown>
  ): BindingContext {
    const merged = { ...base };

    for (const [key, value] of Object.entries(custom)) {
      if (key in merged) {
        merged[key as keyof BindingContext] = {
          ...merged[key as keyof BindingContext],
          ...(value as Record<string, unknown>),
        };
      } else {
        (merged as Record<string, unknown>)[key] = value;
      }
    }

    return merged;
  }

  private renderToHtml(content: unknown, kopConfig?: Record<string, unknown>): string {
    // Simple HTML renderer for preview
    // In production, this would use a proper PDF/HTML renderer
    const htmlParts: string[] = [];

    // Header with kop
    if (kopConfig) {
      htmlParts.push(this.renderKop(kopConfig));
    }

    // Content elements
    const elements = this.extractElements(content as Record<string, unknown>);
    for (const element of elements) {
      htmlParts.push(this.renderElement(element));
    }

    return htmlParts.join('\n');
  }

  private renderKop(config: Record<string, unknown>, context?: { desa?: Record<string, unknown> }): string {
    const lines: string[] = [];
    const institutionNames = (config.institutionNames as Record<string, { visible: boolean; text?: string }>) || {};

    // Get dynamic village data from context if available
    const desa = context?.desa || {};
    const namaDesa = (desa.nama as string) || 'NAMA DESA';
    const kecamatan = (desa.kecamatan as string) || 'KECAMATAN';
    const kabupaten = (desa.kabupaten as string) || 'KABUPATEN';
    const alamat = (desa.alamat as string) || 'ALAMAT KANTOR DESA';

    // Institution names - use dynamic data when available
    if (institutionNames.pemda?.visible) {
      lines.push(`<div class="kop-pemda">PEMERINTAH KABUPATEN ${kabupaten.toUpperCase()}</div>`);
    }
    if (institutionNames.kecamatan?.visible) {
      lines.push(`<div class="kop-kecamatan">KECAMATAN ${kecamatan.toUpperCase()}</div>`);
    }
    if (institutionNames.desa?.visible) {
      lines.push(`<div class="kop-desa">DESA ${namaDesa.toUpperCase()}</div>`);
    }

    // Address block
    const addressBlock = (config.addressBlock as Record<string, unknown>) || {};
    if (addressBlock.enabled) {
      lines.push(`<div class="kop-address">${alamat}</div>`);
    }

    return `<div class="kop">${lines.join('')}</div>`;
  }

  private renderElement(element: unknown): string {
    if (!element || typeof element !== 'object') return '';

    const el = element as Record<string, unknown>;
    const type = el.type as string;

    switch (type) {
      case 'text':
        return `<p class="element-text">${el.content || ''}</p>`;
      case 'field':
        return `<p class="element-field"><span class="field-label">${el.label || ''}</span> <span class="field-value">${el.binding || ''}</span></p>`;
      case 'divider':
        return '<hr class="element-divider" />';
      case 'spacer':
        return `<div class="element-spacer" style="height: ${el.height || 20}px"></div>`;
      case 'page_break':
        return '<div class="page-break">--- Page Break ---</div>';
      default:
        return `<div class="element-unknown">Unknown element: ${type}</div>`;
    }
  }

  private getDefaultContent(name: string): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
      metadata: {
        name,
        description: '',
        createdAt: now,
        version: 1,
      },
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        },
      },
      elements: [
        {
          id: crypto.randomUUID(),
          type: 'text',
          content: 'Yang bertanda tangan di bawah ini:',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'left',
          lineHeight: 1.5,
          margin: { top: 0, right: 0, bottom: 10, left: 0 },
        },
        {
          id: crypto.randomUUID(),
          type: 'field',
          binding: 'kepala_desa.nama',
          label: 'Nama',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'left',
          margin: { top: 0, right: 0, bottom: 5, left: 0 },
        },
      ],
    };
  }

  private getDefaultKopConfig(): Record<string, unknown> {
    return {
      headerBlock: {
        enabled: true,
        align: 'center',
        spacing: { betweenLines: 4, afterHeader: 8 },
      },
      logoDesa: { visible: true, position: 'left', size: '60px', source: 'desa_config' },
      logoKabupaten: { visible: true, position: 'right', size: '60px', source: 'kabupaten_config' },
      institutionNames: {
        pemda: { visible: true, source: 'auto' },
        kecamatan: { visible: true, source: 'auto' },
        desa: { visible: true, source: 'auto' },
      },
      addressBlock: {
        enabled: true,
        fields: [
          { label: 'Alamat', source: 'desa.alamat', showLabel: false },
          { label: 'Telepon', source: 'desa.telepon', showLabel: false },
        ],
      },
      divider: { style: 'double', thickness: 2, spacing: { before: 8, after: 8 } },
      bodyMarginTop: 15,
    };
  }

  private getDefaultSignatureConfig(): Record<string, unknown> {
    return {
      title: {
        enabled: true,
        text: '{{kepala_desa.jabatan}}',  // Dynamic binding - will be resolved from context
        align: 'right',
        marginBottom: 30,
      },
      signatory: {
        nameBinding: 'kepala_desa.nama',
        titleText: 'Kepala Desa',
        alignment: 'right',
      },
      signatureImage: {
        enabled: false,
        source: 'generated',
        width: '100px',
        height: '50px',
        marginBottom: 5,
      },
      qrCode: {
        enabled: true,
        position: 'left',
        size: '60px',
        marginTop: 20,
      },
      signatureSpace: { height: 60 },
    };
  }
}

interface NumberingToken {
  token: string;
  label: string;
  description: string;
  example: string;
}

// Export singleton instance
export const templateDesignerService = new TemplateDesignerService();
