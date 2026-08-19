import styles from './HeroSection.module.css';

export interface HeroData {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image?: {
    url: string;
    alt?: string;
  };
  location?: {
    district?: string;
    city?: string;
    province?: string;
  };
}

interface HeroSectionProps {
  data: HeroData;
  variant?: 'default' | 'overlay';
  showScrollIndicator?: boolean;
}

export function HeroSection({
  data,
  variant = 'default',
  showScrollIndicator = true,
}: HeroSectionProps) {
  const { title, subtitle, eyebrow, image, location } = data;

  const locationText = [
    location?.district,
    location?.city,
    location?.province,
  ]
    .filter(Boolean)
    .join(', ');

  if (variant === 'overlay') {
    return (
      <section className={`${styles.hero} ${styles.heroOverlay}`}>
        {image?.url && (
          <div className={styles.heroBackground}>
            <img
              src={image.url}
              alt={image.alt || ''}
              className={styles.heroBackgroundImage}
              loading="eager"
            />
            <div className={styles.heroGradient} />
          </div>
        )}
        <div className={styles.heroOverlayContent}>
          {eyebrow && <span className={styles.heroEyebrow}>{eyebrow}</span>}
          <h1 className={styles.heroTitle}>{title}</h1>
          {subtitle && <p className={styles.heroSubtitle}>{subtitle}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.hero}>
      {image?.url && (
        <div className={styles.heroBackground}>
          <img
            src={image.url}
            alt={image.alt || ''}
            className={styles.heroBackgroundImage}
            loading="eager"
          />
          <div className={styles.heroGradient} />
        </div>
      )}

      <div className={styles.heroContent}>
        <div className={styles.heroInner}>
          {eyebrow && <span className={styles.heroEyebrow}>{eyebrow}</span>}
          <h1 className={styles.heroTitle}>{title}</h1>
          {subtitle && <p className={styles.heroSubtitle}>{subtitle}</p>}
          {locationText && (
            <div className={styles.heroLocation}>
              <svg
                className={styles.heroLocationIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{locationText}</span>
            </div>
          )}
        </div>
      </div>

      {showScrollIndicator && (
        <div className={styles.heroScrollIndicator} aria-hidden="true">
          <span className={styles.heroScrollText}>Scroll</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      )}
    </section>
  );
}
