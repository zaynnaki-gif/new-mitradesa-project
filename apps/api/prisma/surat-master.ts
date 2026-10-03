/**
 * Master Database Surat Desa
 * 
 * Auto-fill fields (handled by backend/frontend state):
 * - penduduk_id, penduduk_name, kewarganegaraan, tempat_tanggal_lahir, jenis_kelamin, agama,
 *   status_pernikahan, status_dalam_keluarga, golongan_darah, pekerjaan.
 * - alamat lengkap (format: [dusun] [rt/rw] [desa] [kecamatan] [kabupaten] [provinsi] [kodepos])
 * - tanggal_surat
 * 
 * No. Registrasi format: [kode]/[nomor urut]/KDS.SRMB/[bulan romawi]/[tahun]
 */

export type FieldDef = { key: string; label: string; type: string; required?: boolean; placeholder?: string; colSpan?: number; options?: string[]; };

export type SuratMaster = {
  code: string;
  name: string;
  category: string;
  wewenang: boolean;
  description: string;
  eta: string;
  fields: FieldDef[];
  syarat: string[];
  kodeKlasifikasi: string;
};

// Base DNA fields that apply to all letters
const BASE_DNA_FIELDS: FieldDef[] = [
  { key: "nomor_whatsapp", label: "Nomor WhatsApp Pemohon", type: "text", required: true, placeholder: "08..." },
  { key: "keperluan", label: "Keperluan / Keterangan", type: "textarea", required: true, colSpan: 2 },
  { key: "tujuan", label: "Tujuan (Instansi/Pihak Dituju)", type: "text", required: false, colSpan: 2 },
  { key: "lampiran_identitas", label: "Lampiran E-KTP / KK", type: "file", required: true, colSpan: 2 },
  { key: "lampiran_selfie", label: "Foto Selfie Bersama Identitas", type: "file", required: true, colSpan: 2 }
];

