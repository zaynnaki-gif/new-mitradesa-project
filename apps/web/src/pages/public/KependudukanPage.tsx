import { PublicLayout } from '@/layouts';
import { LoadingState, ErrorState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useStatistikDesa } from '@/hooks/useStatistikDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import styles from './KependudukanPage.module.css';

export default function KependudukanPage() {
  const { data: identitas, isLoading: identitasLoading, error: identitasError, refetch: refetchIdentitas } = useIdentitasDesa();
  const { data: statistik, loading: statistikLoading, error: statistikError, refetch: refetchStatistik } = useStatistikDesa();

  const isLoading = identitasLoading || statistikLoading;
  const error = identitasError || statistikError;
  const refetch = () => {
    refetchIdentitas();
    refetchStatistik();
  };

  const villageName = identitas?.namaDesa || 'Desa';

  // SEO
  useSEO({
    title: getPageTitle(`Kependudukan ${villageName}`),
    description: `Statistik kependudukan ${villageName} - Data penduduk, keluarga, dan demografi desa.`,
  });

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Kependudukan</h1>
          <p className={styles.pageSubtitle}>
            Statistik kependudukan {identitas?.namaDesa || 'kami'}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className={styles.content}>
        <div className={styles.container}>
          {isLoading && (
            <LoadingState message="Memuat statistik..." fullPage />
          )}

          {error && (
            <ErrorState
              title="Gagal Memuat Data"
              message="Tidak dapat memuat statistik kependudukan. Silakan coba lagi."
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !error && statistik && (
            <div className={styles.grid}>
              <div className={styles.statCard}>
                 <div className={styles.statValue}>{statistik.penduduk.total.toLocaleString()}</div>
                 <div className={styles.statLabel}>Total Penduduk (Jiwa)</div>
              </div>
              <div className={styles.statCard}>
                 <div className={`${styles.statValue} ${styles.green}`}>{statistik.penduduk.lakiLaki.toLocaleString()}</div>
                 <div className={styles.statLabel}>Laki-Laki (Jiwa)</div>
              </div>
              <div className={styles.statCard}>
                 <div className={`${styles.statValue} ${styles.blue}`}>{statistik.penduduk.perempuan.toLocaleString()}</div>
                 <div className={styles.statLabel}>Perempuan (Jiwa)</div>
              </div>
              <div className={styles.statCard}>
                 <div className={styles.statValue}>{statistik.keluarga.toLocaleString()}</div>
                 <div className={styles.statLabel}>Total Keluarga (KK)</div>
              </div>
              <div className={styles.statCard}>
                 <div className={styles.statValue}>{statistik.wilayah.dusun.toLocaleString()}</div>
                 <div className={styles.statLabel}>Jumlah Dusun</div>
              </div>
              <div className={styles.statCard}>
                 <div className={styles.statValue}>{statistik.wilayah.rt.toLocaleString()}</div>
                 <div className={styles.statLabel}>Jumlah RT</div>
              </div>
              <div className={styles.statCard}>
                 <div className={styles.statValue}>{statistik.wilayah.rw.toLocaleString()}</div>
                 <div className={styles.statLabel}>Jumlah RW</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
