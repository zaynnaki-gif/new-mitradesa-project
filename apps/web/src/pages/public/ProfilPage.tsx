import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useStatistikDesa } from '@/hooks/useStatistikDesa';
import { useHalaman } from '@/hooks/useHalaman';
import { useSEO, getPageTitle } from '@/hooks/useSeo';
import { EditorialHero, EditorialSection } from '@/components/editorial';
import styles from './ProfilPage.module.css';

export default function ProfilPage() {
  const { data: identitas, isLoading: isLoadingIdentitas, error: errorIdentitas, refetch } = useIdentitasDesa();
  const { data: statistik, loading: isLoadingStatistik } = useStatistikDesa();
  const { data: sejarah } = useHalaman('sejarah-desa');
  const { data: visiMisi } = useHalaman('visi-misi');

  const isLoading = isLoadingIdentitas || isLoadingStatistik;
  const error = errorIdentitas;

  const villageName = identitas?.namaDesa || 'Desa';

  // SEO
  useSEO({
    title: getPageTitle(`Profil ${villageName}`),
    description: `Profil lengkap ${villageName} - Gambaran umum, wilayah, visi misi, dan potensi desa.`,
  });

  return (
    <PublicLayout>
      <EditorialHero 
        title="Profil Desa" 
        subtitle={`Kenali lebih dekat tentang ${villageName}`} 
      />

      <EditorialSection alternate>
        <div className={styles.container}>
          {isLoading && (
            <LoadingState message="Memuat profil..." fullPage />
          )}

          {error && (
            <ErrorState
              title="Gagal Memuat Profil"
              message="Tidak dapat memuat profil desa. Silakan coba lagi."
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !error && (
            <div className={styles.grid}>
              {/* Identitas Desa */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <Typography variant="h3" className={styles.cardTitle}>
                    Identitas Desa
                  </Typography>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Nama Desa</span>
                      <span className={styles.infoValue}>{identitas?.namaDesa || '-'}</span>
                    </div>
                    {identitas?.singkatanDesa && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Singkatan</span>
                        <span className={styles.infoValue}>{identitas.singkatanDesa}</span>
                      </div>
                    )}
                    {identitas?.kodeDesa && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Kode Desa</span>
                        <span className={styles.infoValue}>{identitas.kodeDesa}</span>
                      </div>
                    )}
                    {identitas?.kepalaDesa && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Kepala Desa</span>
                        <span className={styles.infoValue}>{identitas.kepalaDesa}</span>
                      </div>
                    )}
                    {identitas?.sekretarisDesa && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Sekretaris Desa</span>
                        <span className={styles.infoValue}>{identitas.sekretarisDesa}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Wilayah */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <Typography variant="h3" className={styles.cardTitle}>
                    Wilayah
                  </Typography>
                </div>
                <div className={styles.cardBody}>
                  {identitas?.desa?.kecamatan ? (
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Provinsi</span>
                        <span className={styles.infoValue}>
                          {identitas.desa.kecamatan.kabupaten?.provinsi?.nama || '-'}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Kabupaten/Kota</span>
                        <span className={styles.infoValue}>
                          {identitas.desa.kecamatan.kabupaten?.nama || '-'}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Kecamatan</span>
                        <span className={styles.infoValue}>
                          {identitas.desa.kecamatan.nama}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Desa</span>
                        <span className={styles.infoValue}>
                          {identitas.desa.nama}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Typography variant="body2" color="secondary">
                      Informasi wilayah belum tersedia.
                    </Typography>
                  )}
                </div>
              </div>


              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <Typography variant="h3" className={styles.cardTitle}>
                    Kontak & Alamat
                  </Typography>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoGrid}>
                    {identitas?.alamat && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Alamat</span>
                        <span className={styles.infoValue}>{identitas.alamat}</span>
                      </div>
                    )}
                    {identitas?.kodepos && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Kode Pos</span>
                        <span className={styles.infoValue}>{identitas.kodepos}</span>
                      </div>
                    )}
                    {identitas?.telepon && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Telepon</span>
                        <span className={styles.infoValue}>{identitas.telepon}</span>
                      </div>
                    )}
                    {identitas?.whatsapp && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>WhatsApp</span>
                        <span className={styles.infoValue}>{identitas.whatsapp}</span>
                      </div>
                    )}
                    {identitas?.email && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email</span>
                        <span className={styles.infoValue}>{identitas.email}</span>
                      </div>
                    )}
                    {identitas?.website && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Website</span>
                        <span className={styles.infoValue}>{identitas.website}</span>
                      </div>
                    )}
                    {!identitas?.alamat && !identitas?.telepon && !identitas?.whatsapp && !identitas?.email && (
                      <Typography variant="body2" color="secondary">
                        Informasi kontak belum tersedia.
                      </Typography>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-8)' }}>
                {/* Desa Dalam Angka */}
                {(statistik && statistik.penduduk.total > 0) && (
                  <div className={styles.card} style={{ marginBottom: 'var(--space-8)' }}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                      </div>
                      <Typography variant="h3" className={styles.cardTitle}>
                        Desa Dalam Angka
                      </Typography>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Total Penduduk</span>
                          <span className={styles.infoValue}>{statistik.penduduk.total.toLocaleString()} Jiwa</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Laki-Laki</span>
                          <span className={styles.infoValue}>{statistik.penduduk.lakiLaki.toLocaleString()} Jiwa</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Perempuan</span>
                          <span className={styles.infoValue}>{statistik.penduduk.perempuan.toLocaleString()} Jiwa</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Keluarga (KK)</span>
                          <span className={styles.infoValue}>{statistik.keluarga.toLocaleString()} KK</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Dusun</span>
                          <span className={styles.infoValue}>{statistik.wilayah.dusun.toLocaleString()}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>RT / RW</span>
                          <span className={styles.infoValue}>{statistik.wilayah.rt.toLocaleString()} / {statistik.wilayah.rw.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visi Misi */}
                {visiMisi && (
                  <div className={styles.card} style={{ marginBottom: 'var(--space-8)' }}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20V10" />
                          <path d="M18 20V4" />
                          <path d="M6 20v-4" />
                        </svg>
                      </div>
                      <Typography variant="h3" className={styles.cardTitle}>
                        {visiMisi.judul}
                      </Typography>
                    </div>
                    <div className={styles.cardBody}>
                      <div dangerouslySetInnerHTML={{ __html: visiMisi.konten }} />
                    </div>
                  </div>
                )}

                {/* Sejarah Desa */}
                {sejarah && (
                  <div className={styles.card} style={{ marginBottom: 'var(--space-8)' }}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <Typography variant="h3" className={styles.cardTitle}>
                        {sejarah.judul}
                      </Typography>
                    </div>
                    <div className={styles.cardBody}>
                      <div dangerouslySetInnerHTML={{ __html: sejarah.konten }} />
                    </div>
                  </div>
                )}
                
                {((!statistik || statistik.penduduk.total === 0) && !visiMisi && !sejarah) && (
                  <EmptyState 
                    icon="document"
                    title="Pemutakhiran Data Profil"
                    message="Informasi mengenai Demografi, Visi & Misi, serta Potensi Desa sedang dalam proses pemutakhiran oleh admin desa."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </EditorialSection>
    </PublicLayout>
  );
}
