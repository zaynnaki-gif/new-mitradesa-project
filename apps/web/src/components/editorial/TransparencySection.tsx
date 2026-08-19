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

export function TransparencySection({
  data,
}: TransparencySectionProps) {
  const { eyebrow, title, description, pendapatan, belanja, pembiayaan, link } =
    data;

  return (
    <section className={styles.transparency}>
      <div className={styles.transparencyInner}>
        <header className={styles.transparencyHeader}>
          {eyebrow && (
            <span className={styles.transparencyEyebrow}>{eyebrow}</span>
          )}
          <h2 className={styles.transparencyTitle}>{title}</h2>
          {description && (
            <p className={styles.transparencyDescription}>{description}</p>
          )}
        </header>

        {/* Financial Highlights */}
        <div className={styles.transparencyHighlights}>
          <div className={styles.highlightCard}>
            <p className={styles.highlightLabel}>Total Pendapatan</p>
            <p className={`${styles.highlightValue} ${styles.highlightValueSuccess}`}>
              {formatRupiah(pendapatan)}
            </p>
            <p className={styles.highlightNote}>APBDes Tahun Berjalan</p>
          </div>

          <div className={styles.highlightCard}>
            <p className={styles.highlightLabel}>Total Belanja</p>
            <p className={`${styles.highlightValue} ${styles.highlightValueDanger}`}>
              {formatRupiah(belanja)}
            </p>
            <p className={styles.highlightNote}>Realisasi Belanja</p>
          </div>

          <div className={styles.highlightCard}>
            <p className={styles.highlightLabel}>Total Pembiayaan</p>
            <p className={`${styles.highlightValue} ${styles.highlightValueInfo}`}>
              {formatRupiah(pembiayaan)}
            </p>
            <p className={styles.highlightNote}>Netto Pembiayaan</p>
          </div>
        </div>

        {/* Visual Representation */}
        {pendapatan && belanja && (
          <div className={styles.transparencyVisual}>
            <h3 className={styles.transparencyVisualTitle}>
              Perbandingan APBDes
            </h3>
            <div className={styles.transparencyBars}>
              <div className={styles.transparencyBar}>
                <span className={styles.transparencyBarLabel}>Pendapatan</span>
                <div className={styles.transparencyBarTrack}>
                  <div
                    className={`${styles.transparencyBarFill}`}
                    style={{
                      width: '100%',
                      backgroundColor: '#16A34A',
                    }}
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
                    className={`${styles.transparencyBarFill}`}
                    style={{
                      width: belanja && pendapatan
                        ? `${Math.min((belanja / pendapatan) * 100, 100)}%`
                        : '0%',
                      backgroundColor: '#DC2626',
                    }}
                  />
                </div>
                <span className={styles.transparencyBarValue}>
                  {formatRupiah(belanja)}
                </span>
              </div>

              <div className={styles.transparencyBar}>
                <span className={styles.transparencyBarLabel}>Pembiayaan</span>
                <div className={styles.transparencyBarTrack}>
                  <div
                    className={`${styles.transparencyBarFill}`}
                    style={{
                      width: pembiayaan && pendapatan
                        ? `${Math.min((Math.abs(pembiayaan) / pendapatan) * 100, 100)}%`
                        : '0%',
                      backgroundColor: '#F59E0B',
                    }}
                  />
                </div>
                <span className={styles.transparencyBarValue}>
                  {formatRupiah(pembiayaan)}
                </span>
              </div>
            </div>
          </div>
        )}

        {link && (
          <div className={styles.transparencyLink}>
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
