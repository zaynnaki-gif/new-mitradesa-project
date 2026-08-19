import { PublicLayout } from '@/layouts';
import { Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useStatistikDesa } from '@/hooks/useStatistikDesa';
import { useSEO, getPageTitle } from '@/hooks/useSeo';

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
      <section
        style={{
          backgroundColor: 'var(--color-navy-base)',
          color: 'var(--color-text-on-navy)',
          padding: 'var(--space-12) var(--space-4)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Typography
            variant="h1"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              marginBottom: 'var(--space-4)',
              color: 'var(--color-text-on-navy)',
            }}
          >
            Kependudukan
          </Typography>
          <Typography
            variant="body1"
            style={{ color: 'rgba(255, 255, 255, 0.8)', maxWidth: '600px', margin: '0 auto' }}
          >
            Statistik kependudukan {identitas?.namaDesa || 'kami'}
          </Typography>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
            <div style={{ marginTop: 'var(--space-8)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-base)', textAlign: 'center' }}>
                   <Typography variant="h2" style={{ color: 'var(--color-primary-base)', fontSize: '2.5rem', fontWeight: 700 }}>{statistik.penduduk.total.toLocaleString()}</Typography>
                   <Typography variant="body2" color="secondary">Total Penduduk (Jiwa)</Typography>
                </div>
                <div style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-base)', textAlign: 'center' }}>
                   <Typography variant="h2" style={{ color: '#22c55e', fontSize: '2.5rem', fontWeight: 700 }}>{statistik.penduduk.lakiLaki.toLocaleString()}</Typography>
                   <Typography variant="body2" color="secondary">Laki-Laki (Jiwa)</Typography>
                </div>
                <div style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-base)', textAlign: 'center' }}>
                   <Typography variant="h2" style={{ color: '#3b82f6', fontSize: '2.5rem', fontWeight: 700 }}>{statistik.penduduk.perempuan.toLocaleString()}</Typography>
                   <Typography variant="body2" color="secondary">Perempuan (Jiwa)</Typography>
                </div>
                <div style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-base)', textAlign: 'center' }}>
                   <Typography variant="h2" style={{ color: 'var(--color-primary-base)', fontSize: '2.5rem', fontWeight: 700 }}>{statistik.keluarga.toLocaleString()}</Typography>
                   <Typography variant="body2" color="secondary">Total Keluarga (KK)</Typography>
                </div>
                <div style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-base)', textAlign: 'center' }}>
                   <Typography variant="h2" style={{ color: 'var(--color-primary-base)', fontSize: '2.5rem', fontWeight: 700 }}>{statistik.wilayah.dusun.toLocaleString()}</Typography>
                   <Typography variant="body2" color="secondary">Jumlah Dusun</Typography>
                </div>
                <div style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-base)', textAlign: 'center' }}>
                   <Typography variant="h2" style={{ color: 'var(--color-primary-base)', fontSize: '2.5rem', fontWeight: 700 }}>{statistik.wilayah.rt.toLocaleString()}</Typography>
                   <Typography variant="body2" color="secondary">Jumlah RT</Typography>
                </div>
                <div style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-base)', textAlign: 'center' }}>
                   <Typography variant="h2" style={{ color: 'var(--color-primary-base)', fontSize: '2.5rem', fontWeight: 700 }}>{statistik.wilayah.rw.toLocaleString()}</Typography>
                   <Typography variant="body2" color="secondary">Jumlah RW</Typography>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
