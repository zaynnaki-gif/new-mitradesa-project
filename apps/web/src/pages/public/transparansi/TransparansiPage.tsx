import { useState } from 'react';
import { PublicLayout } from '@/layouts';
import { LoadingState, EmptyState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { useApbdes, useRpjmdes } from '@/hooks/useTransparansi';
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
  const { data: apbdes, loading: loadingApbdes, error: errorApbdes } = useApbdes();
  const { data: rpjmdes, loading: loadingRpjmdes, error: errorRpjmdes } = useRpjmdes();
  
  const [activeTab, setActiveTab] = useState<'rpjmdes' | 'rkpdes' | 'apbdes'>('rpjmdes');

  const villageName = identitas?.namaDesa || 'Desa';

  useSEO({
    title: getPageTitle(`Transparansi Perencanaan & Keuangan ${villageName}`),
    description: `Informasi Transparansi RPJMDes, RKPDes, dan APBDes ${villageName}.`,
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
        title="Transparansi Pembangunan" 
        subtitle={`Informasi Perencanaan (RPJMDes & RKPDes) dan Keuangan (APBDes) ${villageName}`} 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          
          <div className={styles.tabsContainer}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'rpjmdes' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('rpjmdes')}
            >
              Rencana 6 Tahunan (RPJMDes)
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'rkpdes' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('rkpdes')}
            >
              Rencana Tahunan (RKPDes)
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'apbdes' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('apbdes')}
            >
              Realisasi Keuangan (APBDes)
            </button>
          </div>

          <div className={styles.tabContent}>
            {/* RPJMDES TAB */}
            {activeTab === 'rpjmdes' && (
              <div>
                {loadingRpjmdes && <LoadingState message="Memuat data RPJMDes..." />}
                {errorRpjmdes && <EmptyState title="Data Belum Tersedia" message="RPJMDes belum dipublikasikan." icon="document" />}
                {!loadingRpjmdes && !errorRpjmdes && rpjmdes && (
                  <div className={styles.rpjmdesWrapper}>
                    <div className={styles.visiMisiSection}>
                      <h2>Visi</h2>
                      <p>{rpjmdes.visi}</p>
                      <h2>Misi</h2>
                      <div className={styles.misiContent} dangerouslySetInnerHTML={{ __html: rpjmdes.misi.replace(/\n/g, '<br/>') }} />
                    </div>
                    
                    <h3 className={styles.bidangTitle}>Bidang Pembangunan</h3>
                    <div className={styles.bidangList}>
                      {rpjmdes.bidangs.map((b, index) => (
                        <div key={b.id} className={styles.bidangCard}>
                          <span className={styles.bidangNumber}>{index + 1}</span>
                          <span className={styles.bidangName}>{b.namaBidang}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RKPDES TAB */}
            {activeTab === 'rkpdes' && (
              <div>
                {loadingRpjmdes && <LoadingState message="Memuat data RKPDes..." />}
                {errorRpjmdes && <EmptyState title="Data Belum Tersedia" message="RKPDes belum dipublikasikan." icon="document" />}
                {!loadingRpjmdes && !errorRpjmdes && rpjmdes && (
                  <div className={styles.rkpdesWrapper}>
                    {rpjmdes.bidangs.map((bidang) => (
                      <div key={bidang.id} className={styles.rkpdesBidangGroup}>
                        <h3 className={styles.rkpdesBidangTitle}>{bidang.namaBidang}</h3>
                        {bidang.rkpdes.length === 0 ? (
                          <p className={styles.emptyText}>Belum ada program yang direncanakan di bidang ini.</p>
                        ) : (
                          <div className={styles.rkpdesList}>
                            {bidang.rkpdes.map(prog => (
                              <div key={prog.id} className={styles.rkpdesItem}>
                                <h4>{prog.namaKegiatan}</h4>
                                <div className={styles.rkpdesMeta}>
                                  <span>📅 Tahun {prog.tahun}</span>
                                  {prog.lokasi && <span>📍 {prog.lokasi}</span>}
                                  {prog.perkiraanBiaya && <span>💰 {formatRupiah(prog.perkiraanBiaya)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APBDES TAB */}
            {activeTab === 'apbdes' && (
              <div>
                {loadingApbdes && <LoadingState message="Memuat data transparansi..." />}
                {errorApbdes && <EmptyState title="Data Belum Tersedia" message="Data transparansi APBDes belum dipublikasikan." icon="document" />}
                {!loadingApbdes && !errorApbdes && !apbdes && (
                  <EmptyState title="Data Belum Dipublikasikan" message="Laporan APBDes tahun ini sedang dalam proses." icon="document" />
                )}
                {!loadingApbdes && !errorApbdes && apbdes && (
                  <>
                    <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>APBDes Tahun {apbdes.tahun}</h3>
                    <div className={styles.summaryGrid}>
                      <SummaryCard label="Total Pendapatan" value={formatRupiah(apbdes.totalPendapatan)} type="pendapatan" delay={0} />
                      <SummaryCard label="Total Belanja" value={formatRupiah(apbdes.totalBelanja)} type="belanja" delay={100} />
                      <SummaryCard label="Pembiayaan Netto" value={formatRupiah(apbdes.totalPembiayaan)} type="pembiayaan" delay={200} />
                    </div>

                    <div className={styles.detailGrid}>
                      <div className={styles.detailColumn}>
                        <div className={styles.columnHeader}>
                          <span className={styles.columnTitle}>Pendapatan</span>
                        </div>
                        <div className={styles.itemContainer}>
                          {apbdes.items.filter(i => i.kategori === 'PENDAPATAN').map((item, index) => (
                            <ItemCard key={item.id} item={item} percentage={calculatePercentage(item.realisasi, item.anggaran)} type="pendapatan" delay={index * 100} />
                          ))}
                        </div>
                      </div>

                      <div className={styles.detailColumn}>
                        <div className={styles.columnHeader}>
                          <span className={styles.columnTitle}>Belanja</span>
                        </div>
                        <div className={styles.itemContainer}>
                          {apbdes.items.filter(i => i.kategori === 'BELANJA').map((item, index) => (
                            <ItemCard key={item.id} item={item} percentage={calculatePercentage(item.realisasi, item.anggaran)} type="belanja" delay={index * 100} />
                          ))}
                        </div>
                      </div>

                      <div className={styles.detailColumn}>
                        <div className={styles.columnHeader}>
                          <span className={styles.columnTitle}>Pembiayaan</span>
                        </div>
                        <div className={styles.itemContainer}>
                          {apbdes.items.filter(i => i.kategori === 'PEMBIAYAAN').map((item, index) => (
                            <ItemCard key={item.id} item={item} percentage={calculatePercentage(item.realisasi, item.anggaran)} type="pembiayaan" delay={index * 100} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
