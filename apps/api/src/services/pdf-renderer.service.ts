/* global PDFKit, NodeJS */
/**
 * PDF Renderer Service
 *
 * Production-grade PDF generation for document templates.
 * Uses pdfkit for Node.js native rendering.
 */
/// <reference types="node" />
/// <reference types="pdfkit" />

import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import fetch from 'node-fetch';
import { generateQrCodeBuffer } from '../utils/qr-generator.js';
import { config } from '../config/index.js';

// ============================================================
// Types
// ============================================================

export interface LayoutConfig {
  pageSize: 'A4' | 'FOLIO' | 'LETTER' | 'LEGAL';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface TextStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  lineHeight?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface TextElement {
  type: 'text';
  content: string;
  style?: TextStyle;
  x?: number;
  y?: number;
  width?: number;
}

export interface FieldElement {
  type: 'field';
  binding: string;
  value: string;
  label?: string;
  /** 'inline' = "Label: Nilai" (default), 'column' = tabel 3-kolom standar surat dinas */
  layout?: 'inline' | 'column';
  /** Lebar kolom label dalam mm untuk mode column (default: 45) */
  labelWidth?: number;
  style?: TextStyle;
  x?: number;
  y?: number;
  width?: number;
}

export interface ImageElement {
  type: 'image';
  source: string;
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
  x?: number;
  y?: number;
}

export interface DividerElement {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
}

export interface TableElement {
  type: 'table';
  dataSource: string;
  rows: Array<Record<string, string>>;
  columns: Array<{
    header: string;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
  }>;
  headerStyle?: TextStyle;
  rowStyle?: TextStyle;
}

export interface SignatureElement {
  type: 'signature';
  title?: string;
  name?: string;
  nip?: string;
  position?: 'left' | 'center' | 'right';
  imageUrl?: string;
}

export interface SpacerElement {
  type: 'spacer';
  height: number;
}

export interface PageBreakElement {
  type: 'page_break';
}

export interface KopConfig {
  logoDesa?: {
    visible: boolean;
    position: 'left' | 'right' | 'center';
    size?: number;
    source?: string;
  };
  logoKabupaten?: {
    visible: boolean;
    position: 'left' | 'right' | 'center';
    size?: number;
  };
  institutionNames?: {
    pemda?: { visible: boolean; text?: string };
    kecamatan?: { visible: boolean; text?: string };
    desa?: { visible: boolean; text?: string };
  };
  addressBlock?: {
    enabled: boolean;
    lines?: string[];
  };
  divider?: {
    style: 'single' | 'double' | 'none';
    thickness?: number;
  };
}

export interface SignatureConfig {
  mode?: 'online_tte' | 'offline_physical';
  dateLocation?: string;
  applicantTitle?: string;
  applicantName?: string;
  showStampSpace?: boolean;
  title?: {
    enabled: boolean;
    text?: string;
    align?: 'left' | 'center' | 'right';
  };
  signatory?: {
    name?: string;
    title?: string;
    nip?: string;
  };
  signatureImage?: {
    enabled: boolean;
    url?: string;
    width?: number;
    height?: number;
  };
  qrCode?: {
    enabled: boolean;
    data?: string;
    size?: number;
  };
}

export type Element =
  | TextElement
  | FieldElement
  | ImageElement
  | DividerElement
  | TableElement
  | SignatureElement
  | SpacerElement
  | PageBreakElement;

export interface RenderOptions {
  layout: LayoutConfig;
  kop?: KopConfig;
  elements: Element[];
  signature?: SignatureConfig;
  pageNumber?: {
    enabled: boolean;
    format?: string;
    position?: 'bottom-center' | 'bottom-right';
  };
  header?: {
    enabled: boolean;
    text?: string;
  };
  footer?: {
    enabled: boolean;
    text?: string;
  };
}

// ============================================================
// Page Dimensions (in points, 1mm = 2.834645669 points)
// ============================================================

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  FOLIO: [612, 936],
  F4: [612, 936],
  LETTER: [612, 792],
  LEGAL: [612, 1008],
};

// ============================================================
// PDF Renderer Class
// ============================================================

export class PdfRenderer {
  private doc: PDFKit.PDFDocument;
  private currentY: number = 0;
  private pageWidth: number = 595.28;
  private pageHeight: number = 841.89;
  private contentWidth: number = 0;
  private contentStartY: number = 0;
  private pageNumber: number = 0;

