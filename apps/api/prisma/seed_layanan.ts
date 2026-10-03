import { PrismaClient, FieldType } from '@prisma/client';
import { SURAT_MASTER, SuratMaster } from './surat-master';

function mapFieldType(typeStr: string): FieldType {
  const map: Record<string, FieldType> = {
    'text': FieldType.TEXT,
    'textarea': FieldType.TEXTAREA,
    'number': FieldType.NUMBER,
    'select': FieldType.SELECT,
    'radio': FieldType.RADIO,
    'date': FieldType.DATE,
    'checkbox': FieldType.CHECKBOX
  };
  return map[typeStr] || FieldType.TEXT;
}

export async function seedLayanan(prisma: PrismaClient) {
  console.log('Seeding all 53 standard village services (Layanan) & Templates from SURAT_MASTER...');

  const services = Object.values(SURAT_MASTER);

  for (const svc of services) {
    const slug = svc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const isSurat = true; // Based on SURAT_MASTER, these are all letters
    
    const existing = await prisma.layanan.findUnique({
      where: { slug }
    });

    if (!existing) {
      // 1. Create Layanan
      const layanan = await prisma.layanan.create({
        data: {
          kode: svc.code.slice(0, 20),
          nama: svc.name,
          slug: slug,
          deskripsi: svc.description || `Pelayanan ${svc.name}`,
          kategori: svc.category || 'Pelayanan Umum',
          requiresDocument: isSurat,
          requiresApproval: svc.wewenang,
          isMandiri: true,
        }
      });

      // 2. Create FieldDefinitions
      let orderIndex = 1;
      for (const field of svc.fields) {
        await prisma.fieldDefinition.create({
          data: {
            layananId: layanan.id,
            key: field.key,
            label: field.label,
            type: mapFieldType(field.type),
            required: field.required ?? false,
            orderIndex: orderIndex++,
            placeholder: field.placeholder,
            options: field.options ? field.options : undefined
          }
        });
      }
      
      // 3. Create Document Template (if requires document)
      if (isSurat) {
        const dokumenDef = await prisma.dokumenDefinition.create({
          data: {
            layananId: layanan.id,
            kode: `DOC-${svc.code}`.slice(0, 20),
            nama: `Template ${svc.name}`,
            slug: `template-${slug}`
          }
        });
        
        const template = await prisma.templateSurat.create({
          data: {
            dokumenId: dokumenDef.id,
            nama: svc.name,
            slug: slug,
            deskripsi: `Template resmi untuk ${svc.name}`
          }
        });

        // Construct Template JSON
        let transitionText = 'Yang bertandatangan di bawah ini Kepala Desa Seruni Mumbul, dengan ini menerangkan bahwa :';
        let closingText = `Demikian Surat Keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.`;
        
        if (svc.code === 'SKU-01' || svc.code === 'SKU') {
          closingText = 'Adapun Surat Keterangan ini dimohonkan sebagai syarat administrasi.\n' + closingText;
        }

        const elements: any[] = [
          { type: 'spacer', height: 10 },
          { type: 'text', content: svc.name.toUpperCase(), style: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', decoration: 'underline' } },
          { type: 'text', content: 'Nomor : {{system.nomorSurat}}', style: { textAlign: 'center', fontSize: 11, fontWeight: 'bold' } },
          { type: 'spacer', height: 15 },
          { type: 'text', content: transitionText, style: { margin: { bottom: 8 } } },
          { type: 'field', label: 'NIK', binding: 'penduduk.nik', value: '{{penduduk.nik}}', layout: 'column', labelWidth: 45 },
          { type: 'field', label: 'Nama', binding: 'penduduk.namaLengkap', value: '{{penduduk.namaLengkap}}', layout: 'column', labelWidth: 45 },
          { type: 'field', label: 'Tempat/Tanggal Lahir', binding: 'penduduk.tempatLahir', value: '{{penduduk.tempatLahir}}, {{penduduk.tanggalLahir}}', layout: 'column', labelWidth: 45 },
          { type: 'field', label: 'Jenis Kelamin', binding: 'penduduk.jenisKelamin', value: '{{penduduk.jenisKelamin}}', layout: 'column', labelWidth: 45 },
          { type: 'field', label: 'Pekerjaan', binding: 'penduduk.pekerjaan', value: '{{penduduk.pekerjaan}}', layout: 'column', labelWidth: 45 },
          { type: 'field', label: 'Kewarganegaraan', binding: 'penduduk.kewarganegaraan', value: '{{penduduk.kewarganegaraan}}', layout: 'column', labelWidth: 45 },
          { type: 'field', label: 'Agama', binding: 'penduduk.agama', value: '{{penduduk.agama}}', layout: 'column', labelWidth: 45 },
          { type: 'field', label: 'Alamat', binding: 'penduduk.alamat', value: 'Dusun {{penduduk.dusun}} RT/RW {{penduduk.rt}}/{{penduduk.rw}} Desa Seruni Mumbul Kecamatan Pringgabaya Kabupaten Lombok Timur', layout: 'column', labelWidth: 45 },
          { type: 'spacer', height: 10 },
          { type: 'text', content: 'Adapun Surat Keterangan ini dibuat berdasarkan pengajuan dengan data tambahan sebagai berikut:', style: { margin: { bottom: 8 } } },
        ];

        // Dynamic fields
        svc.fields.forEach((f: any) => {
          elements.push({
            type: 'field',
            label: f.label,
            binding: `custom.${f.key}`,
            value: `{{custom.${f.key}}}`,
            layout: 'column',
            labelWidth: 45
          });
        });

        // Closing
        elements.push({ type: 'spacer', height: 10 });
        elements.push({ type: 'text', content: closingText });

        const kopConfig = {
          logoDesa: { visible: true, position: 'left', size: 22 },
          logoKabupaten: { visible: true, position: 'right', size: 22 },
          institutionNames: {
            pemda: { visible: true, text: 'PEMERINTAH KABUPATEN LOMBOK TIMUR' },
            kecamatan: { visible: true, text: 'KECAMATAN PRINGGABAYA' },
            desa: { visible: true, text: 'DESA SERUNI MUMBUL' }
          },
          addressBlock: {
            enabled: true,
            lines: [
              'Jalan Raya Seruni Mumbul, Kode Pos 83653',
              'Email: info@serunimumbul.desa.id'
            ]
          },
          divider: { style: 'double' }
        };

        const signatureConfig = {
          mode: 'offline_physical',
          layout: 'two-column',
          left: {
            title: 'Yang Menyatakan / Pemohon,',
            name: '',
            showStampSpace: false
          },
          right: {
            dateLocation: 'Seruni Mumbul, {{system.tanggal}}',
            title: 'KEPALA DESA SERUNI MUMBUL,',
            name: 'T A J U D D I N M S.',
            showStampSpace: true
          },
          qrCode: { enabled: true }
        };

        await prisma.templateVersion.create({
          data: {
            templateId: template.id,
            version: 1,
            status: 'PUBLISHED',
            content: { elements },
            kopConfig,
            signatureConfig
          }
        });
      }

      console.log(`Created Layanan & Template: ${svc.name}`);
    } else {
      console.log(`Layanan ${svc.name} already exists, skipping.`);
    }
  }

  console.log('Finished seeding village services & templates.');
}
