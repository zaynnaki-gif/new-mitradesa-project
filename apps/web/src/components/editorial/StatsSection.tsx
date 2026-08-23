import { useState, useEffect } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
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

export function AnimatedCounter({ value }: { value: number | string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.5 });
  const isNumber = typeof value === 'number' || !isNaN(Number(value));
  const numericValue = isNumber ? Number(value) : 0;

  useEffect(() => {
    if (isVisible && isNumber) {
      let start = 0;
      const duration = 2000;
      const increment = numericValue / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= numericValue) {
          setCount(numericValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
    return undefined;
  }, [isVisible, numericValue, isNumber]);

  if (!isNumber) {
    return <span ref={ref}>{value}</span>;
  }

  return <span ref={ref}>{count.toLocaleString('id-ID')}</span>;
}

function StatCard({ item, index }: { item: StatItem; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <div 
      ref={ref}
      className={`${styles.statCard} glass animate-on-scroll ${isVisible ? 'is-visible' : ''}`} 
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={styles.statContent}>
        <span className={styles.statNumber}>
          <AnimatedCounter value={item.value} />
        </span>
        <span className={styles.statLabel}>{item.label}</span>
        {item.description && (
          <p className={styles.statDescription}>{item.description}</p>
        )}
      </div>
    </div>
  );
}

export function StatsSection({
  data,
}: StatsSectionProps) {
  const { title, items } = data;
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className={`${styles.statsSection} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
      <div className="container">
        {title && (
          <div className={styles.statsHeader}>
            <h2 className={styles.statsTitle}>{title}</h2>
          </div>
        )}

        <div className={styles.statsGrid}>
          {items.map((item, index) => (
            <StatCard key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
