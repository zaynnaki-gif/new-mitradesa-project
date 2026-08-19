import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useBeritaDetail, useBeritaList } from '@/hooks/useBerita';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO } from '@/hooks/useSeo';
import { sanitizeHtml } from '@/lib/sanitize';
import styles from './BeritaDetailPage.module.css';

export default function BeritaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: identitas } = useIdentitasDesa();

  const { data: berita, loading, error, refetch } = useBeritaDetail(slug || null);
  const { data: relatedNews } = useBeritaList({
    limit: 3,
    kategori: berita?.kategori?.slug,
  });

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: berita ? berita.judul : 'Memuat...',
    description: berita?.excerpt || `Baca berita terbaru dari ${villageName}`,
    canonical: berita ? `${window.location.origin}/berita/${slug}` : undefined,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredRelatedNews = relatedNews.filter(
    (item) => item.slug !== slug
  ).slice(0, 3);

  if (loading) {
    return (
      <PublicLayout>
        <LoadingState message="Memuat berita..." fullPage />
      </PublicLayout>
    );
  }

  if (error || !berita) {
    if (error === 'Berita tidak ditemukan') {
      return (
        <PublicLayout>
          <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
            <Typography variant="h2" style={{ marginBottom: '1rem' }}>Berita Tidak Ditemukan</Typography>
            <Typography variant="body1" color="secondary" style={{ marginBottom: '2rem' }}>
              Maaf, berita yang Anda cari tidak tersedia atau mungkin sudah dihapus.
            </Typography>
            <Link to="/berita" style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              Kembali ke Daftar Berita
            </Link>
          </div>
        </PublicLayout>
      );
    }
    return (
      <PublicLayout>
        <ErrorState
          title="Berita Tidak Ditemukan"
          message={error || 'Berita yang Anda cari tidak tersedia.'}
          onRetry={refetch}
        />
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
          <Link to="/berita" className={styles.breadcrumbLink}>Berita</Link>
          {berita.kategori && (
            <>
              <span className={styles.breadcrumbSeparator}>/</span>
              <Link
                to={`/berita?kategori=${berita.kategori.slug}`}
                className={styles.breadcrumbLink}
              >
                {berita.kategori.nama}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Article Header */}
      <header className={styles.articleHeader}>
        <div className={styles.articleContainer}>
          {berita.kategori && (
            <Link
              to={`/berita?kategori=${berita.kategori.slug}`}
              className={styles.articleCategory}
              style={{
                backgroundColor: berita.kategori.warna
                  ? `${berita.kategori.warna}20`
                  : 'var(--color-bg-muted)',
                color: berita.kategori.warna || 'var(--color-text-secondary)',
              }}
            >
              {berita.kategori.nama}
            </Link>
          )}
          <Typography variant="h1" className={styles.articleTitle}>
            {berita.judul}
          </Typography>
          <div className={styles.articleMeta}>
            <div className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <time dateTime={berita.publishedAt || berita.createdAt}>
                {formatDate(berita.publishedAt || berita.createdAt)}
              </time>
            </div>
            {berita.penulis && (
              <div className={styles.metaItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{berita.penulis.nama || berita.penulis.username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {berita.gambarUrl && (
        <div className={styles.featuredImage}>
          <img
            src={berita.gambarUrl}
            alt={berita.judul}
            className={styles.image}
          />
        </div>
      )}

      {/* Article Content */}
      <article className={styles.articleContent}>
        <div className={styles.articleContainer}>
          {berita.excerpt && (
            <p className={styles.articleExcerpt}>{berita.excerpt}</p>
          )}
          <div
            className={styles.articleBody}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(berita.konten || '') }}
          />
        </div>
      </article>

      {/* Share & Back */}
      <div className={styles.articleFooter}>
        <div className={styles.articleContainer}>
          <div className={styles.shareSection}>
            <Typography variant="body2" className={styles.shareLabel}>Bagikan:</Typography>
            <div className={styles.shareButtons}>
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(berita.judul + ' ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className={styles.shareButton} aria-label="Share to WhatsApp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className={styles.shareButton} aria-label="Share to Facebook">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(berita.judul)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className={styles.shareButton} aria-label="Share to Twitter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)} className={styles.shareButton} aria-label="Copy link" title="Salin Tautan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
          </div>
          <Link to="/berita" className={styles.backButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
            Kembali ke Daftar Berita
          </Link>
        </div>
      </div>

      {/* Related News */}
      {filteredRelatedNews.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.articleContainer}>
            <Typography variant="h2" className={styles.relatedTitle}>
              Berita Terkait
            </Typography>
            <div className={styles.relatedGrid}>
              {filteredRelatedNews.map((item) => (
                <Link key={item.id} to={`/berita/${item.slug}`} className={styles.relatedCard}>
                  {item.gambarUrl && (
                    <div className={styles.relatedImageWrapper}>
                      <img
                        src={item.gambarUrl}
                        alt={item.judul}
                        className={styles.relatedImage}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className={styles.relatedContent}>
                    {item.kategori && (
                      <span className={styles.relatedCategory}>{item.kategori.nama}</span>
                    )}
                    <Typography variant="h4" className={styles.relatedCardTitle}>
                      {item.judul}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
