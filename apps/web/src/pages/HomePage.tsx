import { PublicLayout } from '@/layouts';
import {
  HeroSection,
  StatementSection,
  SplitMediaSection,
  StatsSection,
  ServicesSection,
  FeatureSection,
  NewsSection,
  TimelineSection,
  GallerySection,
  CommunitySection,
  TransparencySection,
} from '@/components/editorial';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { useBeritaList } from '@/hooks/useBerita';
import { useLayananList } from '@/hooks/useLayanan';
import { useMediaList } from '@/hooks/useMedia';
import { usePerangkatDesa } from '@/hooks/usePerangkatDesa';
import { useUmkmList } from '@/hooks/useUmkm';
import { useAgendaList } from '@/hooks/useAgenda';
import { useApbdes } from '@/hooks/useTransparansi';
import { useStatistikDesa } from '@/hooks/useStatistikDesa';
import { APP_TAGLINE } from '@/lib/constants';
import '@/styles/editorial/editorial.css';

export default function HomePage() {
  const { data: identitas } = useIdentitasDesa();
  const { data: latestNews } = useBeritaList({ limit: 4 });
  const { data: services } = useLayananList({ limit: 6 });
  const { data: gallery } = useMediaList({ limit: 8 });
  const { data: perangkatDesa } = usePerangkatDesa();
  const { data: umkms } = useUmkmList({ limit: 3 });
  const { data: agendas } = useAgendaList(3);
  const { data: apbdes } = useApbdes();
  const { data: statistik } = useStatistikDesa();

  const villageName = identitas?.namaDesa || 'Desa';

  // SEO
  const pageTitle = getPageTitle(`${villageName} - Portal Informasi dan Pelayanan`);
  useSEO({
    title: pageTitle,
    description: `${villageName}. ${APP_TAGLINE}. Portal informasi dan layanan administrasi desa.`,
  });

  // Prepare hero data from API
  const heroData = {
    title: villageName,
    subtitle: APP_TAGLINE,
    eyebrow: 'Website Resmi',
    image: identitas?.logoDesaUrl
      ? { url: identitas.logoDesaUrl, alt: `Logo ${villageName}` }
      : undefined,
    location: {
      district: identitas?.desa?.kecamatan?.nama
        ? `Kecamatan ${identitas.desa.kecamatan.nama}`
        : undefined,
      city: identitas?.desa?.kecamatan?.kabupaten?.nama,
      province: identitas?.desa?.kecamatan?.kabupaten?.provinsi?.nama,
    },
  };

  // Prepare statement data
  const statementData = {
    eyebrow: 'Tentang Kami',
    title: `${villageName} — Bersama Membangun Desa`,
    body: `Website desa ini adalah pusat informasi resmi dan layanan digital untuk mewujudkan tata kelola desa yang transparan, inovatif, dan responsif terhadap kebutuhan warga. Kami berkomitmen untuk memberikan pelayanan terbaik bagi seluruh masyarakat.`,
  };

  // Prepare stats data from API
  const statsData = {
    eyebrow: 'Demografi',
    title: villageName,
    items: [
      {
        value: statistik?.penduduk?.total || 0,
        label: 'Penduduk',
      },
      {
        value: statistik?.keluarga || 0,
        label: 'Keluarga',
      },
      {
        value: statistik?.wilayah?.dusun || 0,
        label: 'Dusun',
      },
      {
        value: statistik?.wilayah?.rt || 0,
        label: 'RT',
      },
    ],
  };

  // Prepare services data from API
  const activeServices = services?.filter((s) => s.isActive).slice(0, 6) || [];
  const servicesData = {
    eyebrow: 'Layanan',
    title: 'Layanan Desa',
    link: { label: 'Semua Layanan', href: '/layanan' },
    items: activeServices.map((service) => ({
      id: service.id,
      slug: service.slug,
      nama: service.nama,
      kategori: service.kategori,
      deskripsi: service.deskripsi,
    })),
  };

  // Prepare featured UMKM
  const featuredUmkm = umkms?.[0];
  const featureData = {
    eyebrow: 'Potensi Desa',
    title: 'UMKM & Produk Lokal',
    body: 'Jelajahi produk dan jasa dari pelaku usaha mikro, kecil, dan menengah di desa kami.',
    image: featuredUmkm?.gambarUrl
      ? { url: featuredUmkm.gambarUrl, alt: featuredUmkm.nama }
      : undefined,
    link: { label: 'Lihat Semua UMKM', href: '/umkm' },
    items: umkms?.slice(1, 3).map((umkm) => ({
      id: umkm.id,
      nama: umkm.nama,
      deskripsi: umkm.deskripsi?.substring(0, 100),
      gambarUrl: umkm.gambarUrl || undefined,
    })) || [],
  };

  // Prepare news data from API
  const newsData = {
    eyebrow: 'Berita',
    title: 'Berita & Informasi',
    link: { label: 'Lihat Semua Berita', href: '/berita' },
    items:
      latestNews?.map((item) => ({
        id: item.id,
        slug: item.slug,
        judul: item.judul,
        excerpt: item.excerpt || undefined,
        gambarUrl: item.gambarUrl || undefined,
        kategori: item.kategori || undefined,
        publishedAt: item.publishedAt || undefined,
        createdAt: item.createdAt,
      })) || [],
  };

  // Prepare agenda data from API
  const agendaData = {
    eyebrow: 'Agenda',
    title: 'Jadwal Kegiatan',
    link: { label: 'Semua Agenda', href: '/agenda' },
    items:
      agendas?.map((agenda) => ({
        id: agenda.id,
        judul: agenda.judul,
        tanggalMulai: agenda.tanggalMulai,
        lokasi: agenda.lokasi,
        status: agenda.status,
      })) || [],
  };

  // Prepare gallery data from API
  const galleryData = {
    eyebrow: 'Galeri',
    title: 'Dokumentasi',
    link: { label: 'Lihat Semua Foto', href: '/galeri' },
    items:
      gallery?.map((item) => ({
        id: item.id,
        nama: item.nama,
        fileUrl: item.fileUrl,
        alt: item.alt || undefined,
      })) || [],
  };

  // Prepare community data from API
  const communityData = {
    eyebrow: 'Aparatur Desa',
    title: 'People of the Village',
    description:
      'Perangkat desa yang berkomitmen melayani masyarakat dengan sepenuh hati.',
    people:
      perangkatDesa?.slice(0, 4).map((person) => ({
        id: person.id,
        nama: person.nama,
        jabatan: person.jabatan,
        fotoUrl: person.fotoUrl || undefined,
      })) || [],
    link: { label: 'Selengkapnya', href: '/pemerintahan' },
  };

  // Prepare transparency data from API
  const transparencyData = {
    eyebrow: 'Transparansi',
    title: 'APBDes',
    description:
      'Anggaran Pendapatan dan Belanja Desa yang terbuka untuk publik.',
    pendapatan: apbdes?.totalPendapatan,
    belanja: apbdes?.totalBelanja,
    pembiayaan: apbdes?.totalPembiayaan,
    link: { label: 'Detail Transparansi', href: '/transparansi' },
  };

  // Split media section for village story
  const villageStoryData = {
    eyebrow: 'Profil',
    title: `${villageName} — Desa Masa Depan`,
    body: [
      'Desa kami terletak di wilayah yang strategis dengan potensi sumber daya alam dan manusia yang besar.',
      'Dengan semangat gotong royong, kami terus membangun desa untuk meningkatkan kesejahteraan masyarakat.',
    ],
    image: gallery?.[0]
      ? { url: gallery[0].fileUrl, alt: gallery[0].nama }
      : undefined,
    link: { label: 'Profil Lengkap', href: '/profil' },
  };

  return (
    <PublicLayout>
      {/* Section 01: Hero */}
      <HeroSection data={heroData} variant="default" />

      {/* Section 02: Village Statement */}
      <StatementSection data={statementData} variant="default" />

      {/* Section 03: Village Story - Split Media */}
      <SplitMediaSection data={villageStoryData} layout="image-left" />

      {/* Section 04: Village Statistics */}
      <StatsSection data={statsData} variant="minimal" />

      {/* Section 05: Services */}
      <ServicesSection data={servicesData} variant="list" />

      {/* Section 06: Potensi Desa - Feature */}
      <FeatureSection data={featureData} variant="default" />

      {/* Section 07: Community - People */}
      <CommunitySection data={communityData} />

      {/* Section 08: News / Stories */}
      <NewsSection data={newsData} variant="featured" />

      {/* Section 09: Agenda - Timeline */}
      <TimelineSection data={agendaData} variant="default" />

      {/* Section 10: Transparency */}
      <TransparencySection data={transparencyData} />

      {/* Section 11: Gallery */}
      <GallerySection data={galleryData} variant="masonry" />

      {/* Section 12: Final Statement */}
      <StatementSection
        data={{
          variant: 'quote',
          title: 'Desa bukan sekadar tempat tinggal. Desa adalah rumah kita bersama.',
          author: `${villageName}`,
        }}
        variant="quote"
      />
    </PublicLayout>
  );
}
