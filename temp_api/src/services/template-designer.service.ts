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
    const html = this.renderToHtml(
      resolvedContent,
      version.kopConfig as Record<string, unknown>,
      version.signatureConfig as Record<string, unknown>
    );

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

  private renderToHtml(
    content: unknown,
    kopConfig?: Record<string, unknown>,
    signatureConfig?: Record<string, unknown>
  ): string {
    const htmlParts: string[] = [];

    // Header with kop
    if (kopConfig) {
      htmlParts.push(this.renderKop(kopConfig));
    }

    htmlParts.push('<div class="document-body" style="margin-top: 14px; font-family: \'Times New Roman\', Times, serif; font-size: 11pt; line-height: 1.5; color: #111827;">');

    // Content elements
    const elements = this.extractElements(content as Record<string, unknown>);
    for (const element of elements) {
      htmlParts.push(this.renderElement(element));
    }

    htmlParts.push('</div>');

    // Signature Block
    if (signatureConfig) {
      htmlParts.push(this.renderSignatureHtml(signatureConfig));
    }

    return htmlParts.join('\n');
  }

  private renderKop(config: Record<string, unknown>, context?: { desa?: Record<string, unknown> }): string {
    const institutionNames = (config.institutionNames as Record<string, { visible: boolean; text?: string }>) || {};
    const desa = context?.desa || {};
    const namaDesa = (desa.nama as string) || 'SERUNI MUMBUL';
    const kecamatan = (desa.kecamatan as string) || 'PRINGGABAYA';
    const kabupaten = (desa.kabupaten as string) || 'LOMBOK TIMUR';

    const pemdaText = institutionNames.pemda?.text || `PEMERINTAH KABUPATEN ${kabupaten.toUpperCase()}`;
    const kecText = institutionNames.kecamatan?.text || `KECAMATAN ${kecamatan.toUpperCase()}`;
    const desaText = institutionNames.desa?.text || `DESA ${namaDesa.toUpperCase()}`;

    // Address block — read from config
    const addressBlock = config.addressBlock as Record<string, unknown> | undefined;
    const addressEnabled = addressBlock?.enabled !== false;
    const addressLines = (addressBlock?.lines as string[] | undefined) || [];
    const addressHtml = addressEnabled && addressLines.length > 0
      ? addressLines.filter(l => l?.trim()).map(l =>
          `<div style="font-size: 9.5px; color: #4b5563; margin-top: 2px;">${l}</div>`
        ).join('')
      : '';

    // Divider — read style from config
    const dividerStyle = (config.divider as Record<string, unknown> | undefined)?.style as string | undefined;
    let dividerHtml: string;
    if (!dividerStyle || dividerStyle === 'double') {
      dividerHtml = `
        <div style="margin-top: 8px; border-bottom: 3px double #000; padding-bottom: 2px;"></div>`;
    } else if (dividerStyle === 'single') {
      dividerHtml = `<div style="margin-top: 8px; border-bottom: 1.5px solid #000;"></div>`;
    } else {
      dividerHtml = '<div style="margin-top: 8px;"></div>';
    }

    return `
      <div class="kop" style="text-align: center; margin-bottom: 12px; font-family: 'Times New Roman', Times, serif; position: relative; padding: 4px 10px;">
        <div style="font-size: 13px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #111;">${pemdaText}</div>
        <div style="font-size: 14px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #111;">${kecText}</div>
        <div style="font-size: 16px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #000;">${desaText}</div>
        ${addressHtml}
        ${dividerHtml}
      </div>
    `;
  }

  private renderSignatureHtml(config: Record<string, unknown>): string {
    const mode = config.mode || 'online_tte';
    const isOffline = mode === 'offline_physical';
    // Read dateLocation from config, fallback to blank template
    const dateLocation = (config.dateLocation as string) || 'Seruni Mumbul, ......................... 20...';

    if (isOffline) {
      const applicantTitle = (config.applicantTitle as string) || 'Yang Menyatakan / Pemohon,';
      const applicantNameRaw = (config.applicantName as string) || '';
      const title = (config.title as Record<string, unknown>) || {};
      const officialTitle = (title.text as string) || 'Kepala Desa Seruni Mumbul,';
      const signatory = (config.signatory as Record<string, unknown>) || {};
      const officialName = (signatory.name as string) || '....................................................';
      const nip = (signatory.nip as string) || '';

      // Applicant: blank = signature line, filled = wrapped in parentheses
      const applicantHtml = applicantNameRaw.trim()
        ? `<div style="font-weight: bold; color: #111;">( ${applicantNameRaw} )</div>`
        : `<div style="border-bottom: 0.5px solid #000; width: 70%; margin: 0 auto; height: 14px;"></div>`;

      return `
        <div class="signature-block-offline" style="margin-top: 36px; display: flex; justify-content: space-between; font-family: sans-serif; font-size: 11px;">
          <div style="width: 46%; text-align: center;">
            <div style="height: 16px;"></div>
            <div style="font-weight: bold; color: #111;">${applicantTitle}</div>
            <div style="height: 64px;"></div>
            ${applicantHtml}
          </div>
          <div style="width: 46%; text-align: center; position: relative;">
            <div style="color: #374151;">${dateLocation}</div>
            <div style="font-weight: bold; color: #111; margin-top: 2px;">${officialTitle}</div>
            <div style="height: 64px; display: flex; align-items: center; justify-content: center;">
              <div style="border: 1px dashed #9ca3af; border-radius: 50%; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #6b7280; text-align: center;">
                [ STEMPEL ]
              </div>
            </div>
            <div style="font-weight: bold; color: #111; border-bottom: 0.5px solid #000; display: inline-block; min-width: 160px;">${officialName}</div>
            ${nip ? `<div style="font-size: 9.5px; color: #4b5563; margin-top: 2px;">NIP. ${nip}</div>` : ''}
          </div>
        </div>
      `;
    }

    // Online TTE
    const title = (config.title as Record<string, unknown>) || {};
    const officialTitle = (title.text as string) || 'Kepala Desa Seruni Mumbul';
    const signatory = (config.signatory as Record<string, unknown>) || {};
    const officialName = (signatory.name as string) || 'Kepala Desa';
    const nip = (signatory.nip as string) || '';
    const qrEnabled = (config.qrCode as Record<string, unknown> | undefined)?.enabled !== false;

    return `
      <div class="signature-block-online" style="margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; font-family: sans-serif; font-size: 11px;">
        <div style="width: 40%;">
          ${qrEnabled ? `
          <div style="display: inline-block; padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; font-size: 8px; color: #4b5563; text-align: center;">
            <div style="width: 50px; height: 50px; margin: 0 auto; background: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 9px; color: #374151;">QR CODE</div>
            <div style="margin-top: 4px; font-size: 7.5px;">Scan Verifikasi Keaslian</div>
          </div>` : ''}
        </div>
        <div style="width: 50%; text-align: center;">
          <div style="color: #374151;">${dateLocation}</div>
          <div style="font-weight: bold; color: #111; margin-top: 2px;">${officialTitle}</div>
          <div style="border: 1px solid #2563eb; border-radius: 5px; padding: 6px 10px; margin: 8px auto; width: fit-content; background: #eff6ff;">
            <div style="font-size: 8.5px; font-weight: bold; color: #1d4ed8;">DITANDATANGANI SECARA ELEKTRONIK</div>
            <div style="font-size: 7.5px; color: #4b5563;">Sistem Informasi Desa Mitradesa</div>
          </div>
          <div style="font-weight: bold; color: #111; margin-top: 4px; border-bottom: 0.5px solid #000; display: inline-block; min-width: 160px;">${officialName}</div>
          ${nip ? `<div style="font-size: 9.5px; color: #4b5563; margin-top: 4px;">NIP. ${nip}</div>` : ''}
        </div>
      </div>
    `;
  }

  private renderElement(element: unknown): string {
    if (!element || typeof element !== 'object') return '';

    const el = element as Record<string, unknown>;
    const type = el.type as string;
    const baseStyle = `font-family: 'Times New Roman', Times, serif; font-size: ${el.fontSize || 11}px;`;

    switch (type) {
      case 'text':
        return `<p class="element-text" style="${baseStyle} font-weight: ${el.fontWeight || 'normal'}; text-align: ${el.textAlign || 'justify'}; margin: 4px 0; text-align: justify;">${el.content || ''}</p>`;
      case 'field': {
        const layout = el.layout as string | undefined;
        const label = el.label as string | undefined;
        const value = (el.value || el.binding || '') as string;
        if (layout === 'column' && label) {
          const labelWidthPct = '40%';
          return `<div class="element-field" style="${baseStyle} display: flex; margin: 3px 0; line-height: 1.4;">
            <span style="width: ${labelWidthPct}; flex-shrink: 0; font-weight: ${el.fontWeight || 'normal'};">${label}</span>
            <span style="width: 24px; flex-shrink: 0; text-align: center;">:</span>
            <span style="flex: 1;">${value}</span>
          </div>`;
        }
        return `<p class="element-field" style="${baseStyle} font-weight: ${el.fontWeight || 'normal'}; text-align: ${el.textAlign || 'left'}; margin: 3px 0;"><span style="font-weight: 500;">${label ? `${label}: ` : ''}</span><span>${value}</span></p>`;
      }
      case 'divider':
        return '<hr class="element-divider" style="border: none; border-top: 1px solid #000; margin: 8px 0;" />';
      case 'spacer':
        return `<div class="element-spacer" style="height: ${el.height || 20}px"></div>`;
      case 'page_break':
        return '<div class="page-break" style="border-top: 1px dashed #cbd5e1; margin: 16px 0; text-align: center; font-size: 9px; color: #94a3b8;">--- Page Break ---</div>';
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
