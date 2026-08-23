import { Link } from 'react-router-dom';
import styles from './TimelineSection.module.css';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export interface TimelineItem {
  id: string;
  judul: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  lokasi?: string;
  waktu?: string;
  status: 'MENDATANG' | 'BERLANGSUNG' | 'SELESAI' | 'BATAL' | string;
}

export interface TimelineData {
  eyebrow?: string;
  title: string;
  link?: {
    label: string;
    href: string;
  };
  items: TimelineItem[];
}

interface TimelineSectionProps {
  data: TimelineData;
  variant?: 'default' | 'horizontal';
}

function formatDate(dateStr: string): { day: string; month: string; year: string } {
  const date = new Date(dateStr);
  return {
    day: date.getDate().toString(),
    month: date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
    year: date.getFullYear().toString(),
  };
}

function getStatusLabel(status: TimelineItem['status']): string {
  switch (status) {
    case 'MENDATANG': return 'Mendatang';
    case 'BERLANGSUNG': return 'Berlangsung';
    case 'SELESAI': return 'Selesai';
    case 'BATAL': return 'Dibatalkan';
    default: return status;
  }
}

function getStatusClass(status: TimelineItem['status']): string {
  switch (status) {
    case 'MENDATANG': return styles.statusUpcoming;
    case 'BERLANGSUNG': return styles.statusOngoing;
    case 'SELESAI':
    case 'BATAL': return styles.statusPast;
    default: return styles.statusDefault;
  }
}

function TimelineItemCard({ item, index }: { item: TimelineItem; index: number }) {
  const { day, month, year } = formatDate(item.tanggalMulai);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <article 
      ref={ref as any}
      className={`${styles.timelineItem} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${(index % 3) * 150}ms` }}
    >
      <div className={styles.timelineDate}>
        <span className={styles.timelineDay}>{day}</span>
        <span className={styles.timelineMonthYear}>{month} {year}</span>
      </div>
      
      <div className={`${styles.timelineDot} ${isVisible ? styles.dotActive : ''}`}></div>
      
      <div className={styles.timelineCard}>
        <h3 className={styles.cardTitle}>{item.judul}</h3>
        <div className={styles.cardMeta}>
          {item.lokasi && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {item.lokasi}
            </span>
          )}
        </div>
        <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
          {getStatusLabel(item.status)}
        </span>
      </div>
    </article>
  );
}

export function TimelineSection({
  data,
}: TimelineSectionProps) {
  const { eyebrow, title, link, items } = data;
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

  return (
    <section className={styles.timelineSection}>
      <div className="container">
        <div ref={headerRef as any} className={`${styles.sectionHeader} animate-on-scroll ${headerVisible ? 'is-visible' : ''}`}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={`${styles.title} font-serif`}>{title}</h2>
        </div>

        <div className={styles.timelineContent}>
          {items.map((item, index) => (
            <TimelineItemCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {link && (
          <div className={`${styles.footerLink} animate-on-scroll is-visible delay-400`}>
            <Link to={link.href} className={styles.btnOutline}>
              {link.label} &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