  constructor(options: RenderOptions) {
    const pageSize = PAGE_SIZES[options.layout.pageSize] || PAGE_SIZES.A4;
    const [width, height] = options.layout.orientation === 'landscape'
      ? [pageSize[1], pageSize[0]]
      : [pageSize[0], pageSize[1]];

    this.pageWidth = width;
    this.pageHeight = height;
    this.pageNumber = 0;

    this.doc = new PDFDocument({
      size: [width, height],
      layout: options.layout.orientation,
      margins: {
        top: this.mmToPoints(options.layout.margins.top),
        bottom: this.mmToPoints(options.layout.margins.bottom),
        left: this.mmToPoints(options.layout.margins.left),
        right: this.mmToPoints(options.layout.margins.right),
      },
      info: {
        Title: 'Document',
        Author: 'MITRADESA',
        Subject: 'Document Template',
        CreationDate: new Date(),
      },
    });

    // Calculate content dimensions (top-left is 0,0 in PDFKit)
    this.contentStartY = this.doc.page.margins.top;
    this.currentY = this.contentStartY;
    this.contentWidth = this.pageWidth - this.doc.page.margins.left - this.doc.page.margins.right;
  }

  // ============================================================
  // Public Methods
  // ============================================================

  /**
   * Render the document and return as Buffer
   */
  async render(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);

