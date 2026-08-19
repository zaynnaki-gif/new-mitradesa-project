import styles from './StatementSection.module.css';

export interface StatementData {
  eyebrow?: string;
  title: string;
  body?: string | string[];
  variant?: 'default' | 'centered' | 'quote';
  author?: string;
}

interface StatementSectionProps {
  data: StatementData;
  variant?: 'default' | 'centered' | 'quote';
}

export function StatementSection({
  data,
  variant = 'default',
}: StatementSectionProps) {
  const { eyebrow, title, body, author } = data;
  const isQuote = variant === 'quote' || data.variant === 'quote';
  const isCentered = variant === 'centered' || data.variant === 'centered';

  const bodyContent = Array.isArray(body)
    ? body.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))
    : body;

  if (isQuote) {
    return (
      <section className={`${styles.statement} ${styles.statementCentered}`}>
        <div className={styles.statementInner}>
          <div className={styles.statementContent}>
            <blockquote className={styles.statementQuote}>
              {eyebrow && <span className={styles.statementEyebrow}>{eyebrow}</span>}
              <p className={styles.statementQuoteText}>{title}</p>
              {author && (
                <footer className={styles.statementQuoteAuthor}>{author}</footer>
              )}
            </blockquote>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${styles.statement} ${isCentered ? styles.statementCentered : ''}`}
    >
      <div className={styles.statementInner}>
        <div className={styles.statementContent}>
          <div className={styles.statementLeft}>
            {eyebrow && <span className={styles.statementEyebrow}>{eyebrow}</span>}
            <h2 className={styles.statementTitle}>{title}</h2>
          </div>
          {bodyContent && (
            <div className={styles.statementRight}>
              <div className={styles.statementBody}>{bodyContent}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
