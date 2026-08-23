import { CSSProperties } from 'react';
import styles from './EditorialHero.module.css';

interface EditorialHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

export function EditorialHero({ title, subtitle, imageUrl }: EditorialHeroProps) {
  const inlineStyles = imageUrl ? { backgroundImage: `url(${imageUrl})` } as CSSProperties : {};

  return (
    <section className={`${styles.hero} ${imageUrl ? styles.heroWithImage : ''}`} style={inlineStyles}>
      {imageUrl && <div className={styles.overlay} />}
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </section>
  );
}
