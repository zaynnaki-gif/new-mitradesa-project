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
    // Create asymmetric pattern
    if (index === 0) return styles.galleryLarge;
    if (index === 1 || index === 5) return styles.galleryMedium;
    return styles.gallerySmall;
  };

  return (
    <section className={styles.gallery}>
      <div className={styles.galleryInner}>
        <header className={styles.galleryHeader}>
          {eyebrow && <span className={styles.galleryEyebrow}>{eyebrow}</span>}
          <h2 className={styles.galleryTitle}>{title}</h2>
        </header>

        {isMasonry ? (
          <div className={styles.galleryMasonry}>
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.galleryItem} ${getItemSize(index)}`}
              >
                <img
                  src={item.fileUrl}
                  alt={item.alt || item.nama}
                  loading="lazy"
                />
                <div className={styles.galleryItemOverlay}>
                  <span className={styles.galleryItemCaption}>{item.nama}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            {items.map((item) => (
              <div key={item.id} className={styles.galleryGridItem}>
                <img
                  src={item.fileUrl}
                  alt={item.alt || item.nama}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {link && (
          <div className={styles.galleryLink}>
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
      </div>
    </section>
  );
}
