import { Link } from 'react-router-dom';
import styles from './EditorialCard.module.css';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface EditorialCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  meta?: string;
  href: string;
  actionText?: string;
  index?: number;
}

export function EditorialCard({ title, description, imageUrl, meta, href, actionText = 'Selengkapnya', index = 0 }: EditorialCardProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <article
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${(index % 4) * 100}ms` }}
    >
      <Link to={href} className={styles.card}>
        {imageUrl && (
          <div className={`${styles.imageWrapper} hover-zoom-container`}>
            <img src={imageUrl} alt={title} className={styles.image} loading="lazy" />
          </div>
        )}
        <div className={styles.content}>
          {meta && <div className={styles.meta}>{meta}</div>}
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
          <div className={styles.action}>
            {actionText}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div>
      </Link>
    </article>
  );
}
