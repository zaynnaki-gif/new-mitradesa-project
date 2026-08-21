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
      <section className={`${styles.featureFull} animate-fade-in`}>
        {image?.url && (
          <img
            src={image.url}
            alt={image.alt || ''}
            className={styles.featureImageFull}
            loading="lazy"
          />
        )}
        <div className={styles.overlay}></div>
        <div className="container">
          <div className={styles.featureFullContent}>
            <div className={`${styles.featureFullInner} glass-dark animate-fade-up delay-200`}>
              {eyebrow && <span className={styles.eyebrowAccent}>{eyebrow}</span>}
              <h2 className={`${styles.titleLight} font-serif`}>{title}</h2>
              {body && <p className={styles.bodyLight}>{body}</p>}
              {link && (
                <Link to={link.href} className={styles.btnPrimaryLight}>
                  {link.label} &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.featureSection}>
      <div className="container">
        <div className={`${styles.sectionHeader} animate-fade-up`}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={`${styles.title} font-serif`}>{title}</h2>
          {body && <p className={styles.subtitle}>{body}</p>}
        </div>

        <div className={styles.featureGrid}>
          {/* Main Feature */}
          <div className={`${styles.featureMain} animate-fade-up delay-100`}>
            {image?.url && (
              <div className={styles.mainImageWrapper}>
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className={styles.mainImage}
                  loading="lazy"
                />
                <div className={styles.mainOverlay}></div>
                <div className={styles.mainContent}>
                  <span className={styles.tagOverlay}>Unggulan</span>
                  <h3 className={`${styles.mainTitle} font-serif`}>{title}</h3>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Items */}
          {items && items.length > 0 && (
            <div className={styles.featureSecondary}>
              {items.map((item, index) => (
                <article 
                  key={item.id} 
                  className={`${styles.secondaryCard} animate-fade-up`}
                  style={{ animationDelay: `${(index + 2) * 100}ms` }}
                >
                  {item.gambarUrl && (
                    <div className={styles.secondaryImageWrapper}>
                      <img
                        src={item.gambarUrl}
                        alt={item.nama}
                        className={styles.secondaryImage}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className={styles.secondaryContent}>
                    <h4 className={styles.secondaryTitle}>{item.nama}</h4>
                    {item.deskripsi && (
                      <p className={styles.secondaryDesc}>{item.deskripsi}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {link && (
          <div className={`${styles.footerLink} animate-fade-up delay-500`}>
            <Link to={link.href} className={styles.btnOutline}>
              {link.label} &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
