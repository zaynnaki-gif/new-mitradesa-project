import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfigs = [
  // NOTIFIKASI
  { groupName: 'NOTIFICATION', key: 'FONNTE_API_KEY', value: '', value_type: 'STRING', description: 'API Key Fonnte untuk WhatsApp Gateway', isSystem: false },
  { groupName: 'NOTIFICATION', key: 'WA_GATEWAY_STATUS', value: 'DISCONNECTED', value_type: 'STRING', description: 'Status koneksi WhatsApp Gateway', isSystem: true },
  { groupName: 'NOTIFICATION', key: 'TEMPLATE_WA_SUBMIT', value: 'Halo {nama}, permohonan surat {jenis_surat} Anda berhasil diajukan.', value_type: 'STRING', description: 'Template pesan submit', isSystem: false },
  
  // PERSURATAN
  { groupName: 'PERSURATAN', key: 'FORMAT_NOMOR_SURAT', value: '{nomor}/{kode_klasifikasi}/429.114.03/{tahun}', value_type: 'STRING', description: 'Format nomor surat otomatis', isSystem: false },
  { groupName: 'PERSURATAN', key: 'TAHUN_ANGGARAN', value: '2026', value_type: 'NUMBER', description: 'Tahun anggaran berjalan', isSystem: false },
  { groupName: 'PERSURATAN', key: 'PUBLIC_WEB_URL', value: 'https://serunimumbul.com', value_type: 'STRING', description: 'URL web publik (digunakan di QR Verifikasi)', isSystem: false },
  
  // KEAMANAN
  { groupName: 'SECURITY', key: 'RATE_LIMIT_ENABLED', value: 'true', value_type: 'BOOLEAN', description: 'Aktifkan pembatasan rate limit API', isSystem: false },
  { groupName: 'SECURITY', key: 'RATE_LIMIT_MAX', value: '100', value_type: 'NUMBER', description: 'Maksimum request per 15 menit', isSystem: false },
  { groupName: 'SECURITY', key: 'GRACE_PERIOD_HOURS', value: '24', value_type: 'NUMBER', description: 'Batas waktu link recovery', isSystem: false },
  
  // BACKUP
  { groupName: 'SYSTEM', key: 'LAST_BACKUP_DATE', value: '', value_type: 'STRING', description: 'Waktu backup terakhir (otomatis)', isSystem: true },
  { groupName: 'SYSTEM', key: 'BACKUP_STATUS', value: 'OK', value_type: 'STRING', description: 'Status backup sistem', isSystem: true },
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
