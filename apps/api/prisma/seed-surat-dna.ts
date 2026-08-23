/**
 * Seed Surat DNA - Enhanced Field Definitions
 * Complete field definitions for all letter types including FILE upload fields
 * Run: cd apps/api && npx tsx prisma/seed-surat-dna.ts
 */

import { PrismaClient, FieldType } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Helper to upsert a field
async function upsertField(
  layananId: bigint,
  key: string,
  data: {
    label: string;
    type: FieldType;
    required: boolean;
    options?: string | null;
    orderIndex: number;
  }
) {
  await prisma.fieldDefinition.upsert({
    where: { layananId_key: { layananId, key } },
    update: data,
    create: { layananId, key, ...data }
  });
}

// Add standard upload fields (E-KTP and KK) at the end
async function addStandardUploads(layananId: bigint, startOrder: number) {
  await upsertField(layananId, 'upload_ektp', {
    label: 'Foto E-KTP',
    type: FieldType.FILE,
    required: true,
    orderIndex: startOrder
  });
  await upsertField(layananId, 'upload_kk', {
    label: 'Foto Kartu Keluarga',
    type: FieldType.FILE,
    required: true,
    orderIndex: startOrder + 1
  });
}

async function main() {
  console.log('🚀 Starting enhanced seed for Surat DNA...\n');
  console.log('📋 Target: all letter types with complete field definitions\n');

  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.error('❌ No Desa found! Please seed Village first.');
    return;
  }
  const desaId = desa.id;
  console.log(`✅ Using Village ID: ${desaId}\n`);

  let deactivated = 0;
  let fieldsAdded = 0;

  // ============================================================
  // SECTION A: Non-aktifkan Duplikat
  // ============================================================
  console.log('--- Phase A: Deactivating duplicates ---');

  // S-41 Keterangan Domisili → duplikat S-16
  const s41 = await prisma.layanan.findFirst({ where: { kode: 'S-41', desaId: BigInt(desaId.toString()) } });
  if (s41) {
    await prisma.layanan.update({ where: { id: s41.id }, data: { isActive: false } });
    console.log('❌ S-41 Keterangan Domisili → nonaktif (duplikat S-16)');
    deactivated++;
  }

  // S-11 Keterangan Kurang Mampu → duplikat SKTM
  const s11 = await prisma.layanan.findFirst({ where: { kode: 'S-11', desaId: BigInt(desaId.toString()) } });
  if (s11) {
    await prisma.layanan.update({ where: { id: s11.id }, data: { isActive: false } });
    console.log('❌ S-11 Keterangan Kurang Mampu → nonaktif (duplikat SKTM)');
    deactivated++;
  }

  // 500 Keterangan Usaha → duplikat SKU 510.0
  const kode500 = await prisma.layanan.findFirst({ where: { kode: '500', desaId: BigInt(desaId.toString()) } });
  if (kode500) {
    await prisma.layanan.update({ where: { id: kode500.id }, data: { isActive: false } });
    console.log('❌ 500 Keterangan Usaha → nonaktif (duplikat SKU)');
    deactivated++;
  }

  // S-02 Keterangan Penduduk → duplikat S-01
  const s02 = await prisma.layanan.findFirst({ where: { kode: 'S-02', desaId: BigInt(desaId.toString()) } });
  if (s02) {
    await prisma.layanan.update({ where: { id: s02.id }, data: { isActive: false } });
    console.log('❌ S-02 Keterangan Penduduk → nonaktif (duplikat S-01)');
    deactivated++;
  }

  console.log(`\n✅ Deactivated ${deactivated} duplicate letter types\n`);

  // ============================================================
  // SECTION B: Lengkapi Field yang Minim/Kosong
  // ============================================================
  console.log('--- Phase B: Completing minimal fields ---\n');

  // ---- S-01 Keterangan Pengantar ----
  {
    const slug = generateSlug('Keterangan Pengantar');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-01' } },
      update: { nama: 'Keterangan Pengantar', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-01', nama: 'Keterangan Pengantar', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-01' } },
      update: { nama: 'Keterangan Pengantar', slug },
      create: { layananId: layanan.id, kode: 'S-01', nama: 'Keterangan Pengantar', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_keperluan', { label: 'Keperluan/Tujuan Surat', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_instansi', { label: 'Instansi yang Dituju', type: FieldType.TEXT, required: true, orderIndex: 2 });
    await addStandardUploads(layanan.id, 3);
    fieldsAdded += 4;
    console.log('✅ S-01 Keterangan Pengantar → 4 fields (keperluan, instansi, uploads)');
  }

  // ---- S-07 Pengantar SKCK ----
  {
    const slug = generateSlug('Pengantar Surat Keterangan Catatan Kepolisian');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-07' } },
      update: { nama: 'Pengantar SKCK', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-07', nama: 'Pengantar SKCK', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-07' } },
      update: { nama: 'Pengantar SKCK', slug },
      create: { layananId: layanan.id, kode: 'S-07', nama: 'Pengantar SKCK', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_keperluan', {
      label: 'Keperluan SKCK',
      type: FieldType.SELECT,
      required: true,
      options: JSON.stringify(['Melamar Kerja', 'Keperluan Pernikahan', 'Keperluan Administrasi', 'Lainnya']),
      orderIndex: 1
    });
    await upsertField(layanan.id, 'form_catatan', { label: 'Catatan Tambahan', type: FieldType.TEXTAREA, required: false, orderIndex: 2 });
    await addStandardUploads(layanan.id, 3);
    fieldsAdded += 4;
    console.log('✅ S-07 Pengantar SKCK → 4 fields (keperluan SELECT, catatan, uploads)');
  }

  // ---- S-08 Keterangan KTP dalam Proses ----
  {
    const slug = generateSlug('Keterangan KTP dalam Proses');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-08' } },
      update: { nama: 'Keterangan KTP dalam Proses', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-08', nama: 'Keterangan KTP dalam Proses', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-08' } },
      update: { nama: 'Keterangan KTP dalam Proses', slug },
      create: { layananId: layanan.id, kode: 'S-08', nama: 'Keterangan KTP dalam Proses', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_no_perekaman', { label: 'Nomor Bukti Perekaman', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_tanggal_perekaman', { label: 'Tanggal Perekaman', type: FieldType.DATE, required: true, orderIndex: 2 });
    await upsertField(layanan.id, 'form_keperluan', { label: 'Keperluan', type: FieldType.TEXT, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'upload_bukti_perekaman', { label: 'Foto Bukti Perekaman', type: FieldType.FILE, required: true, orderIndex: 4 });
    await upsertField(layanan.id, 'upload_kk', { label: 'Foto Kartu Keluarga', type: FieldType.FILE, required: true, orderIndex: 5 });
    fieldsAdded += 5;
    console.log('✅ S-08 KTP dalam Proses → 5 fields (no_perekaman, tanggal, uploads)');
  }

  // ---- S-16 Keterangan Domisili Usaha ----
  {
    const slug = generateSlug('Keterangan Domisili Usaha');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-16' } },
      update: { nama: 'Keterangan Domisili Usaha', slug, kategori: 'Usaha & Ekonomi', isMandiri: true, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-16', nama: 'Keterangan Domisili Usaha', slug, kategori: 'Usaha & Ekonomi', isMandiri: true, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-16' } },
      update: { nama: 'Keterangan Domisili Usaha', slug },
      create: { layananId: layanan.id, kode: 'S-16', nama: 'Keterangan Domisili Usaha', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_nama_usaha', { label: 'Nama Usaha', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_jenis_usaha', { label: 'Jenis Usaha', type: FieldType.TEXT, required: true, orderIndex: 2 });
    await upsertField(layanan.id, 'form_alamat_usaha', { label: 'Alamat Usaha', type: FieldType.TEXTAREA, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'form_sejak_tahun', { label: 'Beroperasi Sejak Tahun', type: FieldType.TEXT, required: false, orderIndex: 4 });
    await upsertField(layanan.id, 'form_keperluan', { label: 'Keperluan', type: FieldType.TEXT, required: true, orderIndex: 5 });
    await addStandardUploads(layanan.id, 6);
    fieldsAdded += 7;
    console.log('✅ S-16 Domisili Usaha → 7 fields (nama, jenis, alamat, sejak_tahun, uploads)');
  }

  // ---- S-19 Pernyataan Belum Memiliki Akta Lahir ----
  {
    const slug = generateSlug('Pernyataan Belum Memiliki Akta Lahir');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-19' } },
      update: { nama: 'Pernyataan Belum Memiliki Akta Lahir', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-19', nama: 'Pernyataan Belum Memiliki Akta Lahir', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-19' } },
      update: { nama: 'Pernyataan Belum Memiliki Akta Lahir', slug },
      create: { layananId: layanan.id, kode: 'S-19', nama: 'Pernyataan Belum Memiliki Akta Lahir', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_nama_bayi', { label: 'Nama Bayi', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_tanggal_lahir_bayi', { label: 'Tanggal Lahir Bayi', type: FieldType.DATE, required: true, orderIndex: 2 });
    await upsertField(layanan.id, 'form_tempat_lahir_bayi', { label: 'Tempat Lahir Bayi', type: FieldType.TEXT, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'form_nama_ibu', { label: 'Nama Ibu Kandung', type: FieldType.TEXT, required: true, orderIndex: 4 });
    await upsertField(layanan.id, 'form_nama_ayah', { label: 'Nama Ayah Kandung', type: FieldType.TEXT, required: true, orderIndex: 5 });
    await upsertField(layanan.id, 'form_keperluan', { label: 'Keperluan Surat', type: FieldType.TEXT, required: true, orderIndex: 6 });
    await upsertField(layanan.id, 'upload_ektp_ibu', { label: 'Foto E-KTP Ibu', type: FieldType.FILE, required: true, orderIndex: 7 });
    await upsertField(layanan.id, 'upload_kk', { label: 'Foto Kartu Keluarga', type: FieldType.FILE, required: true, orderIndex: 8 });
    fieldsAdded += 8;
    console.log('✅ S-19 Belum Punya Akta Lahir → 8 fields (bayi, orang tua, uploads)');
  }

  // ---- S-30 Keterangan Pergi Kawin ----
  {
    const slug = generateSlug('Keterangan Pergi Kawin');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-30' } },
      update: { nama: 'Keterangan Pergi Kawin', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-30', nama: 'Keterangan Pergi Kawin', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-30' } },
      update: { nama: 'Keterangan Pergi Kawin', slug },
      create: { layananId: layanan.id, kode: 'S-30', nama: 'Keterangan Pergi Kawin', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_keperluan', { label: 'Keperluan', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_tujuan_negara', { label: 'Tujuan Negara', type: FieldType.TEXT, required: true, orderIndex: 2 });
    await upsertField(layanan.id, 'form_nama_calon_pasangan', { label: 'Nama Calon Pasangan', type: FieldType.TEXT, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'form_tanggal_rencana_nikah', { label: 'Tanggal Rencana Pernikahan', type: FieldType.DATE, required: true, orderIndex: 4 });
    await upsertField(layanan.id, 'form_tempat_rencana_nikah', { label: 'Tempat Pernikahan', type: FieldType.TEXT, required: true, orderIndex: 5 });
    await addStandardUploads(layanan.id, 6);
    fieldsAdded += 7;
    console.log('✅ S-30 Pergi Kawin → 7 fields (tujuan, pasangan, rencana, uploads)');
  }

  // ---- S-32 Keterangan Wali Hakim ----
  {
    const slug = generateSlug('Keterangan Wali Hakim');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-32' } },
      update: { nama: 'Keterangan Wali Hakim', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-32', nama: 'Keterangan Wali Hakim', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-32' } },
      update: { nama: 'Keterangan Wali Hakim', slug },
      create: { layananId: layanan.id, kode: 'S-32', nama: 'Keterangan Wali Hakim', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_nama_wali', { label: 'Nama Wali', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_hubungan_wali', {
      label: 'Hubungan Wali',
      type: FieldType.SELECT,
      required: true,
      options: JSON.stringify(['Paman', 'Kakek', 'Saudara Laki-laki', 'Wali Court', 'Lainnya']),
      orderIndex: 2
    });
    await upsertField(layanan.id, 'form_sebab_wali_hakim', { label: 'Alasan Wali Hakim', type: FieldType.TEXTAREA, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'form_nama_calon_suami', { label: 'Nama Calon Suami', type: FieldType.TEXT, required: true, orderIndex: 4 });
    await upsertField(layanan.id, 'upload_ektp_wali', { label: 'Foto E-KTP Wali', type: FieldType.FILE, required: true, orderIndex: 5 });
    await upsertField(layanan.id, 'upload_kk', { label: 'Foto Kartu Keluarga', type: FieldType.FILE, required: true, orderIndex: 6 });
    fieldsAdded += 6;
    console.log('✅ S-32 Wali Hakim → 6 fields (wali, hubungan, alasan, uploads)');
  }

  // ---- S-34 Permohonan Cerai ----
  {
    const slug = generateSlug('Permohonan Cerai');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-34' } },
      update: { nama: 'Permohonan Cerai', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-34', nama: 'Permohonan Cerai', slug, kategori: 'Keluarga', isMandiri: false, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-34' } },
      update: { nama: 'Permohonan Cerai', slug },
      create: { layananId: layanan.id, kode: 'S-34', nama: 'Permohonan Cerai', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_nama_pasangan', { label: 'Nama Pasangan', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_tanggal_nikah', { label: 'Tanggal Pernikahan', type: FieldType.DATE, required: true, orderIndex: 2 });
    await upsertField(layanan.id, 'form_nomor_akta_nikah', { label: 'Nomor Akta Nikah', type: FieldType.TEXT, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'form_sebab_cerai', {
      label: 'Sebab Cerai',
      type: FieldType.SELECT,
      required: true,
      options: JSON.stringify(['Pertengkaran', 'KDRT', 'Penelantaran', 'Lainnya']),
      orderIndex: 4
    });
    await upsertField(layanan.id, 'form_uraian_sebab', { label: 'Uraian Sendo-serah Cerai', type: FieldType.TEXTAREA, required: true, orderIndex: 5 });
    await upsertField(layanan.id, 'upload_ektp', { label: 'Foto E-KTP', type: FieldType.FILE, required: true, orderIndex: 6 });
    await upsertField(layanan.id, 'upload_akta_nikah', { label: 'Scan/Foto Akta Nikah', type: FieldType.FILE, required: true, orderIndex: 7 });
    fieldsAdded += 7;
    console.log('✅ S-34 Permohonan Cerai → 7 fields (pasangan, nikah, sebab, uploads)');
  }

  // ---- S-43 Pengantar Buku Pas Lintas ----
  {
    const slug = generateSlug('Pengantar Buku Pas Lintas');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-43' } },
      update: { nama: 'Pengantar Buku Pas Lintas', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-43', nama: 'Pengantar Buku Pas Lintas', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true, isActive: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-43' } },
      update: { nama: 'Pengantar Buku Pas Lintas', slug },
      create: { layananId: layanan.id, kode: 'S-43', nama: 'Pengantar Buku Pas Lintas', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_tujuan_negara', { label: 'Tujuan Negara', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_keperluan', {
      label: 'Keperluan',
      type: FieldType.SELECT,
      required: true,
      options: JSON.stringify(['Bekerja', 'Belajar', 'Wisata', 'Kunjungan Keluarga', 'Lainnya']),
      orderIndex: 2
    });
    await upsertField(layanan.id, 'form_lama_tinggal', { label: 'Estimasi Lama Tinggal (bulan)', type: FieldType.TEXT, required: false, orderIndex: 3 });
    await addStandardUploads(layanan.id, 4);
    fieldsAdded += 5;
    console.log('✅ S-43 Buku Pas Lintas → 5 fields (tujuan, keperluan SELECT, lama_tinggal, uploads)');
  }

  // ---- S-05 Keterangan Jual Beli - Fix field names ----
  {
    const slug = generateSlug('Keterangan Jual Beli');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: 'S-05' } },
      update: { nama: 'Keterangan Jual Beli', slug, kategori: 'Umum', isMandiri: false, requiresDocument: true },
      create: { desaId: BigInt(desaId.toString()), kode: 'S-05', nama: 'Keterangan Jual Beli', slug, kategori: 'Umum', isMandiri: false, requiresDocument: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: 'S-05' } },
      update: { nama: 'Keterangan Jual Beli', slug },
      create: { layananId: layanan.id, kode: 'S-05', nama: 'Keterangan Jual Beli', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    await upsertField(layanan.id, 'form_nama_penjual', { label: 'Nama Penjual', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_alamat_penjual', { label: 'Alamat Penjual', type: FieldType.TEXTAREA, required: true, orderIndex: 2 });
    await upsertField(layanan.id, 'form_nama_pembeli', { label: 'Nama Pembeli', type: FieldType.TEXT, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'form_jenis_barang', { label: 'Jenis/Kategori Tanah/Bangunan', type: FieldType.TEXT, required: true, orderIndex: 4 });
    await upsertField(layanan.id, 'form_luas', { label: 'Luas (m²)', type: FieldType.NUMBER, required: true, orderIndex: 5 });
    await upsertField(layanan.id, 'form_harga', { label: 'Harga Transaksi (Rp)', type: FieldType.NUMBER, required: true, orderIndex: 6 });
    await upsertField(layanan.id, 'form_keterangan', { label: 'Keterangan Lain', type: FieldType.TEXTAREA, required: false, orderIndex: 7 });
    fieldsAdded += 7;
    console.log('✅ S-05 Jual Beli → 7 fields (penjual, pembeli, tanah, harga)');
  }

  // ---- 471.1 Keterangan Beda Identitas - Reorder ----
  {
    const slug = generateSlug('Keterangan Beda Identitas');
    const layanan = await prisma.layanan.upsert({
      where: { desaId_kode: { desaId: BigInt(desaId.toString()), kode: '471.1' } },
      update: { nama: 'Keterangan Beda Identitas', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true },
      create: { desaId: BigInt(desaId.toString()), kode: '471.1', nama: 'Keterangan Beda Identitas', slug, kategori: 'Umum', isMandiri: true, requiresDocument: true }
    });

    await prisma.dokumenDefinition.upsert({
      where: { layananId_kode: { layananId: layanan.id, kode: '471.1' } },
      update: { nama: 'Keterangan Beda Identitas', slug },
      create: { layananId: layanan.id, kode: '471.1', nama: 'Keterangan Beda Identitas', slug }
    });

    await prisma.fieldDefinition.deleteMany({ where: { layananId: layanan.id } });

    // Data diri
    await upsertField(layanan.id, 'form_nama', { label: 'Nama Lengkap', type: FieldType.TEXT, required: true, orderIndex: 1 });
    await upsertField(layanan.id, 'form_tempat_lahir', { label: 'Tempat Lahir', type: FieldType.TEXT, required: true, orderIndex: 2 });
    await upsertField(layanan.id, 'form_tanggal_lahir', { label: 'Tanggal Lahir', type: FieldType.DATE, required: true, orderIndex: 3 });
    await upsertField(layanan.id, 'form_jenis_kelamin', {
      label: 'Jenis Kelamin',
      type: FieldType.SELECT,
      required: true,
      options: JSON.stringify(['Laki-laki', 'Perempuan']),
      orderIndex: 4
    });
    await upsertField(layanan.id, 'form_agama', { label: 'Agama', type: FieldType.TEXT, required: true, orderIndex: 5 });
    await upsertField(layanan.id, 'form_pekerjaan', { label: 'Pekerjaan', type: FieldType.TEXT, required: true, orderIndex: 6 });
    await upsertField(layanan.id, 'form_alamat', { label: 'Alamat Lengkap', type: FieldType.TEXTAREA, required: true, orderIndex: 7 });

    // Identitas lama
    await upsertField(layanan.id, 'form_nama_kartu', { label: 'Nama di Kartu Identitas', type: FieldType.TEXT, required: true, orderIndex: 8 });
    await upsertField(layanan.id, 'form_nomor_identitas', { label: 'Nomor KTP Lama', type: FieldType.NUMBER, required: true, orderIndex: 9 });

    // Perbedaan
    await upsertField(layanan.id, 'form_perbedaan', { label: 'Kolom/Isi yang Berbeda', type: FieldType.TEXTAREA, required: true, orderIndex: 10 });
    fieldsAdded += 10;
    console.log('✅ 471.1 Beda Identitas → 10 fields (reordered: data_diri → identitas_lama → perbedaan)');
  }

  console.log(`\n📊 Summary`);
  console.log(`   ✅ Nonaktif: ${deactivated} duplikat`);
  console.log(`   ✅ Fields ditambahkan: ${fieldsAdded}`);
  console.log('\n🎉 Seed selesai!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
