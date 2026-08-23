/**
 * PATCH: Penyempurnaan Field Jenis Surat
 * 
 * 1. Hapus permanen duplikat (S-02, S-11, kode 500)
 * 2. Lengkapi field yang kosong/minim
 * 3. Tambahkan upload_ektp + upload_kk (required) di semua surat
 * 4. Perbaiki label & struktur field yang tidak rapi
 */
import { PrismaClient, FieldType } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertField(
  layananId: bigint,
  key: string,
  label: string,
  type: FieldType,
  orderIndex: number,
  opts: {
    required?: boolean;
    options?: string[] | null;
    placeholder?: string;
    description?: string;
  } = {}
) {
  const { required = true, options = null, placeholder, description } = opts;
  const optionsJson = options ? JSON.stringify(options) : null;
  return prisma.fieldDefinition.upsert({
    where: { layananId_key: { layananId, key } },
    update: { label, type, required, options: optionsJson, orderIndex, placeholder: placeholder ?? null, description: description ?? null },
    create: { layananId, key, label, type, required, options: optionsJson, orderIndex, placeholder: placeholder ?? null, description: description ?? null },
  });
}

/** Tambah field upload E-KTP & KK setelah field terakhir */
async function addUploadFields(layananId: bigint, startIndex: number) {
  await upsertField(layananId, 'upload_ektp', 'Foto E-KTP', FieldType.FILE, startIndex, {
    description: 'Upload foto E-KTP pemohon (JPG/PNG/PDF, maks 5MB)',
  });
  await upsertField(layananId, 'upload_kk', 'Foto Kartu Keluarga', FieldType.FILE, startIndex + 1, {
    description: 'Upload foto Kartu Keluarga (JPG/PNG/PDF, maks 5MB)',
  });
}

