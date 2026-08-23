import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { usePotensi } from '@/hooks/usePotensi';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { sanitizeHtml } from '@/lib/sanitize';
import styles from './PotensiDetailPage.module.css';

export function PotensiDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: identitas } = useIdentitasDesa();

  const { data: potensi, loading, error, refetch } = usePotensi(slug || '');

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: potensi ? getPageTitle(potensi.nama) : 'Memuat...',
    description: potensi?.deskripsi?.substring(0, 150) || `Informasi potensi ${villageName}`,
    canonical: potensi ? `${window.location.origin}/potensi/${slug}` : undefined,
  });

  if (loading && !potensi) {
    return (
      <PublicLayout>
        <LoadingState message="Memuat informasi potensi..." fullPage />
      </PublicLayout>
    );
  }

  if (error || !potensi) {
    return (
      <PublicLayout>
        <ErrorState message={error?.message || 'Potensi tidak ditemukan'} onRetry={refetch} />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <div className={styles.breadcrumbContainer}>
          <Link to="/" className={styles.breadcrumbLink}>Beranda</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link to="/potensi" className={styles.breadcrumbLink}>Potensi</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbLink} style={{ color: 'var(--ink-deep)' }}>
            {potensi.kategori}
          </span>
        </div>
      </nav>

      {/* Article Header */}
      <header className={styles.articleHeader}>
        <div className={styles.articleContainer}>
          <span
            className={styles.articleCategory}
            style={{
              backgroundColor: 'var(--color-bg-muted)',
              color: 'var(--amber-700)',
            }}
          >
            {potensi.kategori}
          </span>
          <Typography variant="h1" className={styles.articleTitle}>
            {potensi.nama}
          </Typography>
        </div>
      </header>

      {/* Featured Image */}
      {potensi.gambarUrl && (
        <div className={styles.featuredImage}>
          <img
            src={potensi.gambarUrl}
            alt={potensi.nama}
            className={styles.image}
          />
        </div>
      )}

      {/* Article Content */}
      <article className={styles.articleContent}>
        <div className={styles.articleContainer}>
          <div
            className={styles.articleBody}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(potensi.deskripsi || '') }}
          />

          {(potensi.lokasi || potensi.kontak) && (
            <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-6)', backgroundColor: 'var(--stone-100)' }}>
              <Typography variant="h3" style={{ marginBottom: 'var(--space-4)', color: 'var(--ink-deep)' }}>Informasi</Typography>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {potensi.lokasi && (
                  <div>
                    <Typography variant="body2" color="secondary" style={{ fontWeight: 500, marginBottom: 'var(--space-1)' }}>Lokasi</Typography>
                    <Typography variant="body1">{potensi.lokasi}</Typography>
                  </div>
                )}
                
                {potensi.kontak && (
                  <div>
                    <Typography variant="body2" color="secondary" style={{ fontWeight: 500, marginBottom: 'var(--space-1)' }}>Kontak</Typography>
                    <Typography variant="body1">{potensi.kontak}</Typography>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Share & Back */}
      <div className={styles.articleFooter}>
        <div className={styles.articleContainer}>
          <Link to="/potensi" className={styles.backButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
            Kembali ke Daftar Potensi
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
