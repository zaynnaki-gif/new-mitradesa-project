import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
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

function FeatureSecondaryItem({ item, index }: { item: FeatureItem; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  
  return (
    <article 
      ref={ref}
      key={item.id} 
      className={`${styles.secondaryCard} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${(index + 2) * 100}ms` }}
    >
      {item.gambarUrl && (
        <div className={`${styles.secondaryImageWrapper} hover-zoom-container`}>
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
  );
}

export function FeatureSection({
  data,
  variant = 'default',
}: FeatureSectionProps) {
  const { eyebrow, title, body, image, items, link } = data;
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: mainRef, isVisible: mainVisible } = useScrollReveal();
  const { ref: footerRef, isVisible: footerVisible } = useScrollReveal();

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
            <div ref={headerRef} className={`${styles.featureFullInner} glass-dark animate-on-scroll ${headerVisible ? 'is-visible' : ''}`}>
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
        <div ref={headerRef} className={`${styles.sectionHeader} animate-on-scroll ${headerVisible ? 'is-visible' : ''}`}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={`${styles.title} font-serif`}>{title}</h2>
          {body && <p className={styles.subtitle}>{body}</p>}
        </div>

        <div className={styles.featureGrid}>
          {/* Main Feature */}
          <div ref={mainRef} className={`${styles.featureMain} animate-on-scroll ${mainVisible ? 'is-visible' : ''}`}>
            {image?.url && (
              <div className={`${styles.mainImageWrapper} hover-zoom-container`}>
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
                <FeatureSecondaryItem key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </div>

        {link && (
          <div ref={footerRef} className={`${styles.footerLink} animate-on-scroll ${footerVisible ? 'is-visible' : ''}`}>
            <Link to={link.href} className={styles.btnOutline}>
              {link.label} &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
