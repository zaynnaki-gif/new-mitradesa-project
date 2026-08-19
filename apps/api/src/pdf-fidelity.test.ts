/**
 * PDF Fidelity Tests
 *
 * Tests for PDF generation accuracy and layout fidelity.
 */

import { generatePdf, PdfRenderer, RenderOptions } from '../src/services/pdf-renderer.service';

describe('PDF Renderer', () => {
  describe('Page Sizes', () => {
    it('should generate A4 document', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Check PDF magic bytes
      expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should generate FOLIO document', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'FOLIO',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Orientation', () => {
    it('should generate portrait document', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [],
      };

      const renderer = new PdfRenderer(options);
      const buffer = await renderer.render();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should generate landscape document', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [],
      };

      const renderer = new PdfRenderer(options);
      const buffer = await renderer.render();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Elements', () => {
    it('should render text element', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [
          {
            type: 'text',
            content: 'Surat Keterangan Domisili',
            style: {
              fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'center',
            },
          },
        ],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should render field element', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [
          {
            type: 'field',
            binding: 'penduduk.namaLengkap',
            value: 'BAMBANG SURYA ADI',
            label: 'Nama Lengkap',
            style: {
              fontSize: 11,
              textAlign: 'left',
            },
          },
        ],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should render divider', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [
          {
            type: 'divider',
            style: 'solid',
            thickness: 1,
          },
        ],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should render spacer', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [
          {
            type: 'spacer',
            height: 30,
          },
        ],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should render page break', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [
          {
            type: 'text',
            content: 'Halaman 1',
          },
          {
            type: 'page_break',
          },
          {
            type: 'text',
            content: 'Halaman 2',
          },
        ],
      };

      const renderer = new PdfRenderer(options);
      renderer.renderElements(options.elements);
      const buffer = await renderer.render();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should render table', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [
          {
            type: 'table',
            dataSource: 'keluarga.anggota',
            rows: [
              { 'Nama': 'BAMBANG', 'NIK': '5203010101010001' },
              { 'Nama': 'SITI', 'NIK': '5203010102020002' },
            ],
            columns: [
              { header: 'Nama', align: 'left' },
              { header: 'NIK', align: 'left' },
            ],
          },
        ],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Kop Surat', () => {
    it('should render kop with institution names', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        kop: {
          institutionNames: {
            pemda: { visible: true, text: 'PEMERINTAH KABUPATEN LOMBOK TIMUR' },
            kecamatan: { visible: true, text: 'KECAMATAN PRINGGABAYA' },
            desa: { visible: true, text: 'DESA SERUNI MUMBUL' },
          },
          divider: { style: 'double', thickness: 2 },
        },
        elements: [],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should render kop with logos', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        kop: {
          logoDesa: { visible: true, position: 'left', size: 60 },
          logoKabupaten: { visible: true, position: 'right', size: 60 },
          institutionNames: {
            pemda: { visible: true },
            kecamatan: { visible: true },
            desa: { visible: true },
          },
          divider: { style: 'single', thickness: 1 },
        },
        elements: [],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Signature Block', () => {
    it('should render signature block', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        signature: {
          title: {
            enabled: true,
            text: 'Kepala Desa Seruni Mumbul',
            align: 'right',
          },
          signatory: {
            name: 'H. Ahmad Zainuri, S.Pd.',
            title: 'Kepala Desa',
            nip: '197001011990011001',
          },
          signatureImage: {
            enabled: false,
          },
        },
        elements: [],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Complex Documents', () => {
    it('should render full SKDomisili document', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 25 },
        },
        kop: {
          institutionNames: {
            pemda: { visible: true, text: 'PEMERINTAH KABUPATEN LOMBOK TIMUR' },
            kecamatan: { visible: true, text: 'KECAMATAN PRINGGABAYA' },
            desa: { visible: true, text: 'DESA SERUNI MUMBUL' },
          },
          addressBlock: {
            enabled: true,
            lines: ['Jl. Raya Pringgabaya, Lombok Timur, NTB'],
          },
          divider: { style: 'double', thickness: 2 },
        },
        elements: [
          {
            type: 'text',
            content: 'SURAT KETERANGAN DOMISILI',
            style: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
          },
          {
            type: 'text',
            content: 'Nomor: {{surat.nomor}}',
            style: { fontSize: 11, textAlign: 'center' },
          },
          { type: 'divider', style: 'solid', thickness: 1 },
          { type: 'spacer', height: 20 },
          {
            type: 'text',
            content: 'Yang bertanda tangan di bawah ini, Kepala Desa Seruni Mumbul, Kecamatan Pringgabaya, Kabupaten Lombok Timur, dengan ini menyatakan bahwa:',
            style: { fontSize: 11, textAlign: 'left' },
          },
          { type: 'spacer', height: 15 },
          {
            type: 'field',
            binding: 'penduduk.nama',
            value: 'BAMBANG SURYA ADI',
            label: 'Nama',
            style: { fontSize: 11 },
          },
          {
            type: 'field',
            binding: 'penduduk.nik',
            value: '5203010101010001',
            label: 'NIK',
            style: { fontSize: 11 },
          },
          {
            type: 'text',
            content: 'adalah benar warga yang berdomisili di Desa Seruni Mumbul, Kecamatan Pringgabaya, Kabupaten Lombok Timur.',
            style: { fontSize: 11, textAlign: 'justify' },
          },
        ],
        signature: {
          title: { enabled: true, text: 'Kepala Desa Seruni Mumbul', align: 'right' },
          signatory: {
            name: 'H. Ahmad Zainuri, S.Pd.',
            title: 'Kepala Desa',
          },
        },
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });

    it('should render family member list', async () => {
      const options: RenderOptions = {
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements: [
          {
            type: 'text',
            content: 'DAFTAR ANGGOTA KELUARGA',
            style: { fontSize: 12, fontWeight: 'bold' },
          },
          { type: 'spacer', height: 10 },
          {
            type: 'table',
            dataSource: 'keluarga.anggota',
            rows: [
              { 'No': '1', 'Nama': 'BAMBANG SURYA ADI', 'NIK': '5203010101010001', 'JK': 'L', 'Hub': 'KEPALA KELUARGA' },
              { 'No': '2', 'Nama': 'SITI RAHAYU', 'NIK': '5203010102020002', 'JK': 'P', 'Hub': 'ISTRI' },
              { 'No': '3', 'Nama': 'AHMAD FAISAL', 'NIK': '5203010103030003', 'JK': 'L', 'Hub': 'ANAK' },
              { 'No': '4', 'Nama': 'NURUL HIDAYAH', 'NIK': '5203010104040004', 'JK': 'P', 'Hub': 'ANAK' },
            ],
            columns: [
              { header: 'No', align: 'center' },
              { header: 'Nama Lengkap', align: 'left' },
              { header: 'NIK', align: 'left' },
              { header: 'JK', align: 'center' },
              { header: 'Hub.', align: 'left' },
            ],
            headerStyle: { fontSize: 10, fontWeight: 'bold' },
            rowStyle: { fontSize: 10 },
          },
        ],
      };

      const buffer = await generatePdf(options);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
