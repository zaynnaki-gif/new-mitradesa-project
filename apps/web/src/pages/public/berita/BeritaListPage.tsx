import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/layouts';
import { LoadingState, ErrorState, EmptyState } from '@/components/states';
import { useBeritaList, useKategori } from '@/hooks/useBerita';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import styles from './BeritaListPage.module.css';

function FeaturedArticleCard({ 
  article, 
  formatDate 
}: { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  article: any; 
  formatDate: (d: string | null) => string;
}) {
  const { ref, isVisible } = useScrollReveal();
  
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <article ref={ref as any} className={`${styles.featuredArticle} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
      <Link to={`/berita/${article.slug}`} className={styles.cardLink}>
        <div className={styles.featuredImageWrapper}>
          {article.gambarUrl ? (
            <img
              src={article.gambarUrl}
              alt={article.judul}
              className={styles.featuredImage}
              loading="lazy"
            />
          ) : (
            <div className={styles.cardImagePlaceholder}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2z" />
              </svg>
            </div>
          )}
          <span className={styles.featuredBadge}>Utama</span>
        </div>
        <div className={styles.featuredContent}>
          {article.kategori && (
            <span className={styles.featuredCategory}>
              {article.kategori.nama}
            </span>
          )}
          <h2 className={styles.featuredTitle}>{article.judul}</h2>
          {article.excerpt && (
            <p className={styles.featuredExcerpt}>{article.excerpt}</p>
          )}
          <div className={styles.featuredMeta}>
            <span className={styles.featuredMetaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDate(article.publishedAt || article.createdAt)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function NewsCard({ 
  item, 
  index, 
  formatDate 
}: { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any; 
  index: number;
  formatDate: (d: string | null) => string;
}) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <article
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`${styles.newsCard} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${(index % 4) * 100}ms` }}
    >
      <Link to={`/berita/${item.slug}`} className={styles.newsCardLink}>
        <div className={`${styles.newsImageWrapper} hover-zoom-container`}>
          {item.gambarUrl ? (
            <img
              src={item.gambarUrl}
              alt={item.judul}
              className={styles.newsImage}
              loading="lazy"
            />
          ) : (
            <div className={styles.cardImagePlaceholder}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2z" />
              </svg>
            </div>
          )}
          {item.kategori && (
            <span className={styles.newsCategory}>
              {item.kategori.nama}
            </span>
          )}
        </div>
        <div className={styles.newsContent}>
          <h4 className={styles.newsTitle}>{item.judul}</h4>
          {item.excerpt && (
            <p className={styles.newsExcerpt}>
              {item.excerpt.length > 120
                ? `${item.excerpt.substring(0, 120)}...`
                : item.excerpt}
            </p>
          )}
          <div className={styles.newsMeta}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDate(item.publishedAt || item.createdAt)}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function BeritaListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const selectedKategori = searchParams.get('kategori') || undefined;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: identitas } = useIdentitasDesa();
  const { data: beritas, loading, error, refetch, meta } = useBeritaList({
    limit: 10,
    page,
    kategori: selectedKategori,
    search: debouncedSearch || undefined,
  });
  const { data: kategoris } = useKategori();

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: getPageTitle(`Berita & Informasi ${villageName}`),
    description: `Berita, pengumuman, dan informasi terbaru dari ${villageName}.`,
  });

  // Split featured (first item) from regular items
  const [featuredArticle, ...regularArticles] = beritas || [];

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleKategoriChange = (slug: string | null) => {
    if (slug) {
      setSearchParams({ kategori: slug });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PublicLayout>
      <EditorialHero 
        title="Berita & Informasi" 
        subtitle={`Berita terbaru, pengumuman, dan informasi dari ${villageName}`} 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {/* Search & Filter */}
          <div className={styles.filterSection}>
            <div className={styles.searchWrapper}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Cari berita..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {kategoris && kategoris.length > 0 && (
              <div className={styles.filterWrapper}>
                <button
                  className={`${styles.filterButton} ${!selectedKategori ? styles.filterActive : ''}`}
                  onClick={() => handleKategoriChange(null)}
                >
                  Semua
                </button>
                {kategoris.map((kategori) => (
                  <button
                    key={kategori.id}
                    className={`${styles.filterButton} ${selectedKategori === kategori.slug ? styles.filterActive : ''}`}
                    onClick={() => handleKategoriChange(kategori.slug)}
                    style={
                      selectedKategori === kategori.slug && kategori.warna
                        ? { backgroundColor: kategori.warna, borderColor: kategori.warna }
                        : undefined
                    }
                  >
                    {kategori.nama}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className={styles.loadingContainer}>
              <LoadingState message="Memuat berita..." />
            </div>
          )}

          {/* Error State */}
          {error && (
            <ErrorState
              title="Gagal Memuat Berita"
              message={error}
              onRetry={refetch}
            />
          )}

          {/* Empty State */}
          {!loading && !error && beritas && beritas.length === 0 && (
            <div className={styles.emptyContainer}>
              <EmptyState
                title="Belum Ada Berita"
                message="Belum ada berita atau pengumuman yang dipublikasikan."
              />
            </div>
          )}

          {/* Featured Article */}
          {!loading && !error && featuredArticle && (
            <FeaturedArticleCard article={featuredArticle} formatDate={formatDate} />
          )}

          {/* Latest News Grid */}
          {!loading && !error && regularArticles.length > 0 && (
            <div className={styles.latestSection}>
              <h3 className={styles.sectionTitle}>Berita Terbaru</h3>
              <div className={styles.newsGrid}>
                {regularArticles.map((item, index) => (
                  <NewsCard key={item.id} item={item} index={index} formatDate={formatDate} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination">
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Halaman sebelumnya"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
                Sebelumnya
              </button>
              <span className={styles.pageInfo}>
                Halaman {page} dari {meta.totalPages}
              </span>
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= meta.totalPages}
                aria-label="Halaman selanjutnya"
              >
                Selanjutnya
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            </nav>
          )}
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
