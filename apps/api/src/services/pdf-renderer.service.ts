/**
 * PDF Renderer Service
 *
 * Production-grade PDF generation for document templates.
 * Uses pdfkit for Node.js native rendering.
 */

import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

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
  style?: TextStyle;
}

export interface ImageElement {
  type: 'image';
  source: string;
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface DividerElement {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  color?: string;
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
      size: options.layout.pageSize,
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

    // Calculate content dimensions
    this.contentStartY = this.pageHeight - this.doc.page.margins.top;
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
   * Render Kop Surat header
   */
  renderKop(kop: KopConfig): void {
    const startY = this.doc.page.margins.top;

    // Reset to top
    this.currentY = startY;

    // Calculate positions for logos
    const logoSize = kop.logoDesa?.size || 60;
    const logoWidth = this.mmToPoints(logoSize / 10);

    // Left logo (Desa)
    if (kop.logoDesa?.visible && kop.logoDesa.source) {
      this.drawLogo(kop.logoDesa.source, this.doc.page.margins.left, startY, logoWidth);
    }

    // Right logo (Kabupaten) - would draw here if source available

    // Institution names
    const institutionY = startY + 20;

    this.doc.font('Helvetica-Bold').fontSize(14);

    if (kop.institutionNames?.pemda?.visible) {
      this.doc.text(
        kop.institutionNames.pemda.text || 'PEMERINTAH KABUPATEN LOMBOK TIMUR',
        0,
        institutionY,
        { align: 'center', width: this.contentWidth }
      );
    }

    if (kop.institutionNames?.kecamatan?.visible) {
      this.doc.text(
        kop.institutionNames.kecamatan.text || 'KECAMATAN PRINGGABAYA',
        0,
        institutionY + 18,
        { align: 'center', width: this.contentWidth }
      );
    }

    if (kop.institutionNames?.desa?.visible) {
      this.doc.text(
        kop.institutionNames.desa.text || 'DESA SERUNI MUMBUL',
        0,
        institutionY + 36,
        { align: 'center', width: this.contentWidth }
      );
    }

    // Address block
    if (kop.addressBlock?.enabled && kop.addressBlock.lines) {
      this.doc.font('Helvetica').fontSize(10);
      let yOffset = institutionY + 60;
      for (const line of kop.addressBlock.lines) {
        this.doc.text(line, 0, yOffset, { align: 'center', width: this.contentWidth });
        yOffset += 14;
      }
    }

    // Divider
    this.currentY = institutionY + 100;
    if (kop.divider?.style === 'double') {
      this.drawDivider(2, 'black');
      this.currentY += 4;
      this.drawDivider(2, 'black');
      this.currentY += 10;
    } else if (kop.divider?.style === 'single') {
      this.drawDivider(kop.divider.thickness || 1, 'black');
      this.currentY += 10;
    }

    // Move past kop
    this.currentY += 20;
  }

  /**
   * Render a single element
   */
  renderElement(element: Element): void {
    switch (element.type) {
      case 'text':
        this.renderText(element);
        break;
      case 'field':
        this.renderField(element);
        break;
      case 'image':
        this.renderImage(element);
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
  renderElements(elements: Element[]): void {
    for (const element of elements) {
      this.renderElement(element);
    }
  }

  /**
   * Render signature block
   */
  renderSignatureBlock(config: SignatureConfig): void {
    const signatureY = this.pageHeight - this.doc.page.margins.bottom - 200;

    // Move to signature area
    this.currentY = signatureY;

    // Title - use dynamic jabatan from signatory or fallback
    if (config.title?.enabled) {
      this.doc.font('Helvetica-Bold').fontSize(11);
      const align = config.title.align || 'right';
      // Resolve dynamic binding if title contains {{}}
      let titleText = config.title.text || '';
      if (titleText.includes('{{')) {
        // For PDF rendering, use the signatory's title as fallback
        titleText = config.signatory?.title || 'Kepala Desa';
      }
      this.doc.text(
        titleText,
        0,
        this.currentY,
        { align, width: this.contentWidth }
      );
      this.currentY += 30;
    }

    // Signature image
    if (config.signatureImage?.enabled && config.signatureImage.url) {
      // Would load and draw image here
      this.currentY += config.signatureImage.height || 50;
    } else {
      // Draw signature line
      this.currentY += 60;
    }

    // Name
    if (config.signatory?.name) {
      this.doc.font('Helvetica').fontSize(11);
      this.doc.text(
        config.signatory.name,
        0,
        this.currentY,
        { align: 'right', width: this.contentWidth }
      );
      this.currentY += 18;
    }

    // NIP
    if (config.signatory?.nip) {
      this.doc.fontSize(10);
      this.doc.text(
        `NIP. ${config.signatory.nip}`,
        0,
        this.currentY,
        { align: 'right', width: this.contentWidth }
      );
    }
  }

  // ============================================================
  // Private Rendering Methods
  // ============================================================

  private renderText(element: TextElement): void {
    // Check for page break
    if (this.currentY <= this.doc.page.margins.bottom + 50) {
      this.addNewPage();
    }

    const fontSize = element.style?.fontSize || 11;
    const fontWeight = element.style?.fontWeight || 'normal';
    const textAlign = element.style?.textAlign || 'left';
    const lineHeight = element.style?.lineHeight || 1.5;
    const color = element.style?.color || '#000000';

    this.doc.font(fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica');
    this.doc.fontSize(fontSize);
    this.doc.fillColor(color);

    // Calculate available width
    const x = element.x !== undefined ? this.mmToPoints(element.x) : this.doc.page.margins.left;
    const width = element.width !== undefined
      ? (typeof element.width === 'number' ? this.mmToPoints(element.width) : parseFloat(element.width))
      : this.contentWidth - (x - this.doc.page.margins.left);

    // Draw text with line height
    const textHeight = this.doc.heightOfString(element.content, {
      width,
      align: textAlign,
      lineGap: fontSize * (lineHeight - 1),
    });

    this.doc.text(element.content, x, this.currentY, {
      width,
      align: textAlign,
      lineGap: fontSize * (lineHeight - 1),
    });

    this.currentY += textHeight + (element.style?.margin?.bottom ? this.mmToPoints(element.style.margin.bottom) : 0);
  }

  private renderField(element: FieldElement): void {
    // Check for page break
    if (this.currentY <= this.doc.page.margins.bottom + 50) {
      this.addNewPage();
    }

    const fontSize = element.style?.fontSize || 11;
    const fontWeight = element.style?.fontWeight || 'normal';
    const textAlign = element.style?.textAlign || 'left';

    this.doc.font(fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica');
    this.doc.fontSize(fontSize);
    this.doc.fillColor('#000000');

    const x = this.doc.page.margins.left;
    const width = this.contentWidth;

    // Label if present
    let content = '';
    if (element.label) {
      content = `${element.label}: `;
    }
    content += element.value || '';

    this.doc.text(content, x, this.currentY, {
      width,
      align: textAlign,
    });

    this.currentY += fontSize * 1.5 + 5;
  }

  private renderImage(element: ImageElement): void {
    if (!element.source) return;

    const width = this.mmToPoints((element.width || 100) / 10);
    const height = element.height ? this.mmToPoints(element.height / 10) : width;

    // For now, just reserve space
    // Image loading would be done here with actual image data
    this.currentY += height;
  }

  private renderDivider(element: DividerElement): void {
    const thickness = element.thickness || 1;
    const color = element.color || '#000000';

    this.drawDivider(thickness, color);
    this.currentY += 10;
  }

  private renderTable(element: TableElement): void {
    // Check for page break
    if (this.currentY <= this.doc.page.margins.bottom + 100) {
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
    this.doc.font('Helvetica-Bold').fontSize(headerStyle.fontSize || 10);
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
    this.doc.font('Helvetica').fontSize(rowStyle.fontSize || 10);

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
      this.doc.font('Helvetica-Bold').fontSize(11);
      this.doc.text(element.title, 0, this.currentY, {
        width: this.contentWidth,
        align: element.position || 'right',
      });
      this.currentY += 40;
    }

    // Signature line
    this.currentY += 40;

    if (element.name) {
      this.doc.font('Helvetica').fontSize(11);
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

  private drawLogo(_url: string, _x: number, _y: number, _width: number): void {
    // Logo loading would be implemented here
    // For now, just reserve space
    // This would typically load image data and draw with doc.image()
  }

  private addPageBreak(): void {
    this.addNewPage();
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.pageHeight - this.doc.page.margins.top;
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
