import pandas as pd
import json

df = pd.read_excel('D:/mitradesa/jenissurat.xlsx', sheet_name='Surat Layanan (43)')

def determine_field_type(tag):
    tag_lower = tag.lower()
    if 'tanggal' in tag_lower or 'hari_lahir' in tag_lower:
        return 'FieldType.DATE'
    if 'jumlah' in tag_lower or 'harga' in tag_lower or 'luas' in tag_lower or 'nomor' in tag_lower or 'isi_silinder' in tag_lower or 'tahun' in tag_lower:
        return 'FieldType.NUMBER'
    if 'alamat' in tag_lower or 'keterangan' in tag_lower or 'rincian' in tag_lower:
        return 'FieldType.TEXTAREA'
    if 'jenis_kelamin' in tag_lower:
        return 'FieldType.SELECT'
    if 'nik' in tag_lower:
        return 'FieldType.NIK'
    return 'FieldType.TEXT'

def generate_label(tag):
    # Remove 'form_' prefix and format as Title Case
    label = tag.lower().replace('form_', '').replace('_', ' ').title()
    return label

ts_code = """import { PrismaClient, FieldType } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('Starting seed for Surat DNA (Extracted from Excel)...');

  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.error('No Desa found! Please seed Desa first.');
    return;
  }
  const desaId = desa.id;

"""

for index, row in df.iterrows():
    if pd.isna(row['Daftar Tag Isian']) or pd.isna(row['Nama Surat']): 
        continue
    
    nama_surat = str(row['Nama Surat']).strip()
    kode_surat = str(row['Kode Surat']).strip()
    
    # Simple heuristic for category based on name
    kategori = "Umum"
    if "Kependudukan" in nama_surat or "Domisili" in nama_surat or "Pindah" in nama_surat:
        kategori = "Kependudukan & Domisili"
    elif "Nikah" in nama_surat or "Kelahiran" in nama_surat or "Kematian" in nama_surat:
        kategori = "Keluarga & Kehidupan"
    elif "Usaha" in nama_surat or "Izin" in nama_surat:
        kategori = "Usaha & Ekonomi"
    elif "Mampu" in nama_surat or "Penghasilan" in nama_surat:
        kategori = "Sosial & Kesejahteraan"
    
    is_mandiri = 'true' if str(row.get('Mandiri (Self-Service)', '')).strip().lower() == 'ya' else 'false'
    
    tags = [t.strip().lower() for t in str(row['Daftar Tag Isian']).split(';')]
    form_tags = sorted(list(set([t for t in tags if t.startswith('form_')])))
    
    fields_ts = []
    for i, tag in enumerate(form_tags):
        field_type = determine_field_type(tag)
        label = generate_label(tag)
        
        options_str = "null"
        if tag == "form_jenis_kelamin":
            options_str = 'JSON.stringify(["Laki-laki", "Perempuan"])'
            
        fields_ts.append(f"""
        await prisma.fieldDefinition.upsert({{
          where: {{ layananId_key: {{ layananId: layanan.id, key: '{tag}' }} }},
          update: {{ label: '{label}', type: {field_type}, required: true, options: {options_str}, orderIndex: {i + 1} }},
          create: {{ layananId: layanan.id, key: '{tag}', label: '{label}', type: {field_type}, required: true, options: {options_str}, orderIndex: {i + 1} }}
        }});
        """)
        
    ts_code += f"""
  {{
    const slug = generateSlug(`{nama_surat}`);
    const layanan = await prisma.layanan.upsert({{
      where: {{ desaId_kode: {{ desaId: desaId, kode: '{kode_surat}' }} }},
      update: {{ nama: `{nama_surat}`, slug: slug, kategori: '{kategori}', isMandiri: {is_mandiri}, requiresDocument: true }},
      create: {{ desaId: desaId, kode: '{kode_surat}', nama: `{nama_surat}`, slug: slug, kategori: '{kategori}', isMandiri: {is_mandiri}, requiresDocument: true }}
    }});
    
    await prisma.dokumenDefinition.upsert({{
      where: {{ layananId_kode: {{ layananId: layanan.id, kode: '{kode_surat}' }} }},
      update: {{ nama: `{nama_surat}`, slug: slug }},
      create: {{ layananId: layanan.id, kode: '{kode_surat}', nama: `{nama_surat}`, slug: slug }}
    }});
    
    {''.join(fields_ts)}
    console.log(`Seeded: {nama_surat} with {len(form_tags)} DNA fields`);
  }}
"""

ts_code += """
  console.log('Surat DNA seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
"""

with open('D:/mitradesa/apps/api/prisma/seed-surat-dna.ts', 'w') as f:
    f.write(ts_code)

print("TypeScript seed script generated successfully!")
