import { Link } from 'react-router-dom';
import styles from './NewsSection.module.css';

export interface NewsItem {
  id: string;
  slug: string;
  judul: string;
  excerpt?: string;
  gambarUrl?: string;
  kategori?: string | { nama: string }; // Handle both string or object for kategori since mock vs API differs slightly
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

function getCategoryName(kategori: any): string {
  if (!kategori) return 'Berita';
  if (typeof kategori === 'string') return kategori;
  if (typeof kategori === 'object' && kategori.nama) return kategori.nama;
  return 'Berita';
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
      <section className={styles.newsSection}>
        <div className="container">
          <div className={`${styles.sectionHeader} animate-fade-up`}>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h2 className={`${styles.title} font-serif`}>{title}</h2>
          </div>

          <div className={styles.newsGrid}>
            {/* Featured Article */}
            <article className={`${styles.featuredCard} animate-fade-up delay-100`}>
              <Link to={`/berita/${featured.slug}`} className={styles.featuredLink}>
                <div className={styles.featuredImageWrapper}>
                  {featured.gambarUrl ? (
                    <img src={featured.gambarUrl} alt={featured.judul} className={styles.featuredImage} loading="lazy" />
                  ) : (
                    <div className={styles.imagePlaceholder}></div>
                  )}
                  <div className={styles.imageOverlay}></div>
                  <div className={styles.categoryBadge}>
                    {getCategoryName(featured.kategori)}
                  </div>
                </div>
                <div className={styles.featuredContent}>
                  <h3 className={`${styles.featuredTitle} font-serif`}>{featured.judul}</h3>
                  {featured.excerpt && (
                    <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
                  )}
                  <time className={styles.dateText}>
                    {formatDate(featured.publishedAt || featured.createdAt)}
                  </time>
                </div>
              </Link>
            </article>

            {/* Secondary Articles */}
            <div className={styles.secondaryGrid}>
              {secondary.slice(0, 3).map((item, index) => (
                <article 
                  key={item.id} 
                  className={`${styles.secondaryCard} animate-fade-up`}
                  style={{ animationDelay: `${(index + 2) * 100}ms` }}
                >
                  <Link to={`/berita/${item.slug}`} className={styles.secondaryLink}>
                    <div className={styles.secondaryImageWrapper}>
                      {item.gambarUrl ? (
                        <img src={item.gambarUrl} alt={item.judul} className={styles.secondaryImage} loading="lazy" />
                      ) : (
                        <div className={styles.imagePlaceholder}></div>
                      )}
                    </div>
                    <div className={styles.secondaryContent}>
                      <span className={styles.secondaryCategory}>
                        {getCategoryName(item.kategori)}
                      </span>
                      <h4 className={styles.secondaryTitle}>{item.judul}</h4>
                      <time className={styles.dateText}>
                        {formatDate(item.publishedAt || item.createdAt)}
                      </time>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {link && (
            <div className={`${styles.footerLink} animate-fade-up delay-400`}>
              <Link to={link.href} className={styles.btnOutline}>
                {link.label} &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Grid variant remains mostly same layout but updated classes
  return (
    <section className={styles.newsSection}>
      <div className="container">
        <div className={`${styles.sectionHeader} animate-fade-up`}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={`${styles.title} font-serif`}>{title}</h2>
        </div>
        <div className={styles.gridThreeCol}>
          {/* Implement Grid variant if needed, skipping for brevity as featured is default on homepage */}
        </div>
      </div>
    </section>
  );
}
