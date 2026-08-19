import { Link } from 'react-router-dom';
import styles from './CommunitySection.module.css';

export interface Person {
  id: string;
  nama: string;
  jabatan?: string;
  fotoUrl?: string;
}

export interface CommunityData {
  eyebrow?: string;
  title: string;
  description?: string;
  quote?: {
    text: string;
    name: string;
    role?: string;
  };
  people: Person[];
  link?: {
    label: string;
    href: string;
  };
}

interface CommunitySectionProps {
  data: CommunityData;
}

export function CommunitySection({ data }: CommunitySectionProps) {
  const { eyebrow, title, description, quote, people, link } = data;

  return (
    <section className={styles.community}>
      <div className={styles.communityInner}>
        <header className={styles.communityHeader}>
          <div className={styles.communityHeaderLeft}>
            {eyebrow && (
              <span className={styles.communityEyebrow}>{eyebrow}</span>
            )}
            <h2 className={styles.communityTitle}>{title}</h2>
          </div>
          {description && (
            <div className={styles.communityHeaderRight}>
              <p className={styles.communityDescription}>{description}</p>
            </div>
          )}
        </header>

        <div className={styles.communityGrid}>
          {people.map((person) => (
            <article key={person.id} className={styles.personCard}>
              <div className={styles.personImage}>
                {person.fotoUrl ? (
                  <img
                    src={person.fotoUrl}
                    alt={person.nama}
                    loading="lazy"
                  />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{
                      width: '64px',
                      height: '64px',
                      color: 'var(--stone-400)',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <h3 className={styles.personName}>{person.nama}</h3>
              {person.jabatan && (
                <p className={styles.personRole}>
                  {person.jabatan.replace(/_/g, ' ')}
                </p>
              )}
            </article>
          ))}
        </div>

        {quote && (
          <blockquote className={styles.communityQuote}>
            <p className={styles.communityQuoteText}>{quote.text}</p>
            <footer className={styles.communityQuoteAuthor}>
              <span className={styles.communityQuoteName}>{quote.name}</span>
              {quote.role && (
                <span className={styles.communityQuoteRole}>{quote.role}</span>
              )}
            </footer>
          </blockquote>
        )}

        {link && (
          <div className={styles.communityLink}>
            <Link to={link.href}>{link.label}</Link>
          </div>
        )}
      </div>
    </section>
  );
}
