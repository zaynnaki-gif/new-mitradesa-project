import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useLayananList } from '@/hooks/useLayanan';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { LoadingState, ErrorState } from '@/components/states';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './LayananPage.module.css';

const getKategoriIcon = (kategori?: string) => {
  switch (kategori) {
    case 'SURAT':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'PENGANTAR':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'IZIN':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
  }
};

function ServiceCard({ service, index }: { service: any; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  
  return (
    <Link
      ref={ref}
      to={`/layanan/${service.slug}`}
      className={`${styles.card} animate-on-scroll hover-zoom-container ${isVisible ? 'is-visible' : ''}`}
      style={{ textDecoration: 'none', color: 'inherit', transitionDelay: `${index * 100}ms` }}
    >
      <div className={styles.cardIcon}>
        {getKategoriIcon(service.kategori)}
      </div>
      <Typography variant="h3" className={styles.cardTitle}>
        {service.nama}
      </Typography>
      <Typography variant="body2" color="secondary" className={styles.cardDesc}>
        {service.deskripsi || 'Layanan administrasi desa'}
      </Typography>
      <div className={styles.cardStatus}>
        <span className={styles.statusBadge} style={{ 
          backgroundColor: 'var(--color-bg-muted)', 
          color: 'var(--color-navy-base)' 
        }}>
          Lihat Detail
        </span>
      </div>
    </Link>
  );
}

export default function LayananPage() {
  const { data: identitas } = useIdentitasDesa();
  const { data: services, loading, error, refetch } = useLayananList({ limit: 100 }); // Fetch all active services
  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: getPageTitle(`Layanan ${villageName}`),
    description: `Layanan administrasi ${villageName}. Informasi persyaratan, alur, dan pengajuan layanan desa.`,
  });

  return (
    <PublicLayout>
      <EditorialHero 
        title="Layanan Desa" 
        subtitle={`Informasi layanan administrasi ${villageName}`} 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {loading ? (
            <LoadingState message="Memuat layanan..." />
          ) : error ? (
            <ErrorState
              title="Gagal Memuat Layanan"
              message={error}
              onRetry={refetch}
            />
          ) : services.length > 0 ? (
            <>
              {/* Service Info Grid */}
              <div className={styles.grid}>
                {services.map((service, index) => (
                  <ServiceCard key={service.id} service={service} index={index} />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.notice}>
              <div className={styles.noticeIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className={styles.noticeContent}>
                <Typography variant="h3" className={styles.noticeTitle}>
                  Layanan Online Sedang dalam Pengembangan
                </Typography>
                <Typography variant="body1" color="secondary">
                  Sistem pelayanan online saat ini sedang dipersiapkan. Untuk sementara, silakan hubungi
                  kantor desa secara langsung untuk keperluan administrasi Anda.
                </Typography>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className={styles.contactSection}>
            <Typography variant="h3" className={styles.sectionTitle}>
              Hubungi Kami
            </Typography>
            <Typography variant="body1" color="secondary" className={styles.contactDesc}>
              Untuk informasi lebih lanjut tentang layanan administrasi, silakan hubungi kantor desa:
            </Typography>
            <div className={styles.contactGrid}>
              {identitas?.alamat && (
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <Typography variant="body2" color="secondary">Alamat</Typography>
                    <Typography variant="body1">{identitas.alamat}</Typography>
                  </div>
                </div>
              )}
              {identitas?.telepon && (
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <Typography variant="body2" color="secondary">Telepon</Typography>
                    <Typography variant="body1">{identitas.telepon}</Typography>
                  </div>
                </div>
              )}
              {identitas?.whatsapp && (
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <div>
                    <Typography variant="body2" color="secondary">WhatsApp</Typography>
                    <Typography variant="body1">{identitas.whatsapp}</Typography>
                  </div>
                </div>
              )}
            </div>
            <Link to="/kontak" className={styles.contactLink}>
              Lihat Informasi Lengkap →
            </Link>
          </div>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
