import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const desa = await prisma.desa.findFirst();
  if (!desa) {
    console.error('Desa not found. Please run main seed first.');
    return;
  }

  const umkms = [
    {
      desaId: desa.id,
      nama: 'Kerajinan Bambu Pak Budi',
      slug: 'kerajinan-bambu-pak-budi',
      deskripsi: 'Produk kerajinan tangan dari bambu berkualitas tinggi, mulai dari kursi, meja, hingga hiasan dinding. Semua produk dibuat oleh pengrajin lokal berpengalaman.',
      kategori: 'Kerajinan',
      gambarUrl: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80',
      harga: 'Rp 50.000 - Rp 500.000',
      kontak: '6281234567890',
      pemilik: 'Budi Santoso',
      isAktif: true,
    },
    {
      desaId: desa.id,
      nama: 'Kripik Singkong Ibu Ani',
      slug: 'kripik-singkong-ibu-ani',
      deskripsi: 'Kripik singkong renyah dengan berbagai varian rasa: original, balado, keju, dan jagung manis. Cocok untuk camilan keluarga.',
      kategori: 'Kuliner',
      gambarUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&q=80',
      harga: 'Rp 15.000 / bungkus',
      kontak: '6281987654321',
      pemilik: 'Ani Sulastri',
      isAktif: true,
    },
    {
      desaId: desa.id,
      nama: 'Wisata Air Terjun Curug Luhur',
      slug: 'wisata-air-terjun-curug-luhur',
      deskripsi: 'Destinasi wisata alam yang menawarkan keindahan air terjun dengan udara yang segar. Terdapat fasilitas gazebo, warung makan, dan area parkir luas.',
      kategori: 'Wisata',
      gambarUrl: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80',
      harga: 'Tiket masuk Rp 10.000 / orang',
      kontak: '6285233344455',
      pemilik: 'BUMDes Maju Bersama',
      isAktif: true,
    },
    {
      desaId: desa.id,
      nama: 'Jasa Bengkel Motor "Lancar Jaya"',
      slug: 'jasa-bengkel-motor-lancar-jaya',
      deskripsi: 'Melayani servis berkala, ganti oli, ganti ban, dan perbaikan mesin motor dari berbagai merek. Teknisi handal dan harga terjangkau.',
      kategori: 'Jasa',
      gambarUrl: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80',
      harga: 'Tergantung jenis layanan',
      kontak: '6281344455566',
      pemilik: 'Ahmad Faisal',
      isAktif: true,
    }
  ];

  for (const umkm of umkms) {
    await prisma.umkm.upsert({
      where: { slug: umkm.slug },
      update: umkm,
      create: umkm,
    });
  }

  console.log('Seed UMKM selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
