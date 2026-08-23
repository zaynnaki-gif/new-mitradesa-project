import { ReactNode } from 'react';
import styles from './EditorialSection.module.css';

interface EditorialSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  alternate?: boolean;
}

export function EditorialSection({ title, subtitle, children, alternate = false }: EditorialSectionProps) {
  return (
    <section className={`${styles.section} ${alternate ? styles.alternate : ''}`}>
      <div className={styles.inner}>
        {(title || subtitle) && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