/** Hapus layanan beserta seluruh relasinya secara permanen */
async function deleteLayanan(desaId: bigint, kode: string) {
  const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode } } });
  if (!l) { console.log(`  SKIP delete ${kode} — tidak ditemukan`); return; }

  // Hapus dokumen definitions + field definitions
  const dokumens = await prisma.dokumenDefinition.findMany({ where: { layananId: l.id } });
  for (const d of dokumens) {
    await prisma.templatSurat?.deleteMany?.({ where: { dokumenId: d.id } }).catch(() => null);
    await prisma.dokumenDefinition.delete({ where: { id: d.id } });
  }
  await prisma.fieldDefinition.deleteMany({ where: { layananId: l.id } });
  await prisma.layanan.delete({ where: { id: l.id } });
  console.log(`  DELETED: ${kode} — ${l.nama}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== PATCH: Penyempurnaan Field Jenis Surat ===\n');

  const desa = await prisma.desa.findFirst();
  if (!desa) { console.error('No Desa found!'); return; }
  const desaId = desa.id;

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: Hapus permanen duplikat
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n[1] Menghapus duplikat jenis surat...');
  // S-02 "Keterangan Penduduk" — duplikat S-01 "Keterangan Pengantar"
  await deleteLayanan(desaId, 'S-02');
  // S-11 "Keterangan Kurang Mampu" — duplikat 465.0 SKTM
  await deleteLayanan(desaId, 'S-11');
  // kode 500 "Keterangan Usaha" lama — duplikat 510.0 SKU
  await deleteLayanan(desaId, '500');

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: Lengkapi & perbaiki field yang kosong/minim
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n[2] Melengkapi field jenis surat...\n');

  // ─── S-01: Keterangan Pengantar ─────────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-01' } } });
    if (l) {
      // Perbarui nama agar lebih deskriptif
      await prisma.layanan.update({ where: { id: l.id }, data: { nama: 'Surat Pengantar ke Instansi' } });
      await upsertField(l.id, 'form_keperluan', 'Keperluan / Tujuan Surat', FieldType.TEXT, 1, { placeholder: 'Contoh: Mengurus administrasi kependudukan' });
      await upsertField(l.id, 'form_tujuan_instansi', 'Instansi yang Dituju', FieldType.TEXT, 2, { placeholder: 'Contoh: Kantor Kecamatan, Rumah Sakit, dll' });
      await upsertField(l.id, 'form_catatan', 'Catatan Tambahan', FieldType.TEXTAREA, 3, { required: false, placeholder: 'Keterangan lain bila diperlukan' });
      await addUploadFields(l.id, 4);
      console.log('  ✓ S-01 Surat Pengantar ke Instansi — updated (5 fields + upload)');
    }
  }

  // ─── S-07: Pengantar SKCK ───────────────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-07' } } });
    if (l) {
      await prisma.layanan.update({ where: { id: l.id }, data: { nama: 'Pengantar SKCK (Surat Keterangan Catatan Kepolisian)' } });
      // Hapus field lama yang terlalu generik
      await prisma.fieldDefinition.deleteMany({ where: { layananId: l.id, key: 'form_keterangan' } });
      await upsertField(l.id, 'form_keperluan', 'Keperluan SKCK', FieldType.SELECT, 1, {
        options: ['Melamar Pekerjaan', 'Keperluan Pernikahan', 'Keperluan Administrasi', 'Melanjutkan Pendidikan', 'Keperluan Visa', 'Lainnya'],
      });
      await upsertField(l.id, 'form_catatan', 'Keterangan / Catatan', FieldType.TEXTAREA, 2, { required: false });
      await addUploadFields(l.id, 3);
      console.log('  ✓ S-07 Pengantar SKCK — updated (2 fields + upload)');
    }
  }

  // ─── S-08: Keterangan KTP dalam Proses ──────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-08' } } });
    if (l) {
      await upsertField(l.id, 'form_nomor_perekaman', 'Nomor Bukti Perekaman', FieldType.TEXT, 1, { placeholder: 'Nomor dari bukti perekaman KTP-el' });
      await upsertField(l.id, 'form_tanggal_perekaman', 'Tanggal Perekaman', FieldType.DATE, 2);
      await upsertField(l.id, 'form_keperluan', 'Keperluan', FieldType.TEXT, 3, { placeholder: 'Tujuan penggunaan surat ini' });
      // File upload: ganti KK dengan bukti perekaman
      await upsertField(l.id, 'upload_ektp', 'Foto Bukti Perekaman KTP-el', FieldType.FILE, 4, { description: 'Upload foto bukti perekaman dari Dukcapil' });
      await upsertField(l.id, 'upload_kk', 'Foto Kartu Keluarga', FieldType.FILE, 5);
      console.log('  ✓ S-08 Keterangan KTP dalam Proses — updated (3 fields + upload)');
    }
  }

  // ─── S-16: Keterangan Domisili Usaha ────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-16' } } });
    if (l) {
      await upsertField(l.id, 'form_nama_usaha', 'Nama Usaha', FieldType.TEXT, 1);
      await upsertField(l.id, 'form_jenis_usaha', 'Jenis Usaha', FieldType.SELECT, 2, {
        options: ['Perdagangan', 'Jasa', 'Pertanian', 'Kerajinan', 'Kuliner', 'Peternakan', 'Lainnya'],
      });
      await upsertField(l.id, 'form_alamat_usaha', 'Alamat Tempat Usaha', FieldType.TEXTAREA, 3);
      await upsertField(l.id, 'form_sejak_tahun', 'Beroperasi Sejak Tahun', FieldType.TEXT, 4, { placeholder: 'Contoh: 2020' });
      await upsertField(l.id, 'form_keperluan', 'Keperluan', FieldType.TEXT, 5, { placeholder: 'Tujuan pembuatan surat' });
      await addUploadFields(l.id, 6);
      console.log('  ✓ S-16 Keterangan Domisili Usaha — updated (5 fields + upload)');
    }
  }

  // ─── S-19: Pernyataan Belum Memiliki Akta Lahir ─────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-19' } } });
    if (l) {
      await upsertField(l.id, 'form_nama_bayi', 'Nama Bayi / Anak', FieldType.TEXT, 1);
      await upsertField(l.id, 'form_jenis_kelamin_bayi', 'Jenis Kelamin Bayi', FieldType.SELECT, 2, { options: ['Laki-laki', 'Perempuan'] });
      await upsertField(l.id, 'form_tanggal_lahir_bayi', 'Tanggal Lahir Bayi', FieldType.DATE, 3);
      await upsertField(l.id, 'form_tempat_lahir_bayi', 'Tempat Lahir Bayi', FieldType.TEXT, 4);
      await upsertField(l.id, 'form_nama_ibu', 'Nama Ibu', FieldType.TEXT, 5);
      await upsertField(l.id, 'form_nama_ayah', 'Nama Ayah', FieldType.TEXT, 6);
      await upsertField(l.id, 'form_keperluan', 'Keperluan', FieldType.TEXT, 7, { placeholder: 'Tujuan pembuatan pernyataan ini' });
      await upsertField(l.id, 'upload_ektp', 'Foto E-KTP Ibu', FieldType.FILE, 8, { description: 'Upload foto E-KTP ibu kandung' });
      await upsertField(l.id, 'upload_kk', 'Foto Kartu Keluarga', FieldType.FILE, 9);
      console.log('  ✓ S-19 Pernyataan Belum Memiliki Akta Lahir — updated (7 fields + upload)');
    }
  }

  // ─── S-30: Keterangan Pergi Kawin ───────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-30' } } });
    if (l) {
      await upsertField(l.id, 'form_keperluan', 'Keperluan', FieldType.TEXT, 1);
      await upsertField(l.id, 'form_tujuan', 'Tujuan / Tempat Pernikahan', FieldType.TEXT, 2);
      await upsertField(l.id, 'form_nama_calon_pasangan', 'Nama Calon Pasangan', FieldType.TEXT, 3);
      await upsertField(l.id, 'form_tanggal_rencana_nikah', 'Tanggal Rencana Pernikahan', FieldType.DATE, 4);
      await upsertField(l.id, 'form_agama', 'Agama', FieldType.SELECT, 5, { options: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'] });
      await addUploadFields(l.id, 6);
      console.log('  ✓ S-30 Keterangan Pergi Kawin — updated (5 fields + upload)');
    }
  }

  // ─── S-32: Keterangan Wali Hakim ────────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-32' } } });
    if (l) {
      await upsertField(l.id, 'form_nama_wali', 'Nama Wali', FieldType.TEXT, 1);
      await upsertField(l.id, 'form_hubungan_wali', 'Hubungan dengan Pemohon', FieldType.SELECT, 2, {
        options: ['Paman', 'Kakek', 'Saudara Laki-laki', 'Kakak Ipar', 'Lainnya'],
      });
      await upsertField(l.id, 'form_sebab_wali_hakim', 'Alasan Wali Hakim Diperlukan', FieldType.TEXTAREA, 3, {
        placeholder: 'Jelaskan mengapa diperlukan wali hakim',
      });
      await upsertField(l.id, 'form_nama_calon_suami', 'Nama Calon Suami', FieldType.TEXT, 4);
      await upsertField(l.id, 'form_tanggal_rencana_nikah', 'Tanggal Rencana Pernikahan', FieldType.DATE, 5);
      await upsertField(l.id, 'upload_ektp', 'Foto E-KTP Wali', FieldType.FILE, 6, { description: 'Upload foto E-KTP wali yang bersangkutan' });
      await upsertField(l.id, 'upload_kk', 'Foto Kartu Keluarga', FieldType.FILE, 7);
      console.log('  ✓ S-32 Keterangan Wali Hakim — updated (5 fields + upload)');
    }
  }

  // ─── S-34: Permohonan Cerai ──────────────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-34' } } });
    if (l) {
      // Hapus field lama yang terlalu minim
      await prisma.fieldDefinition.deleteMany({ where: { layananId: l.id, key: 'form_sebab_sebab' } });
      await upsertField(l.id, 'form_nama_pasangan', 'Nama Pasangan', FieldType.TEXT, 1);
      await upsertField(l.id, 'form_tanggal_nikah', 'Tanggal Pernikahan', FieldType.DATE, 2);
      await upsertField(l.id, 'form_nomor_akta_nikah', 'Nomor Akta Nikah', FieldType.TEXT, 3);
      await upsertField(l.id, 'form_sebab_cerai', 'Alasan Perceraian', FieldType.SELECT, 4, {
        options: ['Pertengkaran Terus-menerus', 'KDRT', 'Penelantaran', 'Tidak Ada Kecocokan', 'Lainnya'],
      });
      await upsertField(l.id, 'form_uraian_sebab', 'Uraian Alasan Perceraian', FieldType.TEXTAREA, 5);
      await upsertField(l.id, 'upload_ektp', 'Foto E-KTP', FieldType.FILE, 6);
      await upsertField(l.id, 'upload_akta_nikah', 'Foto / Scan Akta Nikah', FieldType.FILE, 7, { description: 'Upload foto atau scan akta nikah' });
      console.log('  ✓ S-34 Permohonan Cerai — updated (5 fields + upload)');
    }
  }

  // ─── S-35: Keterangan Pengantar Rujuk atau Cerai ─────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-35' } } });
    if (l) {
      await upsertField(l.id, 'form_jenis_permohonan', 'Jenis Permohonan', FieldType.SELECT, 1, { options: ['Rujuk', 'Cerai'] });
      await upsertField(l.id, 'form_nama_pasangan', 'Nama Pasangan', FieldType.TEXT, 2);
      await upsertField(l.id, 'form_nama_ayah', 'Nama Ayah Pemohon', FieldType.TEXT, 3);
      await upsertField(l.id, 'form_nomor_akta_nikah', 'Nomor Akta Nikah', FieldType.TEXT, 4);
      await upsertField(l.id, 'form_keterangan', 'Keterangan Tambahan', FieldType.TEXTAREA, 5, { required: false });
      await addUploadFields(l.id, 6);
      console.log('  ✓ S-35 Pengantar Rujuk atau Cerai — updated (5 fields + upload)');
    }
  }

  // ─── S-36: Permohonan Kartu Keluarga ─────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-36' } } });
    if (l) {
      await upsertField(l.id, 'form_jenis_permohonan', 'Jenis Permohonan', FieldType.SELECT, 1, {
        options: ['Permohonan KK Baru', 'Perubahan Data KK', 'Penggantian KK Hilang/Rusak', 'Pemisahan KK'],
      });
      await upsertField(l.id, 'form_alasan', 'Alasan / Keperluan', FieldType.TEXTAREA, 2, { placeholder: 'Jelaskan alasan permohonan' });
      await upsertField(l.id, 'form_no_kk_lama', 'Nomor KK Lama', FieldType.TEXT, 3, { required: false, placeholder: 'Isi jika ada KK sebelumnya' });
      await upsertField(l.id, 'upload_ektp', 'Foto E-KTP Kepala Keluarga', FieldType.FILE, 4);
      await upsertField(l.id, 'upload_kk', 'Foto KK Lama (jika ada)', FieldType.FILE, 5, { required: false, description: 'Upload KK lama jika perubahan/penggantian' });
      console.log('  ✓ S-36 Permohonan Kartu Keluarga — updated (3 fields + upload)');
    }
  }

  // ─── S-41: Permohonan Perubahan Kartu Keluarga ───────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-41' } } });
    if (l) {
      await upsertField(l.id, 'form_jenis_perubahan', 'Jenis Perubahan', FieldType.SELECT, 1, {
        options: ['Penambahan Anggota', 'Pengurangan Anggota', 'Perubahan Data', 'Pemisahan KK'],
      });
      await upsertField(l.id, 'form_no_kk', 'Nomor KK', FieldType.TEXT, 2);
      await upsertField(l.id, 'form_anggota_yang_berubah', 'Nama Anggota yang Berubah', FieldType.TEXT, 3);
      await upsertField(l.id, 'form_alasan', 'Alasan Perubahan', FieldType.TEXTAREA, 4);
      await addUploadFields(l.id, 5);
      console.log('  ✓ S-41 Permohonan Perubahan KK — updated (4 fields + upload)');
    }
  }

  // ─── S-43: Pengantar Buku Pas Lintas ────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-43' } } });
    if (l) {
      await upsertField(l.id, 'form_tujuan_negara', 'Negara Tujuan', FieldType.TEXT, 1, { placeholder: 'Contoh: Malaysia, Singapura' });
      await upsertField(l.id, 'form_keperluan', 'Keperluan', FieldType.SELECT, 2, {
        options: ['Bekerja', 'Belajar', 'Wisata', 'Kunjungan Keluarga', 'Umroh/Haji', 'Lainnya'],
      });
      await upsertField(l.id, 'form_lama_tinggal', 'Estimasi Lama Tinggal', FieldType.TEXT, 3, { placeholder: 'Contoh: 6 bulan, 1 tahun' });
      await addUploadFields(l.id, 4);
      console.log('  ✓ S-43 Pengantar Buku Pas Lintas — updated (3 fields + upload)');
    }
  }

  // ─── S-47: Surat Kuasa ───────────────────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-47' } } });
    if (l) {
      await prisma.layanan.update({ where: { id: l.id }, data: { nama: 'Surat Kuasa' } });
      await upsertField(l.id, 'form_nama_pemberi_kuasa', 'Nama Pemberi Kuasa', FieldType.TEXT, 1);
      await upsertField(l.id, 'form_nama_penerima_kuasa', 'Nama Penerima Kuasa', FieldType.TEXT, 2);
      await upsertField(l.id, 'form_hubungan', 'Hubungan dengan Pemberi Kuasa', FieldType.TEXT, 3, { placeholder: 'Contoh: Suami, Istri, Anak, dll' });
      await upsertField(l.id, 'form_untuk_keperluan', 'Untuk Keperluan', FieldType.TEXTAREA, 4, { placeholder: 'Jelaskan kuasa yang diberikan' });
      await addUploadFields(l.id, 5);
      console.log('  ✓ S-47 Surat Kuasa — updated (4 fields + upload)');
    }
  }

  // ─── S-03: Biodata Penduduk ──────────────────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-03' } } });
    if (l) {
      await upsertField(l.id, 'form_keperluan', 'Keperluan', FieldType.TEXT, 1, { placeholder: 'Tujuan pembuatan biodata' });
      await addUploadFields(l.id, 2);
      console.log('  ✓ S-03 Biodata Penduduk — updated (1 field + upload)');
    }
  }

  // ─── S-20: Permohonan Duplikat Kelahiran ────────────────────────────────
  {
    const l = await prisma.layanan.findUnique({ where: { desaId_kode: { desaId, kode: 'S-20' } } });
    if (l) {
      await upsertField(l.id, 'form_nama_anak', 'Nama Anak / Bayi', FieldType.TEXT, 1);
      await upsertField(l.id, 'form_tanggal_lahir', 'Tanggal Lahir', FieldType.DATE, 2);
      await upsertField(l.id, 'form_nomor_akta_lama', 'Nomor Akta Lahir Lama', FieldType.TEXT, 3, { required: false, placeholder: 'Jika masih ingat' });
      await upsertField(l.id, 'form_alasan', 'Alasan Duplikat', FieldType.SELECT, 4, { options: ['Hilang', 'Rusak', 'Tidak Punya Salinan'] });
      await addUploadFields(l.id, 5);
      console.log('  ✓ S-20 Permohonan Duplikat Kelahiran — updated (4 fields + upload)');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 3: Tambah upload_ektp + upload_kk ke SEMUA surat yang belum punya
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n[3] Menambahkan upload E-KTP/KK ke semua surat...\n');

  const allLayanan = await prisma.layanan.findMany({
    include: { fields: { orderBy: { orderIndex: 'desc' }, take: 1 } },
  });

  let uploadAdded = 0;
  for (const l of allLayanan) {
    const existingUploadEktp = await prisma.fieldDefinition.findFirst({
      where: { layananId: l.id, key: 'upload_ektp' },
    });
    if (!existingUploadEktp) {
      const lastIndex = l.fields[0]?.orderIndex ?? 0;
      await addUploadFields(l.id, lastIndex + 1);
      uploadAdded++;
      console.log(`  + Upload ditambahkan ke: ${l.kode} — ${l.nama}`);
    }
  }
  console.log(`\n  Total: upload E-KTP/KK ditambahkan ke ${uploadAdded} layanan`);

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 4: Perbaiki label & nama field yang tidak rapi
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n[4] Merapikan label field...\n');

  // S-42: label "Jurusanfakultasprodi" → "Jurusan / Fakultas / Prodi"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_jurusanfakultasprodi' },
    data: { label: 'Jurusan / Fakultas / Prodi' },
  });
  // S-42: "Kelassemester" → "Kelas / Semester"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_kelassemester' },
    data: { label: 'Kelas / Semester' },
  });
  // S-42: "Sekolahperguruan Tinggi" → "Nama Sekolah / Perguruan Tinggi"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_sekolahperguruan_tinggi' },
    data: { label: 'Nama Sekolah / Perguruan Tinggi' },
  });
  // S-42: "Nomor Induk Siswamahasiswa" → "Nomor Induk Siswa/Mahasiswa (NIS/NIM)"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_nomor_induk_siswamahasiswa' },
    data: { label: 'NIS / NIM (Nomor Induk Siswa/Mahasiswa)' },
  });
  // S-46: "Jabataninstansi" → "Jabatan / Instansi"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_jabataninstansi' },
    data: { label: 'Jabatan / Instansi' },
  });
  // S-48: "Merktype" → "Merk / Tipe Kendaraan"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_merktype' },
    data: { label: 'Merk / Tipe Kendaraan' },
  });
  // S-48: "Nomor Polisi" NUMBER → TEXT (plat nomor bukan angka murni)
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_nomor_polisi' },
    data: { type: FieldType.TEXT, label: 'Nomor Polisi (Plat)', placeholder: 'Contoh: B 1234 XY' } as any,
  });
  // S-48: "Nomor Bpkb" → "Nomor BPKB"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_nomor_bpkb' },
    data: { label: 'Nomor BPKB', type: FieldType.TEXT } as any,
  });
  // S-48: "Nomor Mesin" → TEXT
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_nomor_mesin' },
    data: { type: FieldType.TEXT } as any,
  });
  // S-48: "Nomor Rangka" → TEXT
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_nomor_rangka' },
    data: { type: FieldType.TEXT } as any,
  });
  // S-33: "Kecamatan Kua" → "Kecamatan KUA"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_kecamatan_kua' },
    data: { label: 'KUA Kecamatan yang Menikahkan' },
  });
  // S-33: "Tanggal Kawin" → "Tanggal Pernikahan"
  await prisma.fieldDefinition.updateMany({
    where: { key: 'form_tanggal_kawin' },
    data: { label: 'Tanggal Pernikahan' },
  });

  console.log('  ✓ Label field diperbaiki');

  console.log('\n=== PATCH SELESAI ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
