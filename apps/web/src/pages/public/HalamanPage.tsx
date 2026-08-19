import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO } from '@/hooks/useSeo';
import { API_URL } from '@/lib/constants';
import { sanitizeHtml } from '@/lib/sanitize';
import { useState, useEffect } from 'react';

interface Halaman {
  id: string;
  judul: string;
  slug: string;
  konten: string | null;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
}

export default function HalamanPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: identitas } = useIdentitasDesa();
  const [halaman, setHalaman] = useState<Halaman | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: halaman ? halaman.judul : 'Memuat...',
    description: halaman?.excerpt || `Halaman ${villageName}`,
    canonical: halaman ? `${window.location.origin}/halaman/${slug}` : undefined,
  });

  const fetchHalaman = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/public/halaman/${encodeURIComponent(slug!)}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Halaman tidak ditemukan');
        }
        throw new Error('Gagal memuat halaman');
      }

      const result = await res.json();

      if (result.success) {
        setHalaman(result.data);
      } else {
        throw new Error('Gagal memuat halaman');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setHalaman(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Slug halaman tidak valid');
      return;
    }
    fetchHalaman();
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <LoadingState message="Memuat halaman..." fullPage />
      </PublicLayout>
    );
  }

  if (error || !halaman) {
    return (
      <PublicLayout>
        <ErrorState
          title="Halaman Tidak Ditemukan"
          message={error || 'Halaman yang Anda cari tidak tersedia.'}
          onRetry={slug ? fetchHalaman : undefined}
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
          <span className={styles.breadcrumbCurrent}>{halaman.judul}</span>
        </div>
      </nav>

      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <Typography variant="h1" className={styles.pageTitle}>
            {halaman.judul}
          </Typography>
        </div>
      </header>

      {/* Page Content */}
      <article className={styles.pageContent}>
        <div className={styles.contentContainer}>
          {halaman.excerpt && (
            <p className={styles.pageExcerpt}>{halaman.excerpt}</p>
          )}
          {halaman.konten && (
            <div
              className={styles.pageBody}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(halaman.konten) }}
            />
          )}
        </div>
      </article>

      {/* Back Link */}
      <div className={styles.pageFooter}>
        <div className={styles.footerContainer}>
          <Link to="/" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

const styles = {
  breadcrumb: `
    background-color: var(--color-bg-surface);
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-3) var(--space-4);
  `,
  breadcrumbContainer: `
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    flex-wrap: wrap;
  `,
  breadcrumbLink: `
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: color var(--transition-fast);
  `,
  breadcrumbLinkHover: `
    color: var(--color-navy-base);
  `,
  breadcrumbSeparator: `
    color: var(--color-text-muted);
  `,
  breadcrumbCurrent: `
    color: var(--color-text-primary);
    font-weight: 500;
  `,
  pageHeader: `
    padding: var(--space-8) var(--space-4);
    background-color: var(--color-bg-base);
  `,
  headerContent: `
    max-width: 800px;
    margin: 0 auto;
  `,
  pageTitle: `
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--color-navy-base);
    line-height: 1.3;
  `,
  pageContent: `
    padding: var(--space-8) var(--space-4);
    background-color: var(--color-bg-base);
  `,
  contentContainer: `
    max-width: 800px;
    margin: 0 auto;
  `,
  pageExcerpt: `
    font-size: var(--text-lg);
    color: var(--color-text-secondary);
    line-height: 1.7;
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-6);
    border-bottom: 1px solid var(--color-border);
  `,
  pageBody: `
    font-size: var(--text-base);
    line-height: 1.8;
    color: var(--color-text-primary);
  `,
  pageFooter: `
    padding: var(--space-6) var(--space-4);
    border-top: 1px solid var(--color-border);
    background-color: var(--color-bg-surface);
  `,
  footerContainer: `
    max-width: 800px;
    margin: 0 auto;
  `,
  backLink: `
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-navy-base);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all var(--transition-fast);
  `,
};
