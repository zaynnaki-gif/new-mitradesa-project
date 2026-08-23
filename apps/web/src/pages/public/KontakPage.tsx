import { PublicLayout } from '@/layouts';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './KontakPage.module.css';

function ContactCard({ children, style, className = '', delay = 0 }: { children: React.ReactNode, style?: React.CSSProperties, className?: string, delay?: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  return (
    <div 
      ref={ref} 
      className={`${styles.card} ${className} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}


export default function KontakPage() {
  const { data: identitas } = useIdentitasDesa();

  const villageName = identitas?.namaDesa || 'Desa';

  // SEO
  useSEO({
    title: getPageTitle(`Kontak ${villageName}`),
    description: `Informasi kontak ${villageName} - Alamat, telepon, email, dan peta lokasi.`,
  });

  return (
    <PublicLayout>
      <EditorialHero
        title="Kontak Kami"
        subtitle={`Hubungi kami untuk informasi lebih lanjut tentang ${villageName}`}
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {/* Contact Cards */}
          <div className={styles.cardsGrid}>
            {/* Address */}
            <ContactCard delay={0}>
              <h2 className={styles.cardTitle}>
                <div className={styles.cardIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0 0 0-9 6-13z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                Alamat
              </h2>
              {identitas?.alamat ? (
                <div className={styles.contactList}>
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemLabel}>Alamat Lengkap</span>
                    <span className={styles.contactItemValue}>{identitas.alamat}</span>
                  </div>
                  {identitas?.kodepos && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactItemLabel}>Kode Pos</span>
                      <span className={styles.contactItemValue}>{identitas.kodepos}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className={styles.emptyText}>Alamat belum tersedia</p>
              )}
            </ContactCard>

            {/* Contact Info */}
            <ContactCard delay={100}>
              <h2 className={styles.cardTitle}>
                <div className={styles.cardIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                Informasi Kontak
              </h2>
              <div className={styles.contactList}>
                {identitas?.telepon && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemLabel}>Telepon</span>
                    <a href={`tel:${identitas.telepon}`} className={styles.contactItemLink}>{identitas.telepon}</a>
                  </div>
                )}
                {identitas?.whatsapp && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemLabel}>WhatsApp</span>
                    <a href={`https://wa.me/${identitas.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={styles.contactItemLink}>{identitas.whatsapp}</a>
                  </div>
                )}
                {identitas?.email && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemLabel}>Email</span>
                    <a href={`mailto:${identitas.email}`} className={styles.contactItemLink}>{identitas.email}</a>
                  </div>
                )}
                {identitas?.website && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemLabel}>Website</span>
                    <a href={identitas.website} target="_blank" rel="noopener noreferrer" className={styles.contactItemLink}>{identitas.website}</a>
                  </div>
                )}
                {!identitas?.telepon && !identitas?.whatsapp && !identitas?.email && !identitas?.website && (
                  <p className={styles.emptyText}>Informasi kontak belum tersedia</p>
                )}
              </div>
            </ContactCard>

            {/* Leadership - Full Width */}
            {(identitas?.kepalaDesa || identitas?.sekretarisDesa) && (
              <ContactCard className={styles.cardFull} delay={200}>
                <h2 className={styles.cardTitle}>
                  <div className={styles.cardIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  Pemerintahan
                </h2>
                <div className={styles.contactList}>
                  {identitas?.kepalaDesa && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactItemLabel}>Kepala Desa</span>
                      <span className={styles.contactItemValue}>{identitas.kepalaDesa}</span>
                    </div>
                  )}
                  {identitas?.sekretarisDesa && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactItemLabel}>Sekretaris Desa</span>
                      <span className={styles.contactItemValue}>{identitas.sekretarisDesa}</span>
                    </div>
                  )}
                </div>
              </ContactCard>
            )}
          </div>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
