import { Link } from 'react-router-dom';
import styles from './TransparencySection.module.css';

export interface TransparencyData {
  eyebrow?: string;
  title: string;
  description?: string;
  pendapatan?: number;
  belanja?: number;
  pembiayaan?: number;
  link?: {
    label: string;
    href: string;
  };
}

interface TransparencySectionProps {
  data: TransparencyData;
}

function formatRupiah(angka?: number): string {
  if (!angka) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(angka);
}

function formatRupiahFull(angka?: number): string {
  if (!angka) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
}

export function TransparencySection({
  data,
}: TransparencySectionProps) {
  const { eyebrow, title, description, pendapatan, belanja, pembiayaan, link } =
    data;

  return (
    <section className={styles.transparency}>
      <div className={styles.transparencyInner}>
        <div className={styles.transparencyHeader}>
          {eyebrow && (
            <span className={styles.transparencyEyebrow}>{eyebrow}</span>
          )}
          <h2 className={styles.transparencyTitle}>{title}</h2>
          {description && (
            <p className={styles.transparencyDescription}>{description}</p>
          )}
        </div>

        {/* Editorial Financial Data */}
        <div className={styles.transparencyGrid}>
          {pendapatan && (
            <div className={styles.transparencyCard}>
              <span className={styles.transparencyCardLabel}>Total Pendapatan</span>
              <span className={styles.transparencyCardValue}>
                {formatRupiah(pendapatan)}
              </span>
              <span className={styles.transparencyCardNote}>
                {formatRupiahFull(pendapatan)}
              </span>
            </div>
          )}

          {belanja && (
            <div className={styles.transparencyCard}>
              <span className={styles.transparencyCardLabel}>Total Belanja</span>
              <span className={`${styles.transparencyCardValue} ${styles.transparencyCardValueDanger}`}>
                {formatRupiah(belanja)}
              </span>
              <span className={styles.transparencyCardNote}>
                {formatRupiahFull(belanja)}
              </span>
            </div>
          )}

          {pembiayaan !== undefined && (
            <div className={styles.transparencyCard}>
              <span className={styles.transparencyCardLabel}>Total Pembiayaan</span>
              <span className={`${styles.transparencyCardValue} ${styles.transparencyCardValueAccent}`}>
                {formatRupiah(pembiayaan)}
              </span>
              <span className={styles.transparencyCardNote}>
                {formatRupiahFull(pembiayaan)}
              </span>
            </div>
          )}
        </div>

        {/* Visual Representation */}
        {pendapatan && belanja && (
          <div className={styles.transparencyVisual}>
            <div className={styles.transparencyBars}>
              <div className={styles.transparencyBar}>
                <span className={styles.transparencyBarLabel}>Pendapatan</span>
                <div className={styles.transparencyBarTrack}>
                  <div
                    className={`${styles.transparencyBarFill} ${styles.transparencyBarFillSuccess}`}
                    style={{ width: '100%' }}
                  />
                </div>
                <span className={styles.transparencyBarValue}>
                  {formatRupiah(pendapatan)}
                </span>
              </div>

              <div className={styles.transparencyBar}>
                <span className={styles.transparencyBarLabel}>Belanja</span>
                <div className={styles.transparencyBarTrack}>
                  <div
                    className={`${styles.transparencyBarFill} ${styles.transparencyBarFillDanger}`}
                    style={{
                      width: belanja && pendapatan
                        ? `${Math.min((belanja / pendapatan) * 100, 100)}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className={styles.transparencyBarValue}>
                  {formatRupiah(belanja)}
                </span>
              </div>

              {pembiayaan !== undefined && (
                <div className={styles.transparencyBar}>
                  <span className={styles.transparencyBarLabel}>Pembiayaan</span>
                  <div className={styles.transparencyBarTrack}>
                    <div
                      className={`${styles.transparencyBarFill} ${styles.transparencyBarFillAccent}`}
                      style={{
                        width: pembiayaan && pendapatan
                          ? `${Math.min((Math.abs(pembiayaan) / pendapatan) * 100, 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <span className={styles.transparencyBarValue}>
                    {formatRupiah(pembiayaan)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {link && (
          <div className={styles.transparencyFooter}>
            <Link to={link.href} className={styles.transparencyLink}>
              <span>{link.label}</span>
              <svg
                width="20"
                height="20"
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
        )}
      </div>
    </section>
  );
}
