import { PublicLayout } from '@/layouts';

import { LoadingState, EmptyState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { useApbdes } from '@/hooks/useTransparansi';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './TransparansiPage.module.css';

function SummaryCard({ label, value, type, delay = 0 }: { label: string, value: string, type: 'pendapatan' | 'belanja' | 'pembiayaan', delay?: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  return (
    <div 
      ref={ref} 
      className={`${styles.summaryCard} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className={styles.summaryLabel}>{label}</span>
      <span className={`${styles.summaryValue} ${styles[type]}`}>{value}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ItemCard({ item, percentage, type, delay = 0 }: { item: any, percentage: number, type: 'pendapatan' | 'belanja' | 'pembiayaan', delay?: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  const formatRupiah = (angka: number) => {
    if (isNaN(angka) || angka === null || angka === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka);
  };
  
  return (
    <div 
      ref={ref} 
      className={`${styles.itemCard} animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
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
            className={`${styles.progressBar} ${styles[type]}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Persentase</span>
          <span className={styles.statValue}>{percentage}%</span>
        </div>
      </div>
    </div>
  );
}


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
                <SummaryCard label="Total Pendapatan" value={formatRupiah(apbdes.totalPendapatan)} type="pendapatan" delay={0} />
                <SummaryCard label="Total Belanja" value={formatRupiah(apbdes.totalBelanja)} type="belanja" delay={100} />
                <SummaryCard label="Pembiayaan Netto" value={formatRupiah(apbdes.totalPembiayaan)} type="pembiayaan" delay={200} />
              </div>

              {/* Details */}
              <div className={styles.detailGrid}>
                {/* Pendapatan */}
                <div className={styles.detailColumn}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>Pendapatan</span>
                  </div>
                  <div className={styles.itemContainer}>
                    {apbdes.items.filter(i => i.kategori === 'PENDAPATAN').map((item, index) => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        percentage={calculatePercentage(item.realisasi, item.anggaran)} 
                        type="pendapatan" 
                        delay={index * 100} 
                      />
                    ))}
                  </div>
                </div>

                {/* Belanja */}
                <div className={styles.detailColumn}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>Belanja</span>
                  </div>
                  <div className={styles.itemContainer}>
                    {apbdes.items.filter(i => i.kategori === 'BELANJA').map((item, index) => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        percentage={calculatePercentage(item.realisasi, item.anggaran)} 
                        type="belanja" 
                        delay={index * 100} 
                      />
                    ))}
                  </div>
                </div>

                {/* Pembiayaan */}
                <div className={styles.detailColumn}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>Pembiayaan</span>
                  </div>
                  <div className={styles.itemContainer}>
                    {apbdes.items.filter(i => i.kategori === 'PEMBIAYAAN').map((item, index) => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        percentage={calculatePercentage(item.realisasi, item.anggaran)} 
                        type="pembiayaan" 
                        delay={index * 100} 
                      />
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
