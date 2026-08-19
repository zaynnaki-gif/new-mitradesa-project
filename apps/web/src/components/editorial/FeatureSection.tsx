import { Link } from 'react-router-dom';
import styles from './FeatureSection.module.css';

export interface FeatureItem {
  id: string;
  slug?: string;
  nama: string;
  deskripsi?: string;
  gambarUrl?: string;
  link?: string;
}

export interface FeatureData {
  eyebrow?: string;
  title: string;
  body?: string;
  image?: {
    url: string;
    alt?: string;
  };
  items?: FeatureItem[];
  link?: {
    label: string;
    href: string;
  };
}

interface FeatureSectionProps {
  data: FeatureData;
  variant?: 'default' | 'full';
}

export function FeatureSection({
  data,
  variant = 'default',
}: FeatureSectionProps) {
  const { eyebrow, title, body, image, items, link } = data;

  if (variant === 'full') {
    return (
      <section className={`${styles.feature} ${styles.featureFull}`}>
        {image?.url && (
          <img
            src={image.url}
            alt={image.alt || ''}
            className={styles.featureImage}
            loading="lazy"
          />
        )}
        <div className={styles.featureFullContent}>
          <div className={styles.featureFullInner}>
            {eyebrow && <span className={styles.featureEyebrow}>{eyebrow}</span>}
            <h2 className={styles.featureTitle}>{title}</h2>
            {body && <p className={styles.featureBody}>{body}</p>}
            {link && (
              <Link to={link.href} className={styles.featureLink}>
                {link.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.feature}>
      <div className={styles.featureInner}>
        <div className={styles.featureGrid}>
          {/* Main Feature */}
          <div className={styles.featureMain}>
            {image?.url && (
              <>
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className={styles.featureMainImage}
                  loading="lazy"
                />
                <div className={styles.featureMainCaption}>
                  {eyebrow && (
                    <span className={styles.featureEyebrow}>{eyebrow}</span>
                  )}
                  <h2 className={styles.featureTitle}>{title}</h2>
                  {body && <p className={styles.featureBody}>{body}</p>}
                </div>
              </>
            )}
          </div>

          {/* Secondary Items */}
          {items && items.length > 0 && (
            <div className={styles.featureSecondary}>
              {items.map((item) => (
                <article key={item.id} className={styles.featureSecondaryItem}>
                  {item.gambarUrl && (
                    <img
                      src={item.gambarUrl}
                      alt={item.nama}
                      className={styles.featureSecondaryImage}
                      loading="lazy"
                    />
                  )}
                  <div className={styles.featureSecondaryContent}>
                    <h3 className={styles.featureSecondaryTitle}>{item.nama}</h3>
                    {item.deskripsi && (
                      <p className={styles.featureSecondaryExcerpt}>
                        {item.deskripsi}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {link && (
          <div className={styles.featureLink}>
            <Link to={link.href}>{link.label}</Link>
          </div>
        )}
      </div>
    </section>
  );
}
