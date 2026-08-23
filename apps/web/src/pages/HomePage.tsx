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
import kependudukanStyles from './public/KependudukanPage.module.css';

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

  // Prepare hero data from API - NO CTA
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

  // Prepare statement data - editorial introduction
  const statementData = {
    eyebrow: 'Tentang Kami',
    title: `${villageName}`,
    body: `Website desa ini adalah pusat informasi resmi dan layanan digital untuk mewujudkan tata kelola desa yang transparan, inovatif, dan responsif terhadap kebutuhan warga.`,
  };

  // Prepare stats data from API - large typography editorial
  const statsData = {
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
      {
        value: statistik?.surat?.masuk || 0,
        label: 'Surat Masuk',
      },
      {
        value: statistik?.surat?.keluar || 0,
        label: 'Surat Keluar',
      },
    ],
  };

  // Prepare services data from API - editorial showcase
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

  // Prepare featured UMKM - visual showcase
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

  // Prepare news data from API - editorial story layout
  const newsData = {
    eyebrow: 'Berita',
    title: 'Berita & Cerita',
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

  // Prepare agenda data from API - editorial timeline
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

  // Prepare gallery data from API - editorial mosaic
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
    eyebrow: 'Aparatur',
    title: 'Perangkat Desa',
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

  // Prepare transparency data from API - editorial data presentation
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

  // Village story - alternating layout for editorial feel
  const villageStoryData = {
    eyebrow: 'Profil',
    title: 'Desa Masa Depan',
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
      {/* Section 01: Hero - Clean, NO CTA */}
      <HeroSection data={heroData} variant="default" />

      {/* Section 02: Editorial Introduction - Asymmetric split */}
      <StatementSection data={statementData} variant="default" />

      {/* Section 03: Village Story - Alternating image/text */}
      <SplitMediaSection data={villageStoryData} layout="image-right" variant="default" />

      {/* Section 04: Statistics - Large typography editorial */}
      <StatsSection data={statsData} variant="minimal" />

      {/* Detailed Statistics Charts */}
      {statistik?.distribusi && (
        <section className="bg-white py-12 md:py-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Demografi</h2>
              <h3 className="text-3xl font-serif text-gray-900">Distribusi Kependudukan</h3>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Potret kekayaan demografi desa kami berdasarkan pendidikan, pekerjaan, agama, dan golongan darah dari total {statistik.penduduk.total.toLocaleString()} jiwa.</p>
            </div>
            <div className={kependudukanStyles.chartsContainer} style={{ marginTop: '2rem' }}>
              <div className={kependudukanStyles.chartCard}>
                <h3 className={kependudukanStyles.chartTitle}>Pendidikan</h3>
                <div className={kependudukanStyles.barChart}>
                  {statistik.distribusi.pendidikan.slice(0, 6).map((item, index) => (
                    <div key={index} className={kependudukanStyles.barRow}>
                      <div className={kependudukanStyles.barLabel}>{item.name}</div>
                      <div className={kependudukanStyles.barWrapper}>
                        <div 
                          className={kependudukanStyles.barFill} 
                          style={{ width: `${(item.count / statistik.penduduk.total) * 100}%` }}
                        />
                      </div>
                      <div className={kependudukanStyles.barValue}>{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={kependudukanStyles.chartCard}>
                <h3 className={kependudukanStyles.chartTitle}>Pekerjaan (Top 6)</h3>
                <div className={kependudukanStyles.barChart}>
                  {statistik.distribusi.pekerjaan.slice(0, 6).map((item, index) => (
                    <div key={index} className={kependudukanStyles.barRow}>
                      <div className={kependudukanStyles.barLabel}>{item.name}</div>
                      <div className={kependudukanStyles.barWrapper}>
                        <div 
                          className={kependudukanStyles.barFill} 
                          style={{ width: `${(item.count / statistik.penduduk.total) * 100}%`, backgroundColor: '#3b82f6' }}
                        />
                      </div>
                      <div className={kependudukanStyles.barValue}>{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={kependudukanStyles.chartCard}>
                <h3 className={kependudukanStyles.chartTitle}>Agama</h3>
                <div className={kependudukanStyles.barChart}>
                  {statistik.distribusi.agama.map((item, index) => (
                    <div key={index} className={kependudukanStyles.barRow}>
                      <div className={kependudukanStyles.barLabel}>{item.name}</div>
                      <div className={kependudukanStyles.barWrapper}>
                        <div 
                          className={kependudukanStyles.barFill} 
                          style={{ width: `${(item.count / statistik.penduduk.total) * 100}%`, backgroundColor: '#10b981' }}
                        />
                      </div>
                      <div className={kependudukanStyles.barValue}>{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center mt-10">
              <a href="/kependudukan" className="inline-block border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-50 transition-colors">Lihat Statistik Lengkap</a>
            </div>
          </div>
        </section>
      )}

      {/* Section 05: Services - Editorial list showcase */}
      <ServicesSection data={servicesData} variant="list" />

      {/* Section 06: UMKM/Potensi - Dark feature section */}
      <FeatureSection data={featureData} variant="default" />

      {/* Section 07: Community - People photography */}
      <CommunitySection data={communityData} />

      {/* Section 08: News - Editorial featured story */}
      <NewsSection data={newsData} variant="featured" />

      {/* Section 09: Agenda - Editorial timeline */}
      <TimelineSection data={agendaData} variant="default" />

      {/* Section 10: Transparency - Editorial data presentation */}
      <TransparencySection data={transparencyData} />

      {/* Section 11: Gallery - Editorial mosaic */}
      <GallerySection data={galleryData} variant="masonry" />

      {/* Section 12: Closing Statement - Dark, no CTA */}
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
