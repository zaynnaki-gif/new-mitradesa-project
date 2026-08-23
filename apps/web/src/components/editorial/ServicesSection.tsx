import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
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

function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  return (
    <Link
      ref={ref}
      to={`/layanan/${service.slug}`}
      className={`${styles.serviceCard} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={styles.cardIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <h3 className={styles.cardTitle}>{service.nama}</h3>
      {service.deskripsi && (
        <p className={styles.cardDesc}>{service.deskripsi}</p>
      )}
      <span className={styles.cardLink}>
        Pelajari <span className={styles.arrow}>&rarr;</span>
      </span>
    </Link>
  );
}

function ServiceListItem({ service, index }: { service: ServiceItem; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  return (
    <div 
      ref={ref}
      className={`${styles.listItem} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <Link
        to={`/layanan/${service.slug}`}
        className={styles.listLink}
      >
        <span className={styles.listIndex}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className={styles.listContent}>
          {service.kategori && (
            <span className={styles.listCategory}>
              {service.kategori.replace(/_/g, ' ')}
            </span>
          )}
          <span className={styles.listTitle}>{service.nama}</span>
        </div>
        <div className={styles.listAction}>
          <svg
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
        </div>
      </Link>
    </div>
  );
}

export function ServicesSection({
  data,
  variant = 'list',
}: ServicesSectionProps) {
  const { eyebrow, title, link, items } = data;
  const isGrid = variant === 'grid';
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: footerRef, isVisible: footerVisible } = useScrollReveal();

  return (
    <section className={styles.servicesSection}>
      <div className="container">
        <div ref={headerRef} className={`${styles.sectionHeader} animate-on-scroll ${headerVisible ? 'is-visible' : ''}`}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={`${styles.title} font-serif`}>{title}</h2>
        </div>

        {isGrid ? (
          <div className={styles.servicesGrid}>
            {items.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>
        ) : (
          <div className={styles.servicesList}>
            {items.map((service, index) => (
              <ServiceListItem key={service.id} service={service} index={index} />
            ))}
          </div>
        )}

        {link && (
          <div ref={footerRef} className={`${styles.servicesFooter} animate-on-scroll ${footerVisible ? 'is-visible' : ''}`}>
            <Link to={link.href} className={styles.btnPrimary}>
              <span>{link.label}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
