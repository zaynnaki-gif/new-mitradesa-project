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
      <section className={`${styles.statement} ${styles.statementDark}`}>
        <div className={styles.statementInner}>
          <blockquote className={styles.statementQuote}>
            <span className={styles.statementQuoteMark}>"</span>
            <p className={styles.statementQuoteText}>{title}</p>
            {author && (
              <cite className={styles.statementQuoteAuthor}>
                <span className={styles.statementQuoteDash}>—</span>
                {author}
              </cite>
            )}
          </blockquote>
        </div>
      </section>
    );
  }

  if (isCentered) {
    return (
      <section className={`${styles.statement} ${styles.statementCentered}`}>
        <div className={styles.statementInner}>
          <div className={styles.statementContent}>
            {eyebrow && <span className={styles.statementEyebrow}>{eyebrow}</span>}
            <h2 className={styles.statementTitle}>{title}</h2>
            {bodyContent && (
              <div className={styles.statementBody}>{bodyContent}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Default: Editorial asymmetric layout
  return (
    <section className={`${styles.statement} ${styles.statementEditorial}`}>
      <div className={styles.statementInner}>
        <div className={styles.statementGrid}>
          {/* Left: Large title with eyebrow */}
          <div className={styles.statementLeft}>
            {eyebrow && <span className={styles.statementEyebrow}>{eyebrow}</span>}
            <h2 className={styles.statementTitleLarge}>{title}</h2>
          </div>

          {/* Right: Body text */}
          {bodyContent && (
            <div className={styles.statementRight}>
              <div className={styles.statementBody}>{bodyContent}</div>
              <div className={styles.statementDivider} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
