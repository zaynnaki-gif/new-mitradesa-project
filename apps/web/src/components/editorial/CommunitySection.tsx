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
    <section className={styles.communitySection}>
      <div className="container">
        <div className={styles.headerLayout}>
          <div className={`${styles.headerLeft} animate-fade-up`}>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h2 className={`${styles.title} font-serif`}>{title}</h2>
          </div>
          {description && (
            <div className={`${styles.headerRight} animate-fade-up delay-100`}>
              <p className={styles.description}>{description}</p>
              {link && (
                <div className={styles.headerLink}>
                  <Link to={link.href} className={styles.btnOutline}>
                    {link.label} &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.communityGrid}>
          {people.map((person, index) => (
            <article 
              key={person.id} 
              className={`${styles.personCard} animate-fade-up`}
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
            >
              <div className={styles.personImageWrapper}>
                {person.fotoUrl ? (
                  <img
                    src={person.fotoUrl}
                    alt={person.nama}
                    className={styles.personImage}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div className={styles.imageOverlay}></div>
              </div>
              <div className={styles.personInfo}>
                <h3 className={styles.personName}>{person.nama}</h3>
                {person.jabatan && (
                  <p className={styles.personRole}>
                    {person.jabatan.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        {quote && (
          <div className={`${styles.quoteWrapper} animate-fade-up delay-500`}>
            <blockquote className={`${styles.quoteBox} glass-light`}>
              <svg className={styles.quoteIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className={styles.quoteText}>{quote.text}</p>
              <footer className={styles.quoteAuthor}>
                <span className={styles.quoteName}>{quote.name}</span>
                {quote.role && (
                  <span className={styles.quoteRole}> &mdash; {quote.role}</span>
                )}
              </footer>
            </blockquote>
          </div>
        )}
      </div>
    </section>
  );
}
