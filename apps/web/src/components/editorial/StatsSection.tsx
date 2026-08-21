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
}: StatsSectionProps) {
  const { title, items } = data;

  const formatNumber = (value: number | string): string => {
    if (typeof value === 'string') return value;
    return value.toLocaleString('id-ID');
  };

  return (
    <section className={styles.statsSection}>
      <div className="container">
        {title && (
          <div className={`${styles.statsHeader} animate-fade-up`}>
            <h2 className={styles.statsTitle}>{title}</h2>
          </div>
        )}

        <div className={styles.statsGrid}>
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`${styles.statCard} glass animate-fade-up`} 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{formatNumber(item.value)}</span>
                <span className={styles.statLabel}>{item.label}</span>
                {item.description && (
                  <p className={styles.statDescription}>{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