export const SURAT_MASTER: Record<string, SuratMaster> = {
  SKD: {
    code: "SKD",
    name: "Surat Keterangan Domisili",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan domisili.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.4",
    fields: [...BASE_DNA_FIELDS, { key: "lama_tinggal", label: "Lama Berdomisili", type: "text" }]
  },

  PINDAH_DOMISILI: {
    code: "PINDAH_DOMISILI",
    name: "Surat Keterangan Pindah Domisili",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan pindah domisili.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "475",
    fields: [...BASE_DNA_FIELDS, { key: "provinsi_tujuan", label: "Provinsi Tujuan", type: "text" }, { key: "kabupaten_tujuan", label: "Kabupaten Tujuan", type: "text" }, { key: "kecamatan_tujuan", label: "Kecamatan Tujuan", type: "text" }, { key: "desa_tujuan", label: "Desa/Kelurahan Tujuan", type: "text" }, { key: "alamat_tujuan", label: "Alamat Tujuan Lengkap", type: "textarea", colSpan: 2 }, { key: "alasan_pindah", label: "Alasan Pindah", type: "select", options: ["Pekerjaan", "Pendidikan", "Keluarga", "Keamanan", "Lainnya"] }, { key: "jumlah_pengikut", label: "Jumlah Pengikut", type: "number" }]
  },

  PENDATANG: {
    code: "PENDATANG",
    name: "Surat Keterangan Pendatang",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan pendatang.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "475.1",
    fields: [...BASE_DNA_FIELDS, { key: "asal", label: "Alamat Asal", type: "textarea", colSpan: 2 }, { key: "alasan_datang", label: "Alasan Datang", type: "text" }]
  },

  BEDA_IDENTITAS: {
    code: "BEDA_IDENTITAS",
    name: "Surat Keterangan Beda Identitas",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan beda identitas.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: [...BASE_DNA_FIELDS, { key: "dokumen1", label: "Nama Dokumen 1 (Contoh: KTP)", type: "text" }, { key: "data1", label: "Data di Dokumen 1", type: "text" }, { key: "dokumen2", label: "Nama Dokumen 2 (Contoh: Ijazah)", type: "text" }, { key: "data2", label: "Data di Dokumen 2", type: "text" }]
  },

  KELAHIRAN: {
    code: "KELAHIRAN",
    name: "Surat Keterangan Kelahiran",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan kelahiran.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.1",
    fields: [...BASE_DNA_FIELDS, { key: "nama_bayi", label: "Nama Bayi", type: "text" }, { key: "jenis_kelamin_bayi", label: "Jenis Kelamin Bayi", type: "select", options: ["Laki-laki", "Perempuan"] }, { key: "hari_lahir", label: "Hari Lahir", type: "text" }, { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date" }, { key: "tempat_lahir", label: "Tempat Lahir", type: "text" }, { key: "anak_ke", label: "Anak Ke-", type: "number" }, { key: "berat_bayi", label: "Berat Bayi (kg)", type: "number" }, { key: "panjang_bayi", label: "Panjang Bayi (cm)", type: "number" }, { key: "nama_ayah", label: "Nama Ayah", type: "text" }, { key: "nama_ibu", label: "Nama Ibu", type: "text" }]
  },

  KEMATIAN: {
    code: "KEMATIAN",
    name: "Surat Keterangan Kematian",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan kematian.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: [...BASE_DNA_FIELDS, { key: "nama_almarhum", label: "Nama Almarhum/ah", type: "text" }, { key: "hari_meninggal", label: "Hari Meninggal", type: "text" }, { key: "tanggal_meninggal", label: "Tanggal Meninggal", type: "date" }, { key: "tempat_meninggal", label: "Tempat Meninggal", type: "text" }, { key: "penyebab_kematian", label: "Penyebab Kematian", type: "text" }]
  },

  KEHILANGAN_KK: {
    code: "KEHILANGAN_KK",
    name: "Surat Pengantar Kehilangan KK",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar kehilangan kk.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: BASE_DNA_FIELDS
  },

  KEHILANGAN_KTP: {
    code: "KEHILANGAN_KTP",
    name: "Surat Pengantar Kehilangan KTP",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar kehilangan ktp.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: BASE_DNA_FIELDS
  },

  PERMOHONAN_KTP: {
    code: "PERMOHONAN_KTP",
    name: "Surat Pengantar Pembuatan KTP",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar pembuatan ktp.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: BASE_DNA_FIELDS
  },

  PERMOHONAN_KK: {
    code: "PERMOHONAN_KK",
    name: "Surat Pengantar Pembuatan KK",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar pembuatan kk.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: BASE_DNA_FIELDS
  },

  PENGANTAR_NIKAH: {
    code: "PENGANTAR_NIKAH",
    name: "Surat Pengantar Nikah (N1-N4)",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar nikah (n1-n4).",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: [...BASE_DNA_FIELDS, { key: "status_pernikahan_calon", label: "Status Pernikahan Calon", type: "select", options: ["Perjaka", "Perawan", "Duda", "Janda"] }, { key: "nama_pasangan", label: "Nama Calon Pasangan", type: "text" }, { key: "nama_ayah", label: "Nama Ayah Kandung", type: "text" }, { key: "nama_ibu", label: "Nama Ibu Kandung", type: "text" }]
  },

  BELUM_MENIKAH: {
    code: "BELUM_MENIKAH",
    name: "Surat Keterangan Belum Menikah",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan belum menikah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: BASE_DNA_FIELDS
  },

  STATUS_JANDA_DUDA: {
    code: "STATUS_JANDA_DUDA",
    name: "Surat Keterangan Status Janda / Duda",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan status janda / duda.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: [...BASE_DNA_FIELDS, { key: "status", label: "Status", type: "select", options: ["Janda Cerai Hidup", "Janda Cerai Mati", "Duda Cerai Hidup", "Duda Cerai Mati"] }, { key: "nama_mantan", label: "Nama Mantan Pasangan", type: "text" }]
  },

  AHLI_WARIS: {
    code: "AHLI_WARIS",
    name: "Surat Keterangan Ahli Waris",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan ahli waris.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: [...BASE_DNA_FIELDS, { key: "nama_almarhum", label: "Nama Pewaris (Meninggal)", type: "text" }, { key: "tanggal_meninggal", label: "Tanggal Meninggal Pewaris", type: "date" }]
  },

  IZIN_ORANGTUA: {
    code: "IZIN_ORANGTUA",
    name: "Surat Keterangan Izin Orang Tua",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan izin orang tua.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: [...BASE_DNA_FIELDS, { key: "nama_anak", label: "Nama Anak", type: "text" }, { key: "tujuan_izin", label: "Keperluan Izin (Misal: Menikah/Kerja)", type: "text" }]
  },

  IZIN_SUAMI_ISTRI: {
    code: "IZIN_SUAMI_ISTRI",
    name: "Surat Keterangan Izin Suami/Istri",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan izin suami/istri.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: [...BASE_DNA_FIELDS, { key: "tujuan_izin", label: "Keperluan Izin (Misal: Pinjaman/Kerja)", type: "text" }]
  },

  WALI_HAKIM: {
    code: "WALI_HAKIM",
    name: "Surat Keterangan Wali Hakim",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan wali hakim.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: [...BASE_DNA_FIELDS, { key: "alasan_wali_hakim", label: "Alasan Menggunakan Wali Hakim", type: "textarea", colSpan: 2 }]
  },

  DISPENSASI_NIKAH: {
    code: "DISPENSASI_NIKAH",
    name: "Surat Dispensasi Nikah (PA)",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat dispensasi nikah (pa).",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: BASE_DNA_FIELDS
  },

  RUJUK: {
    code: "RUJUK",
    name: "Surat Pengantar Rujuk",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar rujuk.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: [...BASE_DNA_FIELDS, { key: "nama_mantan", label: "Nama Mantan Pasangan", type: "text" }]
  },

  SKU: {
    code: "SKU",
    name: "Surat Keterangan Usaha (SKU)",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan usaha (sku).",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "510",
    fields: [...BASE_DNA_FIELDS, { key: "nama_usaha", label: "Nama Usaha", type: "text" }, { key: "jenis_usaha", label: "Bidang/Jenis Usaha", type: "text" }, { key: "alamat_usaha", label: "Alamat Usaha", type: "textarea", colSpan: 2 }, { key: "tahun_berdiri", label: "Tahun Mulai Usaha", type: "number" }]
  },

  SKTM: {
    code: "SKTM",
    name: "Surat Keterangan Tidak Mampu (SKTM)",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan tidak mampu (sktm).",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "401",
    fields: [...BASE_DNA_FIELDS, { key: "penghasilan", label: "Penghasilan Rata-rata per Bulan", type: "number" }, { key: "no_dtks", label: "Nomor DTKS", type: "text", required: false }, { key: "tujuan_sktm", label: "Tujuan SKTM", type: "text" }]
  },

  PENGHASILAN: {
    code: "PENGHASILAN",
    name: "Surat Keterangan Penghasilan",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan penghasilan.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "974",
    fields: [...BASE_DNA_FIELDS, { key: "penghasilan", label: "Jumlah Penghasilan", type: "number" }]
  },

  PROFESI: {
    code: "PROFESI",
    name: "Surat Keterangan Profesi",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan profesi.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "500",
    fields: [...BASE_DNA_FIELDS, { key: "jenis_profesi", label: "Jenis Profesi (Petani/Nelayan/Pedagang/PNS/dll)", type: "text" }]
  },

  TANGGUNGAN_KELUARGA: {
    code: "TANGGUNGAN_KELUARGA",
    name: "Surat Keterangan Tanggungan Keluarga",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan tanggungan keluarga.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "401",
    fields: [...BASE_DNA_FIELDS, { key: "jumlah_tanggungan", label: "Jumlah Tanggungan", type: "number" }]
  },

  BELUM_KERJA: {
    code: "BELUM_KERJA",
    name: "Surat Keterangan Belum Bekerja",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan belum bekerja.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "401",
    fields: BASE_DNA_FIELDS
  },

  TANAH_MILIK: {
    code: "TANAH_MILIK",
    name: "Surat Keterangan Kepemilikan Tanah",
    category: "Pertanahan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan kepemilikan tanah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "593",
    fields: [...BASE_DNA_FIELDS, { key: "luas_tanah", label: "Luas Tanah (m2)", type: "number" }, { key: "lokasi_tanah", label: "Lokasi Tanah (Dusun/Jalan)", type: "text" }, { key: "batas_utara", label: "Batas Utara", type: "text" }, { key: "batas_selatan", label: "Batas Selatan", type: "text" }, { key: "batas_timur", label: "Batas Timur", type: "text" }, { key: "batas_barat", label: "Batas Barat", type: "text" }]
  },

  TANAH_TIDAK_SENGKETA: {
    code: "TANAH_TIDAK_SENGKETA",
    name: "Surat Keterangan Tidak Sengketa Tanah",
    category: "Pertanahan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan tidak sengketa tanah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "593",
    fields: [...BASE_DNA_FIELDS, { key: "luas_tanah", label: "Luas Tanah (m2)", type: "number" }, { key: "lokasi_tanah", label: "Lokasi Tanah", type: "text" }]
  },

  HARGA_TANAH: {
    code: "HARGA_TANAH",
    name: "Surat Keterangan Harga Tanah",
    category: "Pertanahan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan harga tanah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "593",
    fields: [...BASE_DNA_FIELDS, { key: "lokasi_tanah", label: "Lokasi Tanah", type: "text" }, { key: "taksiran_harga", label: "Taksiran Harga (Per m2)", type: "number" }]
  },

  JUAL_BELI_TANAH: {
    code: "JUAL_BELI_TANAH",
    name: "Surat Pengantar Jual Beli Tanah",
    category: "Pertanahan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar jual beli tanah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "593",
    fields: [...BASE_DNA_FIELDS, { key: "luas_tanah", label: "Luas Tanah (m2)", type: "number" }, { key: "lokasi_tanah", label: "Lokasi Tanah", type: "text" }, { key: "nama_pembeli", label: "Nama Pembeli", type: "text" }]
  },

  RUMAH_MILIK: {
    code: "RUMAH_MILIK",
    name: "Surat Keterangan Kepemilikan Rumah",
    category: "Pertanahan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan kepemilikan rumah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "593",
    fields: [...BASE_DNA_FIELDS, { key: "lokasi_rumah", label: "Lokasi Rumah", type: "text" }]
  },

  BELUM_PUNYA_RUMAH: {
    code: "BELUM_PUNYA_RUMAH",
    name: "Surat Keterangan Belum Memiliki Rumah",
    category: "Pertanahan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan belum memiliki rumah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "593",
    fields: BASE_DNA_FIELDS
  },

  PENGANTAR_SKCK: {
    code: "PENGANTAR_SKCK",
    name: "Surat Pengantar SKCK",
    category: "Keamanan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar skck.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "331",
    fields: BASE_DNA_FIELDS
  },

  IZIN_KERAMAIAN: {
    code: "IZIN_KERAMAIAN",
    name: "Surat Pengantar Izin Keramaian",
    category: "Keamanan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar izin keramaian.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "331",
    fields: [...BASE_DNA_FIELDS, { key: "jenis_acara", label: "Jenis Acara", type: "text" }, { key: "tanggal_acara", label: "Tanggal Pelaksanaan", type: "date" }, { key: "lokasi_acara", label: "Lokasi Pelaksanaan", type: "textarea", colSpan: 2 }]
  },

  BEPERGIAN: {
    code: "BEPERGIAN",
    name: "Surat Keterangan Bepergian / Jalan",
    category: "Keamanan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan bepergian / jalan.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "331",
    fields: [...BASE_DNA_FIELDS, { key: "kota_tujuan", label: "Kota/Kabupaten Tujuan", type: "text" }, { key: "tanggal_berangkat", label: "Tanggal Keberangkatan", type: "date" }]
  },

  BERSIH_DIRI: {
    code: "BERSIH_DIRI",
    name: "Surat Keterangan Bersih Diri",
    category: "Keamanan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan bersih diri.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "331",
    fields: BASE_DNA_FIELDS
  },

  CATATAN_KEPOLISIAN: {
    code: "CATATAN_KEPOLISIAN",
    name: "Surat Pengantar Catatan Kepolisian",
    category: "Keamanan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar catatan kepolisian.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "331",
    fields: BASE_DNA_FIELDS
  },

  LAPOR_HAJATAN: {
    code: "LAPOR_HAJATAN",
    name: "Surat Pengantar Lapor Hajatan",
    category: "Keamanan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar lapor hajatan.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "331",
    fields: [...BASE_DNA_FIELDS, { key: "jenis_hajatan", label: "Jenis Hajatan", type: "text" }, { key: "tanggal_hajatan", label: "Tanggal Pelaksanaan", type: "date" }]
  },

  BEASISWA: {
    code: "BEASISWA",
    name: "Surat Keterangan untuk Beasiswa",
    category: "Pendidikan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan untuk beasiswa.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "420",
    fields: [...BASE_DNA_FIELDS, { key: "nama_anak", label: "Nama Anak (Penerima)", type: "text" }, { key: "sekolah_kampus", label: "Nama Sekolah/Perguruan Tinggi", type: "text" }]
  },

  AKTIF_SEKOLAH: {
    code: "AKTIF_SEKOLAH",
    name: "Surat Keterangan Aktif Sekolah",
    category: "Pendidikan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan aktif sekolah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "420",
    fields: [...BASE_DNA_FIELDS, { key: "nama_sekolah", label: "Nama Sekolah", type: "text" }, { key: "kelas", label: "Kelas / Semester", type: "text" }]
  },

  PENELITIAN: {
    code: "PENELITIAN",
    name: "Surat Pengantar Penelitian/KKN",
    category: "Pendidikan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar penelitian/kkn.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "420",
    fields: [...BASE_DNA_FIELDS, { key: "nama_instansi", label: "Asal Universitas/Instansi", type: "text" }, { key: "judul_penelitian", label: "Judul Penelitian", type: "textarea", colSpan: 2 }]
  },

  PUTUS_SEKOLAH: {
    code: "PUTUS_SEKOLAH",
    name: "Surat Keterangan Putus Sekolah",
    category: "Pendidikan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan putus sekolah.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "420",
    fields: [...BASE_DNA_FIELDS, { key: "sekolah_terakhir", label: "Sekolah Terakhir", type: "text" }]
  },

  AWAM: {
    code: "AWAM",
    name: "Surat Keterangan Umum",
    category: "Umum",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan umum.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "470",
    fields: BASE_DNA_FIELDS
  },

  BEDA_TANGGAL_LAHIR: {
    code: "BEDA_TANGGAL_LAHIR",
    name: "Surat Keterangan Beda Tanggal Lahir",
    category: "Umum",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan beda tanggal lahir.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474",
    fields: [...BASE_DNA_FIELDS, { key: "dokumen1", label: "Nama Dokumen 1 (Contoh: KTP)", type: "text" }, { key: "data1", label: "Tanggal di Dokumen 1", type: "date" }, { key: "dokumen2", label: "Nama Dokumen 2 (Contoh: Ijazah)", type: "text" }, { key: "data2", label: "Tanggal di Dokumen 2", type: "date" }]
  },

  PENGANTAR_TKI: {
    code: "PENGANTAR_TKI",
    name: "Surat Pengantar Calon TKI/PMI",
    category: "Umum",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar calon tki/pmi.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "560",
    fields: [...BASE_DNA_FIELDS, { key: "negara_tujuan", label: "Negara Tujuan", type: "text" }, { key: "nama_pt", label: "Nama PT / Penyalur", type: "text" }]
  },

  KEHILANGAN_UMUM: {
    code: "KEHILANGAN_UMUM",
    name: "Surat Keterangan Kehilangan Umum",
    category: "Umum",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan kehilangan umum.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "470",
    fields: [...BASE_DNA_FIELDS, { key: "barang_hilang", label: "Barang yang Hilang", type: "textarea", colSpan: 2 }, { key: "lokasi_hilang", label: "Perkiraan Lokasi Kehilangan", type: "text" }]
  },

  BEDA_NAMA: {
    code: "BEDA_NAMA",
    name: "Surat Keterangan Beda Nama",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan beda nama.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.3",
    fields: [...BASE_DNA_FIELDS, { key: "nama_dokumen1", label: "Nama di Dokumen 1 (misal: KTP)", type: "text" }, { key: "nama_dokumen2", label: "Nama di Dokumen 2 (misal: KK)", type: "text" }]
  },

  DOMISILI_USAHA: {
    code: "DOMISILI_USAHA",
    name: "Surat Keterangan Domisili Usaha (SKDU)",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan domisili usaha (skdu).",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "510",
    fields: [...BASE_DNA_FIELDS, { key: "nama_perusahaan", label: "Nama Perusahaan/Usaha", type: "text" }, { key: "jenis_usaha", label: "Jenis Usaha", type: "text" }, { key: "alamat_usaha", label: "Alamat Usaha", type: "textarea", colSpan: 2 }]
  },

  PINDAH_LUAR_DAERAH: {
    code: "PINDAH_LUAR_DAERAH",
    name: "Surat Pengantar Pindah Antar Provinsi/Kabupaten",
    category: "Kependudukan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar pindah antar provinsi/kabupaten.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "475",
    fields: [...BASE_DNA_FIELDS, { key: "provinsi_tujuan", label: "Provinsi Tujuan", type: "text" }, { key: "kabupaten_tujuan", label: "Kabupaten Tujuan", type: "text" }, { key: "kecamatan_tujuan", label: "Kecamatan Tujuan", type: "text" }, { key: "desa_tujuan", label: "Desa/Kelurahan Tujuan", type: "text" }, { key: "alamat_tujuan", label: "Alamat Tujuan Lengkap", type: "textarea", colSpan: 2 }, { key: "alasan_pindah", label: "Alasan Pindah", type: "select", options: ["Pekerjaan", "Pendidikan", "Keluarga", "Keamanan", "Lainnya"] }, { key: "jumlah_pengikut", label: "Jumlah Pengikut", type: "number" }]
  },

  CERAI_MATI: {
    code: "CERAI_MATI",
    name: "Surat Keterangan Cerai Mati",
    category: "Pernikahan & Keluarga",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan cerai mati.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "474.2",
    fields: [...BASE_DNA_FIELDS, { key: "nama_almarhum", label: "Nama Almarhum/ah Pasangan", type: "text" }, { key: "tanggal_meninggal", label: "Tanggal Meninggal", type: "date" }]
  },

  JUAL_BELI_HEWAN: {
    code: "JUAL_BELI_HEWAN",
    name: "Surat Keterangan Jual Beli Hewan/Ternak",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan jual beli hewan/ternak.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "524",
    fields: [...BASE_DNA_FIELDS, { key: "jenis_hewan", label: "Jenis Hewan (Sapi/Kambing/dll)", type: "text" }, { key: "ciri_ciri_hewan", label: "Ciri-ciri Hewan (Warna/Tanduk/Umur)", type: "textarea", colSpan: 2 }, { key: "nama_pembeli", label: "Nama Pembeli", type: "text" }]
  },

  TANAH_SPORADIK: {
    code: "TANAH_SPORADIK",
    name: "Surat Keterangan Penguasaan Tanah Sporadik",
    category: "Pertanahan",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan penguasaan tanah sporadik.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "593",
    fields: [...BASE_DNA_FIELDS, { key: "letak_tanah", label: "Letak Tanah (Dusun/Jalan)", type: "text" }, { key: "luas_tanah", label: "Luas Tanah (m2)", type: "number" }, { key: "batas_utara", label: "Batas Utara", type: "text" }, { key: "batas_selatan", label: "Batas Selatan", type: "text" }, { key: "batas_barat", label: "Batas Barat", type: "text" }, { key: "batas_timur", label: "Batas Timur", type: "text" }]
  },

  TIDAK_PUNYA_KENDARAAN: {
    code: "TIDAK_PUNYA_KENDARAAN",
    name: "Surat Keterangan Tidak Memiliki Kendaraan",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat keterangan tidak memiliki kendaraan.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "401",
    fields: BASE_DNA_FIELDS
  },

  PENGANTAR_PENGOBATAN: {
    code: "PENGANTAR_PENGOBATAN",
    name: "Surat Pengantar Pengobatan RS/Puskesmas",
    category: "Sosial & Ekonomi",
    wewenang: true,
    description: "Surat Keterangan resmi dari desa untuk keperluan surat pengantar pengobatan rs/puskesmas.",
    eta: "1 hari kerja",
    syarat: ["Fotokopi KTP", "Fotokopi KK"],
    kodeKlasifikasi: "440",
    fields: [...BASE_DNA_FIELDS, { key: "nama_faskes", label: "Nama Fasilitas Kesehatan Tujuan", type: "text" }, { key: "keluhan_penyakit", label: "Keluhan/Penyakit", type: "text" }]
  }

};export function getSuratMaster(code: string): SuratMaster | undefined { return SURAT_MASTER[code]; }
