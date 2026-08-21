import { PublicLayout } from '@/layouts';

import { LoadingState, EmptyState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { useApbdes } from '@/hooks/useTransparansi';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import styles from './TransparansiPage.module.css';

export default function TransparansiPage() {
  const { data: identitas } = useIdentitasDesa();
  const { data: apbdes, loading, error } = useApbdes();

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: getPageTitle(`Transparansi APBDes ${villageName}`),
    description: `Laporan Transparansi Anggaran Pendapatan dan Belanja Desa (APBDes) ${villageName}.`,
  });

  const formatRupiah = (angka: number) => {
    if (isNaN(angka) || angka === null || angka === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const calculatePercentage = (realisasi: number, anggaran: number) => {
    if (!anggaran || isNaN(anggaran) || anggaran === 0) return 0;
    const real = isNaN(realisasi) || realisasi === null ? 0 : realisasi;
    return Math.min(Math.round((real / anggaran) * 100), 100);
  };

  return (
    <PublicLayout>
      <EditorialHero 
        title="Transparansi APBDes" 
        subtitle={`Informasi Anggaran Pendapatan dan Belanja ${villageName} ${apbdes ? ` Tahun Anggaran ${apbdes.tahun}` : ''}`} 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {loading && <LoadingState message="Memuat data transparansi..." />}

          {error && (
            <EmptyState
              title="Data Belum Tersedia"
              message="Data transparansi APBDes belum dipublikasikan oleh pemerintah desa."
              icon="document"
            />
          )}

          {!loading && !error && !apbdes && (
            <EmptyState
              title="Data Belum Dipublikasikan"
              message="Laporan APBDes tahun ini sedang dalam proses penyusunan."
              icon="document"
            />
          )}

          {!loading && !error && apbdes && (
            <>
              {/* Summary Cards */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Pendapatan</span>
                  <span className={`${styles.summaryValue} ${styles.pendapatan}`}>
                    {formatRupiah(apbdes.totalPendapatan)}
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Belanja</span>
                  <span className={`${styles.summaryValue} ${styles.belanja}`}>
                    {formatRupiah(apbdes.totalBelanja)}
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Pembiayaan Netto</span>
                  <span className={`${styles.summaryValue} ${styles.pembiayaan}`}>
                    {formatRupiah(apbdes.totalPembiayaan)}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className={styles.detailGrid}>
                {/* Pendapatan */}
                <div className={styles.detailColumn}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>Pendapatan</span>
                  </div>
                  <div className={styles.itemContainer}>
                    {apbdes.items.filter(i => i.kategori === 'PENDAPATAN').map(item => (
                      <div key={item.id} className={styles.itemCard}>
                        <div className={styles.itemTitle}>{item.nama}</div>
                        <div className={styles.itemStats}>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Anggaran</span>
                            <span className={styles.statValue}>{formatRupiah(item.anggaran)}</span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Realisasi</span>
                            <span className={styles.statValue}>{formatRupiah(item.realisasi)}</span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div 
                              className={`${styles.progressBar} ${styles.pendapatan}`} 
                              style={{ width: `${calculatePercentage(item.realisasi, item.anggaran)}%` }}
                            />
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Persentase</span>
                            <span className={styles.statValue}>{calculatePercentage(item.realisasi, item.anggaran)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Belanja */}
                <div className={styles.detailColumn}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>Belanja</span>
                  </div>
                  <div className={styles.itemContainer}>
                    {apbdes.items.filter(i => i.kategori === 'BELANJA').map(item => (
                      <div key={item.id} className={styles.itemCard}>
                        <div className={styles.itemTitle}>{item.nama}</div>
                        <div className={styles.itemStats}>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Anggaran</span>
                            <span className={styles.statValue}>{formatRupiah(item.anggaran)}</span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Realisasi</span>
                            <span className={styles.statValue}>{formatRupiah(item.realisasi)}</span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div 
                              className={`${styles.progressBar} ${styles.belanja}`} 
                              style={{ width: `${calculatePercentage(item.realisasi, item.anggaran)}%` }}
                            />
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Persentase</span>
                            <span className={styles.statValue}>{calculatePercentage(item.realisasi, item.anggaran)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pembiayaan */}
                <div className={styles.detailColumn}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>Pembiayaan</span>
                  </div>
                  <div className={styles.itemContainer}>
                    {apbdes.items.filter(i => i.kategori === 'PEMBIAYAAN').map(item => (
                      <div key={item.id} className={styles.itemCard}>
                        <div className={styles.itemTitle}>{item.nama}</div>
                        <div className={styles.itemStats}>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Anggaran</span>
                            <span className={styles.statValue}>{formatRupiah(item.anggaran)}</span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Realisasi</span>
                            <span className={styles.statValue}>{formatRupiah(item.realisasi)}</span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div 
                              className={`${styles.progressBar} ${styles.pembiayaan}`} 
                              style={{ width: `${calculatePercentage(item.realisasi, item.anggaran)}%` }}
                            />
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statLabel}>Persentase</span>
                            <span className={styles.statValue}>{calculatePercentage(item.realisasi, item.anggaran)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
