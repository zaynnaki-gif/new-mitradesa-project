import { Link } from 'react-router-dom';
import styles from './ServicesSection.module.css';

export interface ServiceItem {
  id: string;
  slug: string;
  nama: string;
  kategori?: string;
  deskripsi?: string;
  gambarUrl?: string;
}

export interface ServicesData {
  eyebrow?: string;
  title: string;
  link?: {
    label: string;
    href: string;
  };
  items: ServiceItem[];
}

interface ServicesSectionProps {
  data: ServicesData;
  variant?: 'list' | 'grid';
}

const getCategoryIcon = (kategori?: string) => {
  switch (kategori?.toUpperCase()) {
    case 'SURAT':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'PENGANTAR':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'IZIN':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
  }
};

export function ServicesSection({
  data,
  variant = 'list',
}: ServicesSectionProps) {
  const { eyebrow, title, link, items } = data;
  const isGrid = variant === 'grid';

  return (
    <section className={styles.services}>
      <div className={styles.servicesInner}>
        <header className={styles.servicesHeader}>
          <div className={styles.servicesHeaderLeft}>
            {eyebrow && <span className={styles.servicesEyebrow}>{eyebrow}</span>}
            <h2 className={styles.servicesTitle}>{title}</h2>
          </div>
          {link && (
            <div className={styles.servicesLink}>
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
        </header>

        {isGrid ? (
          <div className={styles.servicesGrid}>
            {items.map((service) => (
              <Link
                key={service.id}
                to={`/layanan/${service.slug}`}
                className={styles.serviceCard}
              >
                <div className={styles.serviceCardIcon}>
                  {getCategoryIcon(service.kategori)}
                </div>
                <h3 className={styles.serviceCardTitle}>{service.nama}</h3>
                {service.deskripsi && (
                  <p className={styles.serviceCardDescription}>
                    {service.deskripsi}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.servicesList}>
            {items.map((service, index) => (
              <div key={service.id} className={styles.serviceItem}>
                <Link
                  to={`/layanan/${service.slug}`}
                  className={styles.serviceLink}
                >
                  <span className={styles.serviceIndex}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className={styles.serviceContent}>
                    {service.kategori && (
                      <span className={styles.serviceCategory}>
                        {service.kategori.replace(/_/g, ' ')}
                      </span>
                    )}
                    <span className={styles.serviceTitle}>{service.nama}</span>
                    {service.deskripsi && (
                      <span className={styles.serviceDescription}>
                        {service.deskripsi}
                      </span>
                    )}
                  </div>
                  {service.gambarUrl && (
                    <img
                      src={service.gambarUrl}
                      alt={service.nama}
                      className={styles.serviceImage}
                      loading="lazy"
                    />
                  )}
                  <svg
                    className={styles.serviceArrow}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
