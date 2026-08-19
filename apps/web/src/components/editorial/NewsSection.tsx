import { Link } from 'react-router-dom';
import styles from './NewsSection.module.css';

export interface NewsItem {
  id: string;
  slug: string;
  judul: string;
  excerpt?: string;
  gambarUrl?: string;
  kategori?: {
    nama: string;
    warna?: string | null;
  };
  publishedAt?: string;
  createdAt: string;
}

export interface NewsData {
  eyebrow?: string;
  title: string;
  link?: {
    label: string;
    href: string;
  };
  items: NewsItem[];
}

interface NewsSectionProps {
  data: NewsData;
  variant?: 'featured' | 'grid';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function NewsSection({
  data,
  variant = 'featured',
}: NewsSectionProps) {
  const { eyebrow, title, link, items } = data;
  const isFeatured = variant === 'featured';
  const [featured, ...secondary] = items;

  if (isFeatured && featured) {
    return (
      <section className={styles.news}>
        <div className={styles.newsInner}>
          <header className={styles.newsHeader}>
            <div className={styles.newsHeaderLeft}>
              {eyebrow && <span className={styles.newsEyebrow}>{eyebrow}</span>}
              <h2 className={styles.newsTitle}>{title}</h2>
            </div>
            {link && (
              <div className={styles.newsLink}>
                <Link to={link.href}>
                  {link.label}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </Link>
              </div>
            )}
          </header>

          <div className={styles.newsGrid}>
            {/* Featured Article */}
            <article className={styles.newsFeatured}>
              <Link
                to={`/berita/${featured.slug}`}
                className={styles.newsFeaturedLink}
              >
                <div className={styles.newsFeaturedImage}>
                  {featured.gambarUrl && (
                    <img
                      src={featured.gambarUrl}
                      alt={featured.judul}
                      loading="lazy"
                    />
                  )}
                  {featured.kategori && (
                    <span className={styles.newsFeaturedCategory}>
                      {featured.kategori.nama}
                    </span>
                  )}
                </div>
                <div className={styles.newsFeaturedContent}>
                  <h3 className={styles.newsFeaturedTitle}>{featured.judul}</h3>
                  {featured.excerpt && (
                    <p className={styles.newsFeaturedExcerpt}>
                      {featured.excerpt}
                    </p>
                  )}
                  <div className={styles.newsFeaturedMeta}>
                    <time
                      className={styles.newsFeaturedDate}
                      dateTime={featured.publishedAt || featured.createdAt}
                    >
                      {formatDate(featured.publishedAt || featured.createdAt)}
                    </time>
                  </div>
                </div>
              </Link>
            </article>

            {/* Secondary Articles */}
            <div className={styles.newsSecondary}>
              {secondary.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/berita/${item.slug}`}
                  className={styles.newsSecondaryItem}
                >
                  <div className={styles.newsSecondaryImage}>
                    {item.gambarUrl && (
                      <img
                        src={item.gambarUrl}
                        alt={item.judul}
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className={styles.newsSecondaryContent}>
                    {item.kategori && (
                      <span className={styles.newsSecondaryCategory}>
                        {item.kategori.nama}
                      </span>
                    )}
                    <h3 className={styles.newsSecondaryTitle}>{item.judul}</h3>
                    <time
                      className={styles.newsSecondaryDate}
                      dateTime={item.publishedAt || item.createdAt}
                    >
                      {formatDate(item.publishedAt || item.createdAt)}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Grid variant
  return (
    <section className={styles.news}>
      <div className={styles.newsInner}>
        <header className={styles.newsHeader}>
          <div className={styles.newsHeaderLeft}>
            {eyebrow && <span className={styles.newsEyebrow}>{eyebrow}</span>}
            <h2 className={styles.newsTitle}>{title}</h2>
          </div>
          {link && (
            <div className={styles.newsLink}>
              <Link to={link.href}>
                {link.label}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </Link>
            </div>
          )}
        </header>

        <div className={styles.newsThreeCol}>
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/berita/${item.slug}`}
              className={styles.newsCard}
            >
              <div className={styles.newsCardImage}>
                {item.gambarUrl && (
                  <img
                    src={item.gambarUrl}
                    alt={item.judul}
                    loading="lazy"
                  />
                )}
              </div>
              <div className={styles.newsCardContent}>
                {item.kategori && (
                  <span className={styles.newsCardCategory}>
                    {item.kategori.nama}
                  </span>
                )}
                <h3 className={styles.newsCardTitle}>{item.judul}</h3>
                {item.excerpt && (
                  <p className={styles.newsCardExcerpt}>{item.excerpt}</p>
                )}
                <time
                  className={styles.newsCardDate}
                  dateTime={item.publishedAt || item.createdAt}
                >
                  {formatDate(item.publishedAt || item.createdAt)}
                </time>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
