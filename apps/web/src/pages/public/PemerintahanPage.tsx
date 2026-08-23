import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { usePerangkatDesa } from '@/hooks/usePerangkatDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './PemerintahanPage.module.css';

function LeaderCard({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  return (
    <div 
      ref={ref} 
      className={`${styles.leaderCard} hover-zoom-container animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function PerangkatCard({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  return (
    <div 
      ref={ref} 
      className={`${styles.perangkatCard} hover-zoom-container animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}


export default function PemerintahanPage() {
  const { data: identitas, isLoading, error, refetch } = useIdentitasDesa();
  const { data: perangkatDesa, loading: perangkatLoading, error: perangkatError, refetch: perangkatRefetch } = usePerangkatDesa();

  const villageName = identitas?.namaDesa || 'Desa';

  // SEO
  useSEO({
    title: getPageTitle(`Pemerintahan ${villageName}`),
    description: `Struktur pemerintahan ${villageName} - Kepala desa, sekretaris, dan perangkat desa.`,
  });

  const formatJabatan = (jabatan: string) => {
    // Convert to readable format
    const map: Record<string, string> = {
      'KEPALA_DESA': 'Kepala Desa',
      'SEKRETARIS_DESA': 'Sekretaris Desa',
      'KAUR_UMUM': 'Kaur Umum',
      'KAUR_KEUANGAN': 'Kaur Keuangan',
      'KAUR_PERENCANAAN': 'Kaur Perencanaan',
      'KASI_KESEHATAN': 'Kasi Kesehatan',
      'KASI_PEMBANGUNAN': 'Kasi Pembangunan',
      'KASI_PEMERINTAHAN': 'Kasi Pemerintahan',
      'KASI_KESRA': 'Kasi Kesra',
      'KASI_HUKUM': 'Kasi Hukum',
      'KASI_UMUM': 'Kasi Umum',
      'KADUS': 'Kepala Dusun',
      'RT': 'RT',
      'RW': 'RW',
    };
    return map[jabatan] || jabatan.replace(/_/g, ' ');
  };

  const getJabatanPriority = (jabatan: string) => {
    const priorities: Record<string, number> = {
      'KEPALA_DESA': 1,
      'SEKRETARIS_DESA': 2,
      'KAUR_UMUM': 3,
      'KAUR_KEUANGAN': 4,
      'KAUR_PERENCANAAN': 5,
      'KASI_KESEHATAN': 6,
      'KASI_PEMBANGUNAN': 7,
      'KASI_PEMERINTAHAN': 8,
      'KASI_KESRA': 9,
      'KASI_HUKUM': 10,
      'KASI_UMUM': 11,
      'KADUS': 12,
    };
    return priorities[jabatan] || 99;
  };

  const sortedPerangkat = [...perangkatDesa].sort(
    (a, b) => getJabatanPriority(a.jabatan) - getJabatanPriority(b.jabatan)
  );

  return (
    <PublicLayout>
      <EditorialHero 
        title="Pemerintahan Desa" 
        subtitle={`Struktur pemerintahan dan perangkat desa ${villageName}`} 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {/* Loading/Error State for Identitas */}
          {isLoading && (
            <LoadingState message="Memuat data..." fullPage />
          )}

          {error && (
            <ErrorState
              title="Gagal Memuat Data"
              message={typeof error === 'string' ? error : 'Tidak dapat memuat informasi pemerintahan.'}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !error && (
            <div className={styles.grid}>
              {/* Kepala Desa */}
              <LeaderCard delay={0}>
                <div className={styles.leaderImageWrapper}>
                  {identitas?.kepalaDesa ? (
                    <div className={styles.leaderAvatar}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  ) : (
                    <div className={styles.leaderAvatarPlaceholder}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.leaderInfo}>
                  <span className={styles.leaderBadge}>KEPALA DESA</span>
                  <Typography variant="h2" className={styles.leaderName}>
                    {identitas?.kepalaDesa || 'Vacant'}
                  </Typography>
                  <Typography variant="body2" color="secondary" className={styles.leaderVillage}>
                    {villageName}
                  </Typography>
                </div>
              </LeaderCard>

              {/* Sekretaris Desa */}
              <LeaderCard delay={100}>
                <div className={styles.leaderImageWrapper}>
                  {identitas?.sekretarisDesa ? (
                    <div className={styles.leaderAvatar}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  ) : (
                    <div className={styles.leaderAvatarPlaceholder}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.leaderInfo}>
                  <span className={styles.leaderBadge}>SEKRETARIS DESA</span>
                  <Typography variant="h2" className={styles.leaderName}>
                    {identitas?.sekretarisDesa || 'Vacant'}
                  </Typography>
                  <Typography variant="body2" color="secondary" className={styles.leaderVillage}>
                    {villageName}
                  </Typography>
                </div>
              </LeaderCard>

              {/* Perangkat Desa Section */}
              <div className={styles.section}>
                <Typography variant="h3" className={styles.sectionTitle}>
                  Perangkat Desa
                </Typography>

                {perangkatLoading && (
                  <div className={styles.loadingState}>
                    <Typography color="secondary">Memuat...</Typography>
                  </div>
                )}

                {perangkatError && (
                  <ErrorState
                    title="Gagal Memuat Perangkat Desa"
                    message={perangkatError}
                    onRetry={() => perangkatRefetch()}
                  />
                )}

                {!perangkatLoading && !perangkatError && sortedPerangkat.length === 0 && (
                  <EmptyState
                    title="Belum Ada Data"
                    message="Data perangkat desa belum tersedia."
                    icon="folder"
                  />
                )}

                {!perangkatLoading && !perangkatError && sortedPerangkat.length > 0 && (
                  <div className={styles.perangkatGrid}>
                    {sortedPerangkat
                      .filter((p) => p.jabatan !== 'KEPALA_DESA' && p.jabatan !== 'SEKRETARIS_DESA')
                      .map((perangkat, index) => (
                        <PerangkatCard key={perangkat.id} delay={index * 50}>
                          <div className={styles.perangkatAvatar}>
                            {perangkat.fotoUrl ? (
                              <img
                                src={perangkat.fotoUrl}
                                alt={perangkat.nama}
                                className={styles.perangkatPhoto}
                              />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            )}
                          </div>
                          <Typography variant="h4" className={styles.perangkatName}>
                            {perangkat.nama}
                          </Typography>
                          <Typography variant="body2" className={styles.perangkatJabatan}>
                            {formatJabatan(perangkat.jabatan)}
                          </Typography>
                          {perangkat.status !== 'AKTIF' && (
                            <span className={styles.statusBadge}>
                              {perangkat.status}
                            </span>
                          )}
                        </PerangkatCard>
                      ))}
                  </div>
                )}
              </div>

              {/* Struktur Organisasi */}
              <div className={styles.section}>
                <Typography variant="h3" className={styles.sectionTitle}>
                  Struktur Organisasi
                </Typography>
                <div className={styles.strukturOrganisasi}>
                  <EmptyState
                    title="Struktur Organisasi"
                    message="Bagan struktur organisasi pemerintahan desa akan segera diperbarui."
                    icon="document"
                  />
                </div>
              </div>

              {/* Struktur Info */}
              <div className={styles.strukturInfo}>
                <Typography variant="h3" className={styles.sectionTitle}>
                  Informasi Pemerintahan
                </Typography>
                <div className={styles.infoCard}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Desa</span>
                    <span className={styles.infoValue}>{villageName}</span>
                  </div>
                  {identitas?.desa?.kecamatan && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Kecamatan</span>
                      <span className={styles.infoValue}>{identitas.desa.kecamatan.nama}</span>
                    </div>
                  )}
                  {identitas?.desa?.kecamatan?.kabupaten && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Kabupaten</span>
                      <span className={styles.infoValue}>{identitas.desa.kecamatan.kabupaten.nama}</span>
                    </div>
                  )}
                  {identitas?.desa?.kecamatan?.kabupaten?.provinsi && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Provinsi</span>
                      <span className={styles.infoValue}>{identitas.desa.kecamatan.kabupaten.provinsi.nama}</span>
                    </div>
                  )}
                  {identitas?.kodeDesa && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Kode Desa</span>
                      <span className={styles.infoValue}>{identitas.kodeDesa}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
