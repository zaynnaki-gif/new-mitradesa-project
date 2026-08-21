import React from 'react';
import styles from './HeroSection.module.css';
export interface HeroData {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image?: { url: string; alt?: string };
  location?: { district?: string; city?: string; province?: string };
}
interface HeroSectionProps {
  data: HeroData;
  variant?: 'default' | 'minimal';
}

export const HeroSection: React.FC<HeroSectionProps> = ({ data }) => {
  return (
    <section className={styles.heroSection}>
      {/* Background Image / Overlay */}
      <div className={styles.background}>
        {data.image?.url && (
          <img src={data.image.url} alt={data.image.alt} className={styles.bgImage} />
        )}
        <div className={styles.overlay}></div>
      </div>

      <div className="container">
        <div className={styles.content}>
          <div className={`${styles.textContent} animate-fade-up`}>
            {data.eyebrow && <span className={styles.eyebrow}>{data.eyebrow}</span>}
            
            <h1 className={`${styles.title} font-serif`}>
              {data.title}
            </h1>
            
            {data.subtitle && <p className={styles.subtitle}>{data.subtitle}</p>}
            
            {data.location && (
              <div className={`${styles.location} delay-200 animate-fade-up`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>
                  {[data.location.district, data.location.city, data.location.province]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
