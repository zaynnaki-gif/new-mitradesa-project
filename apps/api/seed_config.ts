import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfigs = [
  // 1. IDENTITAS (Identity)
  { groupName: 'IDENTITY', key: 'NAMA_DESA', value: 'Seruni Mumbul', value_type: 'STRING', description: 'Nama Resmi Desa', isSystem: false },
  { groupName: 'IDENTITY', key: 'KEPALA_DESA', value: 'Bapak Kepala', value_type: 'STRING', description: 'Nama Lengkap Kepala Desa', isSystem: false },
  { groupName: 'IDENTITY', key: 'NIP_KEPALA_DESA', value: '-', value_type: 'STRING', description: 'NIP Kepala Desa', isSystem: false },
  { groupName: 'IDENTITY', key: 'ALAMAT_BALAI', value: 'Jl. Raya Seruni Mumbul', value_type: 'STRING', description: 'Alamat Kantor Desa', isSystem: false },
  { groupName: 'IDENTITY', key: 'LOGO_DESA_URL', value: '/logo.png', value_type: 'STRING', description: 'URL Logo Desa', isSystem: false },
  { groupName: 'IDENTITY', key: 'KONTAK_TELEPON', value: '081234567890', value_type: 'STRING', description: 'Nomor Telepon Desa', isSystem: false },
  
  // 2. PERSURATAN (Mail)
  { groupName: 'PERSURATAN', key: 'FORMAT_NOMOR_SURAT', value: '{nomor}/{kode_klasifikasi}/429.114.03/{tahun}', value_type: 'STRING', description: 'Format nomor surat otomatis', isSystem: false },
  { groupName: 'PERSURATAN', key: 'TTD_DEFAULT_ID', value: '1', value_type: 'STRING', description: 'ID Penandatangan Default (Kepala Desa)', isSystem: false },
  { groupName: 'PERSURATAN', key: 'KOP_SURAT_AKTIF', value: 'true', value_type: 'BOOLEAN', description: 'Gunakan Kop Surat pada cetakan', isSystem: false },
  
  // 3. PENGGUNA & AKSES (Users/Roles)
  { groupName: 'USERS', key: 'PENDAFTARAN_MANDIRI', value: 'true', value_type: 'BOOLEAN', description: 'Izinkan warga mendaftar akun mandiri', isSystem: false },
  { groupName: 'USERS', key: 'DEFAULT_WARGA_ROLE', value: 'WARGA', value_type: 'STRING', description: 'Role default untuk pendaftaran warga', isSystem: false },
  
  // 4. NOTIFIKASI WHATSAPP (Notifications)
  { groupName: 'NOTIFICATION', key: 'FONNTE_API_KEY', value: '', value_type: 'STRING', description: 'API Key Fonnte untuk WhatsApp Gateway', isSystem: false },
  { groupName: 'NOTIFICATION', key: 'WA_GATEWAY_STATUS', value: 'DISCONNECTED', value_type: 'STRING', description: 'Status koneksi WhatsApp Gateway', isSystem: true },
  { groupName: 'NOTIFICATION', key: 'TEMPLATE_WA_SUBMIT', value: 'Halo {nama}, permohonan surat {jenis_surat} Anda berhasil diajukan.', value_type: 'STRING', description: 'Template pesan submit permohonan', isSystem: false },
  { groupName: 'NOTIFICATION', key: 'TEMPLATE_WA_SELESAI', value: 'Halo {nama}, surat {jenis_surat} Anda telah selesai diproses dan siap diambil.', value_type: 'STRING', description: 'Template pesan permohonan selesai', isSystem: false },
  
  // 5. LAYANAN WARGA (Services)
  { groupName: 'SERVICES', key: 'JAM_BUKA_LAYANAN', value: '08:00', value_type: 'STRING', description: 'Jam mulai operasional layanan', isSystem: false },
  { groupName: 'SERVICES', key: 'JAM_TUTUP_LAYANAN', value: '15:00', value_type: 'STRING', description: 'Jam tutup operasional layanan', isSystem: false },
  { groupName: 'SERVICES', key: 'PESAN_LAYANAN_TUTUP', value: 'Mohon maaf, layanan online saat ini sedang tutup. Silakan kembali pada jam kerja.', value_type: 'STRING', description: 'Pesan saat layanan di luar jam buka', isSystem: false },
  
  // 6. KEAMANAN (Security)
  { groupName: 'SECURITY', key: 'MAX_LOGIN_ATTEMPTS', value: '5', value_type: 'NUMBER', description: 'Batas maksimal percobaan login', isSystem: false },
  { groupName: 'SECURITY', key: 'SESSION_EXPIRE_MINUTES', value: '120', value_type: 'NUMBER', description: 'Batas waktu expired sesi (menit)', isSystem: false },
  
  // 7. BACKUP & MAINTENANCE (Backup)
  { groupName: 'SYSTEM', key: 'MAINTENANCE_MODE', value: 'false', value_type: 'BOOLEAN', description: 'Aktifkan mode maintenance', isSystem: false },
  { groupName: 'SYSTEM', key: 'MAINTENANCE_MESSAGE', value: 'Sistem sedang dalam perbaikan rutin. Mohon kembali beberapa saat lagi.', value_type: 'STRING', description: 'Pesan untuk mode maintenance', isSystem: false },
  { groupName: 'SYSTEM', key: 'LAST_BACKUP_DATE', value: '', value_type: 'STRING', description: 'Waktu backup terakhir (otomatis)', isSystem: true },
  { groupName: 'SYSTEM', key: 'BACKUP_STATUS', value: 'OK', value_type: 'STRING', description: 'Status backup sistem', isSystem: true },
  
  // 8. KEPENDUDUKAN (Demographics)
  { groupName: 'DEMOGRAPHICS', key: 'AUTO_SYNC_DATA', value: 'true', value_type: 'BOOLEAN', description: 'Sinkronisasi data otomatis dengan dukcapil (jika ada API)', isSystem: false },
  { groupName: 'DEMOGRAPHICS', key: 'ALERT_DATA_TIDAK_VALID', value: 'true', value_type: 'BOOLEAN', description: 'Tampilkan peringatan jika NIK/KK tidak valid formatnya', isSystem: false },
  
  // 9. KEUANGAN/APBDes (Finance)
  { groupName: 'FINANCE', key: 'TAHUN_ANGGARAN_AKTIF', value: '2026', value_type: 'NUMBER', description: 'Tahun anggaran keuangan aktif', isSystem: false },
  { groupName: 'FINANCE', key: 'FORMAT_LAPORAN', value: 'RINGKAS', value_type: 'STRING', description: 'Format tampilan laporan keuangan (RINGKAS/DETAIL)', isSystem: false },
  
  // 10. KESEHATAN (Health)
  { groupName: 'HEALTH', key: 'JADWAL_POSYANDU_DEFAULT', value: 'Setiap tanggal 15', value_type: 'STRING', description: 'Jadwal rutin posyandu default', isSystem: false },
  { groupName: 'HEALTH', key: 'PENGINGAT_POSYANDU_HMIN', value: '1', value_type: 'NUMBER', description: 'Kirim pengingat WA otomatis H- (hari) sebelum jadwal', isSystem: false },
  
  // 11. PORTAL WEB (Portal/CMS)
  { groupName: 'PORTAL', key: 'TEMA_WARNA_UTAMA', value: '#10b981', value_type: 'STRING', description: 'Warna utama untuk portal web (hex)', isSystem: false },
  { groupName: 'PORTAL', key: 'HERO_IMAGE_URL', value: '/hero.jpg', value_type: 'STRING', description: 'URL gambar besar di halaman utama', isSystem: false },
  { groupName: 'PORTAL', key: 'STATUS_PORTAL', value: 'PUBLIK', value_type: 'STRING', description: 'Status visibilitas portal (PUBLIK/PRIVAT)', isSystem: false },
  
  // 12. BANSOS & ADUAN (Social/Complaints)
  { groupName: 'SOSIAL', key: 'AUTO_REPLY_ADUAN', value: 'Terima kasih, laporan aduan Anda telah kami terima dan akan segera ditindaklanjuti.', value_type: 'STRING', description: 'Teks balasan otomatis aduan', isSystem: false },
  { groupName: 'SOSIAL', key: 'MAKSIMAL_BANSOS_PER_KK', value: '1', value_type: 'NUMBER', description: 'Batas maksimal pengajuan bansos aktif per Kartu Keluarga', isSystem: false },
];

async function seedConfigs() {
  console.log('Seeding missing configurations...');
  for (const config of defaultConfigs) {
    const existing = await prisma.configuration.findUnique({
      where: {
        groupName_key: {
          groupName: config.groupName,
          key: config.key
        }
      }
    });

    if (!existing) {
      await prisma.configuration.create({
        data: config
      });
      console.log(`Created config: ${config.key}`);
    } else {
      console.log(`Config ${config.key} already exists, skipping.`);
    }
  }
  console.log('Seeding done.');
}

seedConfigs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