      this.doc.end();
    });
  }

  /**
   * Render to a writable stream
   */
  renderToStream(writable: NodeJS.WritableStream): void {
    this.doc.pipe(writable);
    this.doc.end();
  }

  /**
   * Get the PDF document instance for custom operations
   */
  getDocument(): PDFKit.PDFDocument {
    return this.doc;
  }

  // ============================================================
  // Rendering Methods
  // ============================================================

  /**
   * Render Kop Surat header (async version)
   */
  async renderKop(kop: KopConfig): Promise<void> {
    const startY = this.doc.page.margins.top;
    this.currentY = startY;

    // Standard official logo height/width ~22-25mm
    const rawLogoSize = kop.logoDesa?.size || 24;
    const logoSizeMm = typeof rawLogoSize === 'number' && rawLogoSize <= 40 ? rawLogoSize : 24;
    const logoWidth = this.mmToPoints(logoSizeMm);

    // Left logo (Desa / Pemda)
    if (kop.logoDesa?.visible !== false && kop.logoDesa?.source) {
      await this.drawLogoAsync(kop.logoDesa.source, this.doc.page.margins.left, startY, logoWidth);
    }

    // Right logo (Kabupaten if provided)
    if (kop.logoKabupaten?.visible && (kop.logoKabupaten as { source?: string }).source) {
      const rightX = this.pageWidth - this.doc.page.margins.right - logoWidth;
      await this.drawLogoAsync((kop.logoKabupaten as { source?: string }).source!, rightX, startY, logoWidth);
    }

    let textY = startY;
    const leftX = this.doc.page.margins.left;

    if (kop.institutionNames?.pemda?.visible !== false) {
      this.doc.font('Times-Bold').fontSize(12);
      this.doc.text(
        kop.institutionNames?.pemda?.text || 'PEMERINTAH KABUPATEN LOMBOK TIMUR',
        leftX,
        textY,
        { align: 'center', width: this.contentWidth }
      );
      textY += 15;
    }

    if (kop.institutionNames?.kecamatan?.visible !== false) {
      this.doc.font('Times-Bold').fontSize(13);
      this.doc.text(
        kop.institutionNames?.kecamatan?.text || 'KECAMATAN PRINGGABAYA',
        leftX,
        textY,
        { align: 'center', width: this.contentWidth }
      );
      textY += 16;
    }

    if (kop.institutionNames?.desa?.visible !== false) {
      this.doc.font('Times-Bold').fontSize(15);
      this.doc.text(
        kop.institutionNames?.desa?.text || 'DESA SERUNI MUMBUL',
        leftX,
        textY,
        { align: 'center', width: this.contentWidth }
      );
      textY += 18;
    }

    // Address block — only render if explicitly enabled AND lines provided
    if (kop.addressBlock?.enabled !== false && kop.addressBlock?.lines && kop.addressBlock.lines.length > 0) {
      this.doc.font('Times-Roman').fontSize(9);
      for (const line of kop.addressBlock.lines) {
        if (line && line.trim()) {
          this.doc.text(line, leftX, textY, { align: 'center', width: this.contentWidth });
          textY += 12;
        }
      }
    }

    // Crisp standard official divider lines
    // Ensure currentY clears both the text block AND the logo height
    this.currentY = Math.max(textY + 6, startY + logoWidth + 6);
    if (kop.divider?.style === 'double' || !kop.divider?.style) {
      this.drawDivider(2, '#000000');
      this.currentY += 2;
      this.drawDivider(0.75, '#000000');
      this.currentY += 14;
    } else if (kop.divider?.style === 'single') {
      this.drawDivider(kop.divider.thickness || 1.5, '#000000');
      this.currentY += 14;
    } else {
      this.currentY += 10;
    }
  }

  /**
   * Render a single element
   */
  async renderElement(element: Element): Promise<void> {
    switch (element.type) {
      case 'text':
        this.renderText(element);
        break;
      case 'field':
        this.renderField(element);
        break;
      case 'image':
        await this.renderImage(element);
        break;
      case 'divider':
        this.renderDivider(element);
        break;
      case 'table':
        this.renderTable(element);
        break;
      case 'signature':
        this.renderSignature(element);
        break;
      case 'spacer':
        this.renderSpacer(element);
        break;
      case 'page_break':
        this.addPageBreak();
        break;
    }
  }

  /**
   * Render multiple elements
   */
  async renderElements(elements: Element[]): Promise<void> {
    for (const element of elements) {
      await this.renderElement(element);
    }
  }

  /**
   * Render signature block with TTE or Offline Physical dual signatures and QR code
   */
  async renderSignatureBlock(config: SignatureConfig, qrData?: string): Promise<void> {
    const isOffline = config.mode === 'offline_physical';
    const requiredHeight = isOffline ? 170 : 145;

    // Check if we need a new page for signature block
    if (this.currentY > this.pageHeight - this.doc.page.margins.bottom - requiredHeight) {
      this.addNewPage();
    }

    // Anchor signature cleanly with breathing room or towards bottom
    const bottomTargetY = this.pageHeight - this.doc.page.margins.bottom - requiredHeight;
    const startY = Math.max(this.currentY + 20, bottomTargetY);
    this.currentY = startY;

    if (isOffline) {
      // ==========================================
      // DUAL SIGNATURE (OFFLINE PHYSICAL)
      // Left: Pemohon / Yang Menyatakan
      // Right: Kepala Desa / Pejabat + Wet Stamp Area
      // ==========================================
      const colWidth = (this.contentWidth - 30) / 2;
      const leftColX = this.doc.page.margins.left;
      const rightColX = this.doc.page.margins.left + colWidth + 30;

      // Right column: Date & Place
      const dateText = config.dateLocation || 'Seruni Mumbul, .................................... 20...';
      this.doc.font('Times-Roman').fontSize(10);
      this.doc.text(dateText, rightColX, startY, { width: colWidth, align: 'center' });

      // Titles
      const applicantTitle = config.applicantTitle || 'Yang Menyatakan / Pemohon,';
      const officialTitle = config.title?.text || config.signatory?.title || 'Kepala Desa Seruni Mumbul,';

      this.doc.font('Times-Bold').fontSize(10);
      this.doc.text(applicantTitle, leftColX, startY + 16, { width: colWidth, align: 'center' });
      this.doc.text(officialTitle, rightColX, startY + 16, { width: colWidth, align: 'center' });

      // Wet Stamp Guide Box/Circle
      if (config.showStampSpace !== false) {
        const stampX = rightColX + 30;
        const stampY = startY + 55;
        this.doc.save();
        this.doc.dash(3, { space: 3 });
        this.doc.strokeColor('#aaaaaa');
        this.doc.lineWidth(0.8);
        this.doc.circle(stampX, stampY, 22).stroke();
        this.doc.undash();
        this.doc.fontSize(7).font('Times-Roman').fillColor('#777777');
        this.doc.text('[ STEMPEL DESA ]', stampX - 35, stampY - 4, { width: 70, align: 'center' });
        this.doc.fillColor('#000000');
        this.doc.restore();
      }

      // Names & Signature lines
      const sigLineY = startY + 85;
      this.doc.font('Times-Bold').fontSize(10);

      // Applicant name: if provided wrap in parentheses; if blank show underscore line (blanko)
      if (config.applicantName && config.applicantName.trim()) {
        const applicantFmt = `( ${config.applicantName} )`;
        this.doc.text(applicantFmt, leftColX, sigLineY, { width: colWidth, align: 'center' });
      } else {
        // Blank blanko: draw a signature line instead of parentheses
        const lineLen = colWidth * 0.65;
        const lineX = leftColX + (colWidth - lineLen) / 2;
        this.doc.save();
        this.doc.moveTo(lineX, sigLineY + 12).lineTo(lineX + lineLen, sigLineY + 12).lineWidth(0.5).strokeColor('#000').stroke();
        this.doc.restore();
      }

      const officialName = config.signatory?.name || '...................................................';
      this.doc.text(officialName, rightColX, sigLineY, { width: colWidth, align: 'center' });

      // Underline below name (standard on Indonesian official letters)
      const nameTextWidth = Math.min(this.doc.widthOfString(officialName), colWidth);
      const nameLineX = rightColX + (colWidth - nameTextWidth) / 2;
      const nameLineY = sigLineY + 13;
      this.doc.save();
      this.doc.moveTo(nameLineX, nameLineY).lineTo(nameLineX + nameTextWidth, nameLineY).lineWidth(0.5).strokeColor('#000000').stroke();
      this.doc.restore();

      if (config.signatory?.nip) {
        this.doc.font('Times-Roman').fontSize(9);
        this.doc.text(`NIP. ${config.signatory.nip}`, rightColX, sigLineY + 16, { width: colWidth, align: 'center' });
      }

      // QR Code for verification
      if (config.qrCode?.enabled !== false && qrData) {
        await this.renderQrCode(qrData, {
          x: leftColX,
          y: sigLineY + 20,
          sizeMm: 18,
        });
      }
    } else {
      // ==========================================
      // ONLINE TTE
      // Right: Date, Official Title, Electronic Seal / TTE Image, Name, NIP
      // Bottom-Left: Official Verification QR Code
      // ==========================================
      const colWidth = 230;
      const rightColX = this.pageWidth - this.doc.page.margins.right - colWidth;

      const dateText = config.dateLocation || 'Seruni Mumbul, .................................... 20...';
      this.doc.font('Times-Roman').fontSize(10);
      this.doc.text(dateText, rightColX, startY, { width: colWidth, align: 'center' });

      const titleText = config.title?.text || config.signatory?.title || 'Kepala Desa Seruni Mumbul';
      this.doc.font('Times-Bold').fontSize(10);
      this.doc.text(titleText, rightColX, startY + 16, { width: colWidth, align: 'center' });

      let currentRightY = startY + 34;

      // Signature image (TTE)
      if (config.signatureImage?.enabled && config.signatureImage.url) {
        try {
          const imageData = await this.loadImageData(config.signatureImage.url);
          if (imageData) {
            const imgWidthPt = this.mmToPoints(config.signatureImage.width || 35);
            const imgHeightPt = this.mmToPoints(config.signatureImage.height || 18);
            const imgX = rightColX + (colWidth - imgWidthPt) / 2;
            this.doc.image(imageData, imgX, currentRightY, {
              width: imgWidthPt,
              height: imgHeightPt,
            });
            currentRightY += imgHeightPt + 8;
          } else {
            currentRightY += 50;
          }
        } catch {
          currentRightY += 50;
        }
      } else {
        // TTE Verified Badge
        this.doc.save();
        this.doc.roundedRect(rightColX + 20, currentRightY + 2, colWidth - 40, 36, 4).strokeColor('#2563eb').lineWidth(1).stroke();
        this.doc.font('Times-Bold').fontSize(7.5).fillColor('#1e40af');
        this.doc.text('DITANDATANGANI SECARA ELEKTRONIK', rightColX + 20, currentRightY + 10, { width: colWidth - 40, align: 'center' });
        this.doc.font('Times-Roman').fontSize(6.5).fillColor('#4b5563');
        this.doc.text('Sistem Informasi Desa Mitradesa', rightColX + 20, currentRightY + 22, { width: colWidth - 40, align: 'center' });
        this.doc.restore();
        currentRightY += 46;
      }

      // Name
      if (config.signatory?.name) {
        this.doc.font('Times-Bold').fontSize(10);
        this.doc.text(config.signatory.name, rightColX, currentRightY, { width: colWidth, align: 'center' });

        // Underline below name
        const nameW = Math.min(this.doc.widthOfString(config.signatory.name), colWidth);
        const nameUnderlineX = rightColX + (colWidth - nameW) / 2;
        this.doc.save();
        this.doc.moveTo(nameUnderlineX, currentRightY + 13)
          .lineTo(nameUnderlineX + nameW, currentRightY + 13)
          .lineWidth(0.5).strokeColor('#000000').stroke();
        this.doc.restore();
        currentRightY += 16;
      }

      // NIP
      if (config.signatory?.nip) {
        this.doc.font('Times-Roman').fontSize(9);
        this.doc.text(`NIP. ${config.signatory.nip}`, rightColX, currentRightY, { width: colWidth, align: 'center' });
      }

      // QR Code
      if (config.qrCode?.enabled !== false && qrData) {
        await this.renderQrCode(qrData, {
          x: this.doc.page.margins.left,
          y: startY + 10,
          sizeMm: 22,
        });
      }
    }
  }

  /**
   * Render QR code with exact millimeter sizing and security caption
   */
  private async renderQrCode(data: string, options?: { sizeMm?: number; x?: number; y?: number }): Promise<void> {
    try {
      const qrBuffer = await generateQrCodeBuffer(data);
      const qrSizeMm = options?.sizeMm || 22;
      const qrSizePt = this.mmToPoints(qrSizeMm);
      const x = options?.x ?? this.doc.page.margins.left;
      const y = options?.y ?? (this.pageHeight - this.doc.page.margins.bottom - qrSizePt - 15);

      this.doc.image(qrBuffer, x, y, {
        width: qrSizePt,
        height: qrSizePt,
      });

      // Add verification text below QR
      this.doc.fontSize(6.5);
      this.doc.font('Times-Roman');
      this.doc.fillColor('#555555');
      this.doc.text(
        'Scan untuk verifikasi keaslian surat',
        x,
        y + qrSizePt + 3,
        { width: qrSizePt + 40, align: 'left' }
      );
      this.doc.fillColor('#000000');
    } catch (error) {
      console.warn(`Gagal memuat QR Code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================
  // Private Rendering Methods
  // ============================================================

  /**
   * Check if an IP address belongs to private/internal/reserved ranges
   */
  private isPrivateIp(ip: string): boolean {
    let cleanIp = ip.toLowerCase().trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }

    // IPv4 checks
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = cleanIp.match(ipv4Regex);
    if (match) {
      const b1 = Number(match[1]);
      const b2 = Number(match[2]);
      if (b1 === 0 || b1 === 127) return true; // 0.0.0.0/8, 127.0.0.0/8 (loopback)
      if (b1 === 10) return true; // 10.0.0.0/8
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return true; // 172.16.0.0/12
      if (b1 === 192 && b2 === 168) return true; // 192.168.0.0/16
      if (b1 === 169 && b2 === 254) return true; // 169.254.0.0/16 (link-local, cloud metadata)
      if (b1 === 100 && b2 >= 64 && b2 <= 127) return true; // Carrier-grade NAT 100.64.0.0/10
      if (b1 >= 224) return true; // Multicast & reserved 224.0.0.0+
      return false;
    }

    // IPv6 checks
    if (cleanIp === '::1' || cleanIp === '::' || cleanIp === '0:0:0:0:0:0:0:1' || cleanIp === '0:0:0:0:0:0:0:0') {
      return true;
    }
    // Unique Local Addresses fc00::/7 (fc00: to fdff:)
    if (/^f[cd][0-9a-f]{2}:/i.test(cleanIp)) {
      return true;
    }
    // Link-Local unicast fe80::/10 (fe80: to febf:)
    if (/^fe[89ab][0-9a-f]:/i.test(cleanIp)) {
      return true;
    }

    return false;
  }

  /**
   * Validate if external URL is safe (anti-SSRF with DNS resolution)
   */
  private async isSafePublicUrl(urlString: string): Promise<boolean> {
    try {
      const parsed = new URL(urlString);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
        return false;
      }
      if (this.isPrivateIp(hostname)) {
        return false;
      }

      // DNS lookup to prevent DNS Rebinding / nip.io tricks
      const dns = await import('node:dns/promises');
      try {
        const addresses = await dns.lookup(hostname, { all: true });
        if (!addresses || addresses.length === 0) return false;
        for (const addr of addresses) {
          if (this.isPrivateIp(addr.address)) {
            return false;
          }
        }
      } catch {
        // DNS lookup failed or domain doesn't exist
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load image data from URL
   */
  private async loadImageData(url: string): Promise<Buffer | null> {
    try {
      // Handle data URLs (base64)
      if (url.startsWith('data:')) {
        const base64 = url.split(',')[1];
        return Buffer.from(base64, 'base64');
      }

      // Handle local/file URLs - strictly restricted to upload directory
      if (url.startsWith('file://')) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = url.replace('file://', '');
        const resolvedPath = path.resolve(filePath);
        const allowedUploadDir = path.resolve(config.uploadDir || './uploads');
        if (!resolvedPath.startsWith(allowedUploadDir)) {
          throw new Error('Akses file lokal di luar direktori upload diblokir');
        }
        return await fs.readFile(resolvedPath);
      }

      // Handle HTTP/HTTPS URLs with SSRF protection & timeout
      if (url.startsWith('http://') || url.startsWith('https://')) {
        let currentUrl = url;
        let hops = 0;
        const maxHops = 3;

        while (hops < maxHops) {
          if (!(await this.isSafePublicUrl(currentUrl))) {
            throw new Error('Akses ke URL privat / internal diblokir (SSRF protection)');
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          try {
            const response = await fetch(currentUrl, {
              signal: controller.signal as unknown as Parameters<typeof fetch>[1] extends { signal?: infer S } ? S : never,
              redirect: 'manual',
            });

            // Handle 3xx Redirect manually and validate target URL
            if (response.status >= 300 && response.status < 400) {
              const location = response.headers.get('location');
              if (!location) {
                throw new Error(`Redirect ${response.status} tanpa header Location`);
              }
              currentUrl = new URL(location, currentUrl).toString();
              hops++;
              continue;
            }

            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
          } finally {
            clearTimeout(timeoutId);
          }
        }
        throw new Error('Terlalu banyak redirect saat memuat gambar');
      }

      return null;
    } catch (error) {
      throw new Error(`Gagal memuat gambar dari URL (${url}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private renderText(element: TextElement): void {
    const isAbsolute = element.y !== undefined;
    const yPos = isAbsolute ? this.mmToPoints(element.y as number) : this.currentY;

    if (!isAbsolute && yPos >= this.pageHeight - this.doc.page.margins.bottom - 45) {
      this.addNewPage();
    }

    const fontSize = element.style?.fontSize || 11;
    const fontWeight = element.style?.fontWeight || 'normal';
    // Default justify untuk teks body surat resmi Indonesia
    const textAlign = element.style?.textAlign || 'justify';
    const lineHeight = element.style?.lineHeight || 1.4;
    const color = element.style?.color || '#000000';

    this.doc.font(fontWeight === 'bold' ? 'Times-Bold' : 'Times-Roman');
    this.doc.fontSize(fontSize);
    this.doc.fillColor(color);

    const x = element.x !== undefined ? this.mmToPoints(element.x) : this.doc.page.margins.left;
    const width = element.width !== undefined
      ? (typeof element.width === 'number' ? this.mmToPoints(element.width) : parseFloat(element.width as unknown as string))
      : this.contentWidth - (x - this.doc.page.margins.left);

    const textHeight = this.doc.heightOfString(element.content, {
      width,
      align: textAlign,
      lineGap: fontSize * (lineHeight - 1),
    });

    this.doc.text(element.content, x, isAbsolute ? yPos : this.currentY, {
      width,
      align: textAlign,
      lineGap: fontSize * (lineHeight - 1),
    });

    if (!isAbsolute) {
      this.currentY += textHeight + (element.style?.margin?.bottom ? this.mmToPoints(element.style.margin.bottom) : 3);
    }
  }

  private renderField(element: FieldElement): void {
    const isAbsolute = element.y !== undefined;
    const yPos = isAbsolute ? this.mmToPoints(element.y as number) : this.currentY;

    if (!isAbsolute && yPos >= this.pageHeight - this.doc.page.margins.bottom - 45) {
      this.addNewPage();
    }

    const fontSize = element.style?.fontSize || 11;
    const fontWeight = element.style?.fontWeight || 'normal';
    const textAlign = element.style?.textAlign || 'left';
    const lineHeight = element.style?.lineHeight || 1.35;

    this.doc.font(fontWeight === 'bold' ? 'Times-Bold' : 'Times-Roman');
    this.doc.fontSize(fontSize);
    this.doc.fillColor('#000000');

    const x = element.x !== undefined ? this.mmToPoints(element.x) : this.doc.page.margins.left;
    const availableWidth = element.width !== undefined
      ? (typeof element.width === 'number' ? this.mmToPoints(element.width) : parseFloat(element.width as unknown as string))
      : this.contentWidth - (x - this.doc.page.margins.left);

    // ──────────────────────────────────────────────────────────────
    // COLUMN LAYOUT: Label | : | Nilai  (standar surat dinas RI)
    // ──────────────────────────────────────────────────────────────
    if (element.layout === 'column' && element.label) {
      const labelWidthPt = this.mmToPoints(element.labelWidth || 45);
      const colonWidthPt = this.mmToPoints(6);
      const valueX = x + labelWidthPt + colonWidthPt;
      const valueWidth = availableWidth - labelWidthPt - colonWidthPt;
      const savedY = isAbsolute ? yPos : this.currentY;

      const labelH = this.doc.heightOfString(element.label, {
        width: labelWidthPt,
        lineGap: fontSize * (lineHeight - 1),
      });
      this.doc.text(element.label, x, savedY, {
        width: labelWidthPt,
        align: 'left',
        lineGap: fontSize * (lineHeight - 1),
      });

      this.doc.text(':', x + labelWidthPt, savedY, { width: colonWidthPt, align: 'center' });

      const valueH = this.doc.heightOfString(element.value || '', {
        width: valueWidth,
        lineGap: fontSize * (lineHeight - 1),
      });
      this.doc.text(element.value || '', valueX, savedY, {
        width: valueWidth,
        align: 'left',
        lineGap: fontSize * (lineHeight - 1),
      });

      if (!isAbsolute) {
        this.currentY = savedY + Math.max(labelH, valueH) +
          (element.style?.margin?.bottom ? this.mmToPoints(element.style.margin.bottom) : 3);
      }
      return;
    }

    // ──────────────────────────────────────────────────────────────
    // INLINE LAYOUT: \"Label: Nilai\" (default)
    // ──────────────────────────────────────────────────────────────
    let content = '';
    if (element.label) {
      content = `${element.label}: `;
    }
    content += element.value || '';

    const textHeight = this.doc.heightOfString(content, {
      width: availableWidth,
      align: textAlign,
      lineGap: fontSize * (lineHeight - 1),
    });

    this.doc.text(content, x, isAbsolute ? yPos : this.currentY, {
      width: availableWidth,
      align: textAlign,
      lineGap: fontSize * (lineHeight - 1),
    });

    if (!isAbsolute) {
      this.currentY += textHeight + (element.style?.margin?.bottom ? this.mmToPoints(element.style.margin.bottom) : 4);
    }
  }

  private async renderImage(element: ImageElement): Promise<void> {
    if (!element.source) return;


    const isAbsolute = element.y !== undefined;
    const yPos = isAbsolute ? this.mmToPoints(element.y as number) : this.currentY;

    // Check for page break
    if (!isAbsolute && yPos >= this.pageHeight - this.doc.page.margins.bottom - 50) {
      this.addNewPage();
    }

    const xPos = element.x !== undefined ? this.mmToPoints(element.x) : this.doc.page.margins.left;
    const width = element.width !== undefined ? this.mmToPoints(element.width) : this.mmToPoints(10);
    const height = element.height !== undefined ? this.mmToPoints(element.height) : width;

    try {
      const imageData = await this.loadImageData(element.source);
      if (imageData) {
        this.doc.image(imageData, xPos, isAbsolute ? yPos : this.currentY, {
          width,
          ...(element.height !== undefined ? { height } : {})
        });
      }
    } catch (e) {
      console.warn(`Failed to load image: ${element.source}`, e);
    }

    if (!isAbsolute) {
      this.currentY += height + 5;
    }
  }

  private renderDivider(element: DividerElement): void {
    const isAbsolute = element.y !== undefined;
    const yPos = isAbsolute ? this.mmToPoints(element.y as number) : this.currentY;

    if (!isAbsolute && yPos >= this.pageHeight - this.doc.page.margins.bottom - 20) {
      this.addNewPage();
    }

    const thickness = element.thickness || 1;
    const color = element.color || '#000000';
    const xPos = element.x !== undefined ? this.mmToPoints(element.x) : this.doc.page.margins.left;
    const width = element.width !== undefined
      ? (typeof element.width === 'number' ? this.mmToPoints(element.width) : parseFloat(element.width as unknown as string))
      : this.contentWidth - (xPos - this.doc.page.margins.left);

    this.doc.lineWidth(thickness);
    this.doc.strokeColor(color);

    const actualY = isAbsolute ? yPos : this.currentY;
    this.doc
      .moveTo(xPos, actualY)
      .lineTo(xPos + width, actualY)
      .stroke();

    if (!isAbsolute) {
      this.currentY += 10;
    }
  }

  private renderTable(element: TableElement): void {
    // Check for page break
    if (this.currentY >= this.pageHeight - this.doc.page.margins.bottom - 100) {
      this.addNewPage();
    }

    if (!element.rows || element.rows.length === 0) {
      return;
    }

    const headerStyle = element.headerStyle || { fontSize: 10, fontWeight: 'bold' as const };
    const rowStyle = element.rowStyle || { fontSize: 10 };
    const fontSize = rowStyle.fontSize || 10;

    // Calculate column widths
    const colCount = element.columns.length;
    const colWidth = this.contentWidth / colCount;
    const tableWidth = colWidth * colCount;

    // Draw header
    this.doc.font('Times-Bold').fontSize(headerStyle.fontSize || 10);
    this.doc.fillColor('#000000');

    let headerY = this.currentY;
    this.doc.rect(
      this.doc.page.margins.left,
      headerY,
      tableWidth,
      fontSize * 2
    ).fill('#e0e0e0');

    let colIndex = 0;
    for (const col of element.columns) {
      const x = this.doc.page.margins.left + colIndex * colWidth;
      const align = (col.align || 'left') as 'left' | 'center' | 'right';

      this.doc.text(
        col.header || '',
        x,
        headerY + fontSize * 0.5,
        { width: colWidth, align }
      );
      colIndex++;
    }

    this.currentY = headerY + fontSize * 2;

    // Draw rows
    this.doc.font('Times-Roman').fontSize(rowStyle.fontSize || 10);

    for (const row of element.rows) {
      // Check if we need a new page
      if (this.currentY >= this.pageHeight - this.doc.page.margins.bottom - 30) {
        this.addNewPage();
      }

      let rowColIndex = 0;
      for (const col of element.columns) {
        const x = this.doc.page.margins.left + rowColIndex * colWidth;
        const align = (col.align || 'left') as 'left' | 'center' | 'right';
        // Use column header as the key in row data
        const value = row[col.header] || '';

        this.doc.text(
          String(value),
          x,
          this.currentY,
          { width: colWidth, align }
        );
        rowColIndex++;
      }

      // Draw row border
      this.doc.rect(
        this.doc.page.margins.left,
        this.currentY - 2,
        tableWidth,
        fontSize * 1.5 + 4
      ).stroke('#cccccc');

      this.currentY += fontSize * 1.5 + 4;
    }

    this.currentY += 10;
  }

  private renderSignature(element: SignatureElement): void {
    const signatureY = this.pageHeight - this.doc.page.margins.bottom - 150;

    this.currentY = signatureY;

    if (element.title) {
      this.doc.font('Times-Bold').fontSize(11);
      this.doc.text(element.title, this.doc.page.margins.left, this.currentY, {
        width: this.contentWidth,
        align: element.position || 'right',
      });
      this.currentY += 40;
    }

    // Signature space
    this.currentY += element.imageUrl ? 50 : 40;

    if (element.name) {
      this.doc.font('Times-Bold').fontSize(11);
      this.doc.text(element.name, this.doc.page.margins.left, this.currentY, {
        width: this.contentWidth,
        align: element.position || 'right',
      });
      // Underline below name
      const nameW = Math.min(this.doc.widthOfString(element.name), this.contentWidth);
      const nameUnderlineX = element.position === 'right'
        ? this.pageWidth - this.doc.page.margins.right - nameW
        : element.position === 'center'
          ? this.doc.page.margins.left + (this.contentWidth - nameW) / 2
          : this.doc.page.margins.left;
      this.doc.save();
      this.doc.moveTo(nameUnderlineX, this.currentY + 13).lineTo(nameUnderlineX + nameW, this.currentY + 13).lineWidth(0.5).strokeColor('#000').stroke();
      this.doc.restore();
      this.currentY += 18;
    }

    if (element.nip) {
      this.doc.font('Times-Roman').fontSize(10);
      this.doc.text(`NIP. ${element.nip}`, this.doc.page.margins.left, this.currentY, {
        width: this.contentWidth,
        align: element.position || 'right',
      });
    }
  }

  /**
   * Async version of renderSignature that loads and draws signature image
   */
  async renderSignatureAsync(element: SignatureElement): Promise<void> {
    const signatureY = this.pageHeight - this.doc.page.margins.bottom - 150;
    this.currentY = signatureY;

    if (element.title) {
      this.doc.font('Times-Bold').fontSize(11);
      this.doc.text(element.title, 0, this.currentY, {
        width: this.contentWidth,
        align: element.position || 'right',
      });
      this.currentY += 40;
    }

    // Load and draw signature image
    if (element.imageUrl) {
      const imageData = await this.loadImageData(element.imageUrl);
      if (imageData) {
        const imgWidth = 80;
        const imgHeight = 30;
        const x = element.position === 'left'
          ? this.doc.page.margins.left
          : element.position === 'center'
            ? this.pageWidth / 2 - this.mmToPoints(imgWidth / 10) / 2
            : this.pageWidth - this.doc.page.margins.right - this.mmToPoints(imgWidth / 10);

        this.doc.image(imageData, x, this.currentY, {
          width: this.mmToPoints(imgWidth / 10),
          height: this.mmToPoints(imgHeight / 10),
        });
        this.currentY += this.mmToPoints(imgHeight / 10);
      }
    } else {
      // Signature line
      this.currentY += 40;
    }

    if (element.name) {
      this.doc.font('Times-Roman').fontSize(11);
      this.doc.text(element.name, 0, this.currentY, {
        width: this.contentWidth,
        align: element.position || 'right',
      });
      this.currentY += 18;
    }

    if (element.nip) {
      this.doc.fontSize(10);
      this.doc.text(`NIP. ${element.nip}`, 0, this.currentY, {
        width: this.contentWidth,
        align: element.position || 'right',
      });
    }
  }

  private renderSpacer(element: SpacerElement): void {
    this.currentY += this.mmToPoints(element.height);
  }

  private drawDivider(thickness: number, color: string): void {
    const y = this.currentY;
    const startX = this.doc.page.margins.left;
    const endX = this.pageWidth - this.doc.page.margins.right;

    this.doc.strokeColor(color);
    this.doc.lineWidth(thickness);
    this.doc.moveTo(startX, y).lineTo(endX, y).stroke();
  }

  private async drawLogoAsync(url: string, x: number, y: number, width: number): Promise<void> {
    try {
      const imageData = await this.loadImageData(url);
      if (imageData) {
        this.doc.image(imageData, x, y, { width });
      }
    } catch (error) {
      console.warn(`Failed to load logo from ${url}`, error);
    }
  }

  private addPageBreak(): void {
    this.addNewPage();
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.doc.page.margins.top;
    this.contentStartY = this.currentY;
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Convert millimeters to points (PDF internal units)
   */
  private mmToPoints(mm: number): number {
    return mm * 2.834645669;
  }
}

// ============================================================
// Factory Functions
// ============================================================

/**
 * Create a PDF renderer with standard layout
 */
export function createPdfRenderer(options: RenderOptions): PdfRenderer {
  return new PdfRenderer(options);
}

/**
 * Generate PDF buffer from template content
 */
export async function generatePdf(options: RenderOptions): Promise<Buffer> {
  const renderer = new PdfRenderer(options);
  if (options.kop) {
    await renderer.renderKop(options.kop);
  }
  await renderer.renderElements(options.elements);
  if (options.signature) {
    await renderer.renderSignatureBlock(options.signature, options.signature.qrCode?.data);
  }
  return renderer.render();
}

/**
 * Generate PDF stream from template content
 */
export function generatePdfStream(options: RenderOptions): PassThrough {
  const renderer = new PdfRenderer(options);
  const stream = new PassThrough();
  renderer.renderToStream(stream);
  return stream;
}
