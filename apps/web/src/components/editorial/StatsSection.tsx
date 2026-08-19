import styles from './StatsSection.module.css';

export interface StatItem {
  value: number | string;
  label: string;
  description?: string;
}

export interface StatsData {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: StatItem[];
}

interface StatsSectionProps {
  data: StatsData;
  variant?: 'default' | 'horizontal' | 'dark' | 'minimal';
}

export function StatsSection({
  data,
  variant = 'default',
}: StatsSectionProps) {
  const { eyebrow, title, description, items } = data;
  const isDark = variant === 'dark';
  const isHorizontal = variant === 'horizontal';
  const isMinimal = variant === 'minimal';

  const formatNumber = (value: number | string): string => {
    if (typeof value === 'string') return value;
    return value.toLocaleString('id-ID');
  };

  return (
    <section
      className={`${styles.stats} ${isDark ? styles.statsDark : ''} ${isHorizontal ? styles.statsHorizontal : ''} ${isMinimal ? styles.statsMinimal : ''}`}
    >
      <div className={styles.statsInner}>
        {(eyebrow || title || description) && (
          <header className={styles.statsHeader}>
            {eyebrow && <span className={styles.statsEyebrow}>{eyebrow}</span>}
            {title && <h2 className={styles.statsTitle}>{title}</h2>}
            {description && (
              <p className={styles.statsDescription}>{description}</p>
            )}
          </header>
        )}

        <div className={styles.statsGrid}>
          {items.map((item, index) => (
            <div key={index} className={styles.statItem}>
              <span className={styles.statNumber}>{formatNumber(item.value)}</span>
              <span className={styles.statLabel}>{item.label}</span>
              {item.description && (
                <p className={styles.statDescription}>{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
