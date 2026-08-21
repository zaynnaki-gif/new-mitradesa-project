import { Link } from 'react-router-dom';
import styles from './GallerySection.module.css';

export interface GalleryItem {
  id: string;
  nama: string;
  fileUrl: string;
  alt?: string;
}

export interface GalleryData {
  eyebrow?: string;
  title: string;
  link?: {
    label: string;
    href: string;
  };
  items: GalleryItem[];
}

interface GallerySectionProps {
  data: GalleryData;
  variant?: 'masonry' | 'grid';
}

export function GallerySection({
  data,
  variant = 'masonry',
}: GallerySectionProps) {
  const { eyebrow, title, link, items } = data;
  const isMasonry = variant === 'masonry';

  const getItemSize = (index: number): string => {
    if (!isMasonry) return '';
    // Editorial masonry pattern
    if (index % 5 === 0) return styles.galleryLarge;
    if (index % 5 === 1 || index % 5 === 4) return styles.galleryMedium;
    if (index % 5 === 2) return styles.galleryTall;
    return styles.gallerySmall;
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.gallerySection}>
      <div className="container">
        <div className={`${styles.sectionHeader} animate-fade-up`}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={`${styles.title} font-serif`}>{title}</h2>
        </div>

        <div className={`${styles.galleryGrid} ${isMasonry ? styles.isMasonry : ''}`}>
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`${styles.galleryItem} ${getItemSize(index)} animate-fade-up`}
              style={{ animationDelay: `${(index % 5) * 100}ms` }}
            >
              <img
                src={item.fileUrl}
                alt={item.alt || item.nama}
                loading="lazy"
                className={styles.galleryImage}
              />
              <div className={styles.itemOverlay}>
                <span className={styles.itemCaption}>{item.nama}</span>
              </div>
            </div>
          ))}
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
