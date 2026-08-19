import { Link } from 'react-router-dom';
import styles from './TimelineSection.module.css';

export interface TimelineItem {
  id: string;
  judul: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  lokasi?: string;
  waktu?: string;
  status: 'MENDATANG' | 'BERLANGSUNG' | 'SELESAI' | 'BATAL';
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
    case 'MENDATANG':
      return 'Mendatang';
    case 'BERLANGSUNG':
      return 'Berlangsung';
    case 'SELESAI':
      return 'Selesai';
    case 'BATAL':
      return 'Dibatalkan';
    default:
      return status;
  }
}

function getStatusClass(status: TimelineItem['status']): string {
  switch (status) {
    case 'MENDATANG':
      return styles.timelineCardStatusUpcoming;
    case 'BERLANGSUNG':
      return styles.timelineCardStatusOngoing;
    case 'SELESAI':
    case 'BATAL':
      return styles.timelineCardStatusPast;
    default:
      return '';
  }
}

export function TimelineSection({
  data,
  variant = 'default',
}: TimelineSectionProps) {
  const { eyebrow, title, link, items } = data;
  const isHorizontal = variant === 'horizontal';

  return (
    <section className={styles.timeline}>
      <div className={styles.timelineInner}>
        <header className={styles.timelineHeader}>
          {eyebrow && <span className={styles.timelineEyebrow}>{eyebrow}</span>}
          <h2 className={styles.timelineTitle}>{title}</h2>
        </header>

        <div className={`${styles.timelineContent} ${isHorizontal ? styles.timelineHorizontal : ''}`}>
          {items.map((item) => {
            const { day, month, year } = formatDate(item.tanggalMulai);

            return (
              <article key={item.id} className={styles.timelineItem}>
                <div className={styles.timelineDate}>
                  <span className={styles.timelineDay}>{day}</span>
                  <span className={styles.timelineMonthYear}>
                    {month} {year}
                  </span>
                </div>
                <div className={styles.timelineCard}>
                  <h3 className={styles.timelineCardTitle}>{item.judul}</h3>
                  <div className={styles.timelineCardMeta}>
                    {item.waktu && (
                      <span className={styles.timelineCardMetaItem}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {item.waktu}
                      </span>
                    )}
                    {item.lokasi && (
                      <span className={styles.timelineCardMetaItem}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {item.lokasi}
                      </span>
                    )}
                  </div>
                  <span className={`${styles.timelineCardStatus} ${getStatusClass(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {link && (
          <div className={styles.timelineLink}>
            <Link to={link.href}>
              {link.label}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
