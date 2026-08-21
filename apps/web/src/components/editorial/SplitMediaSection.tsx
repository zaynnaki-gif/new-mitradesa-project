import { Link } from 'react-router-dom';
import styles from './SplitMediaSection.module.css';

export interface MediaItem {
  url: string;
  alt?: string;
  caption?: string;
}

export interface SplitMediaData {
  eyebrow?: string;
  title: string;
  body?: string | string[];
  image?: MediaItem;
  link?: {
    label: string;
    href: string;
  };
}

interface SplitMediaSectionProps {
  data: SplitMediaData;
  layout?: 'image-left' | 'image-right';
  variant?: 'default' | 'dark' | 'full';
}

export function SplitMediaSection({
  data,
  layout = 'image-left',
  variant = 'default',
}: SplitMediaSectionProps) {
  const { eyebrow, title, body, image, link } = data;
  const isReversed = layout === 'image-right';
  const isDark = variant === 'dark';
  const isFull = variant === 'full';

  const bodyContent = Array.isArray(body)
    ? body.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))
    : body;

  return (
    <section
      className={`${styles.split} ${isDark ? styles.splitDark : ''} ${isFull ? styles.splitFull : ''}`}
    >
      <div className={styles.splitInner}>
        <div className={isReversed ? styles.splitGridReverse : styles.splitGrid}>
          {/* Image - Large editorial */}
          <div className={styles.splitImageWrapper}>
            {image?.url && (
              <>
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className={styles.splitImage}
                  loading="lazy"
                />
                {image?.caption && (
                  <figcaption className={styles.splitImageCaption}>
                    {image.caption}
                  </figcaption>
                )}
              </>
            )}
          </div>

          {/* Content */}
          <div className={styles.splitContent}>
            {eyebrow && <span className={styles.splitEyebrow}>{eyebrow}</span>}
            <h2 className={styles.splitTitle}>{title}</h2>
            {bodyContent && <div className={styles.splitBody}>{bodyContent}</div>}
            {link && (
              <Link to={link.href} className={styles.splitLink}>
                <span>{link.label}</span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
