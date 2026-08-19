import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai seeding Agenda...');

  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.error('Tidak ada data desa. Jalankan seed desa terlebih dahulu.');
    return;
  }

  const existingAgenda = await prisma.agenda.count();
  if (existingAgenda > 0) {
    console.log('Data Agenda sudah ada. Menghapus data lama...');
    await prisma.agenda.deleteMany({});
  }

  const now = new Date();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  nextWeek.setHours(19, 0, 0, 0);

  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(22, 0, 0, 0);

  const pastWeek = new Date(now);
  pastWeek.setDate(now.getDate() - 7);
  pastWeek.setHours(8, 0, 0, 0);

  const pastWeekEnd = new Date(pastWeek);
  pastWeekEnd.setHours(15, 0, 0, 0);

  const agendaData = [
    {
      desaId: desa.id,
      judul: 'Penyaluran Bantuan Langsung Tunai (BLT) Dana Desa',
      slug: 'penyaluran-blt-dana-desa',
      deskripsi: 'Penyaluran BLT Dana Desa tahap ke-3 untuk warga yang telah terdaftar dan terverifikasi sebagai penerima manfaat.',
      lokasi: 'Balai Desa',
      penyelenggara: 'Pemerintah Desa',
      tanggalMulai: tomorrow,
      tanggalSelesai: tomorrowEnd,
      status: 'MENDATANG' as const,
    },
    {
      desaId: desa.id,
      judul: 'Rapat Musyawarah Rencana Pembangunan Desa (Musrenbangdes)',
      slug: 'rapat-musrenbangdes',
      deskripsi: 'Pembahasan rencana pembangunan desa untuk tahun anggaran berikutnya bersama tokoh masyarakat, BPD, dan perangkat desa.',
      lokasi: 'Aula Balai Desa',
      penyelenggara: 'BPD & Pemerintah Desa',
      tanggalMulai: nextWeek,
      tanggalSelesai: nextWeekEnd,
      status: 'MENDATANG' as const,
    },
    {
      desaId: desa.id,
      judul: 'Kerja Bakti Massal Pembersihan Irigasi',
      slug: 'kerja-bakti-pembersihan-irigasi',
      deskripsi: 'Kegiatan gotong royong seluruh warga untuk membersihkan saluran irigasi utama menjelang musim tanam.',
      lokasi: 'Saluran Irigasi Dusun 1 & 2',
      penyelenggara: 'Karang Taruna',
      tanggalMulai: pastWeek,
      tanggalSelesai: pastWeekEnd,
      status: 'SELESAI' as const,
    }
  ];

  for (const data of agendaData) {
    await prisma.agenda.create({
      data,
    });
  }

  console.log('Seeding Agenda berhasil!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
