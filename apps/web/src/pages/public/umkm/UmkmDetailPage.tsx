import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import { useUmkmDetail, useUmkmList } from '@/hooks/useUmkm';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { APP_NAME } from '@/lib/constants';
import styles from './UmkmDetailPage.module.css';

export default function UmkmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: umkm, loading, error, refetch } = useUmkmDetail(slug || '');
  const { data: relatedUmkms } = useUmkmList({ limit: 4 });

  useSEO({
    title: getPageTitle(umkm?.nama || 'Detail UMKM'),
    description: umkm?.deskripsi?.substring(0, 160) || 'Detail informasi UMKM Desa.',
  });

  if (loading) {
    return (
      <PublicLayout>
        <div className={styles.loadingContainer}>
          <LoadingState message="Memuat informasi UMKM..." />
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className={styles.errorContainer}>
          <ErrorState
            title="Gagal Memuat UMKM"
            message={error}
            onRetry={refetch}
          />
        </div>
      </PublicLayout>
    );
  }

  if (!umkm) {
    return (
      <PublicLayout>
        <div className={styles.errorContainer}>
          <EmptyState
            title="UMKM Tidak Ditemukan"
            message="Data UMKM yang Anda cari tidak tersedia atau telah dihapus."
            icon="search"
            action={{ label: 'Kembali ke Katalog', href: '/umkm' }}
          />
        </div>
      </PublicLayout>
    );
  }

  const formatWhatsAppMessage = () =>
    encodeURIComponent(
      `Halo ${umkm.pemilik}, saya melihat profil usaha ${umkm.nama} di website ${APP_NAME} dan tertarik untuk mengetahui lebih lanjut.`
    );

  const whatsappNumber = umkm.kontak?.replace(/\D/g, '');

  return (
    <PublicLayout>
      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.breadcrumb}>
            <Link to="/">Beranda</Link>
            <span className="material-icons">chevron_right</span>
            <Link to="/umkm">UMKM</Link>
            <span className="material-icons">chevron_right</span>
            <span className={styles.currentPath}>{umkm.nama}</span>
          </div>
        </div>
      </div>

      <div className={styles.mainImageContainer}>
        {umkm.gambarUrl ? (
          <img src={umkm.gambarUrl} alt={umkm.nama} className={styles.mainImage} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className="material-icons">storefront</span>
          </div>
        )}
        <span className={styles.categoryBadge}>{umkm.kategori.replace(/_/g, ' ')}</span>
      </div>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.mainGrid}>
            <div className={styles.mainContent}>

              <div className={styles.detailCard}>
                <Typography variant="h1" className={styles.title}>
                  {umkm.nama}
                </Typography>
                <div className={styles.ownerInfo}>
                  <span className="material-icons">person</span>
                  <Typography variant="body1">
                    Dimiliki oleh <strong>{umkm.pemilik}</strong>
                  </Typography>
                </div>

                {umkm.harga && (
                  <div className={styles.priceInfo}>
                    <span className="material-icons">sell</span>
                    <Typography variant="body1">
                      Harga: <strong>{umkm.harga}</strong>
                    </Typography>
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.descriptionSection}>
                  <Typography variant="h3" className={styles.sectionTitle}>
                    Deskripsi Usaha
                  </Typography>
                  <div className={styles.descriptionContent}>
                    {umkm.deskripsi ? (
                      <div className={styles.articleBody}>
                        {umkm.deskripsi.split('\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noData}>Belum ada deskripsi untuk usaha ini.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sidebar}>
              <div className={styles.infoCard}>
                <Typography variant="h3" className={styles.cardTitle}>
                  Informasi &amp; Kontak
                </Typography>

                <div className={styles.infoList}>
                  {umkm.kontak && (
                    <div className={styles.infoItem}>
                      <span className="material-icons">phone</span>
                      <div className={styles.infoText}>
                        <span className={styles.infoLabel}>Kontak</span>
                        <span>{umkm.kontak}</span>
                      </div>
                    </div>
                  )}

                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${formatWhatsAppMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactButton}
                    >
                      <span className="material-icons">chat</span>
                      Hubungi via WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {relatedUmkms && relatedUmkms.length > 0 && (
                <div className={styles.relatedCard}>
                  <Typography variant="h3" className={styles.cardTitle}>
                    UMKM Lainnya
                  </Typography>
                  <div className={styles.relatedList}>
                    {relatedUmkms
                      .filter((item) => item.id !== umkm.id)
                      .slice(0, 3)
                      .map((item) => (
                        <Link to={`/umkm/${item.slug}`} key={item.id} className={styles.relatedItem}>
                          <div className={styles.relatedImage}>
                            {item.gambarUrl ? (
                              <img src={item.gambarUrl} alt={item.nama} />
                            ) : (
                              <span className="material-icons">storefront</span>
                            )}
                          </div>
                          <div className={styles.relatedInfo}>
                            <span className={styles.relatedTitle}>{item.nama}</span>
                            <span className={styles.relatedCategory}>{item.kategori.replace(/_/g, ' ')}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
