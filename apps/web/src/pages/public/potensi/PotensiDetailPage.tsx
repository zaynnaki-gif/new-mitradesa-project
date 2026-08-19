import { useParams, Link } from 'react-router-dom';
import { Container, Typography } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { usePotensi } from '../../../hooks/usePotensi';

export function PotensiDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: potensi, loading, error, refetch } = usePotensi(slug || '');

  if (loading && !potensi) return <LoadingState />;
  if (error || !potensi) return <ErrorState message={error?.message || 'Potensi tidak ditemukan'} onRetry={refetch} />;

  return (
    <Container style={{ padding: 'var(--space-8) 0' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/potensi" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--gray-600)', textDecoration: 'none', fontWeight: 500 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--space-2)' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Kembali ke Daftar Potensi
        </Link>
      </div>

      <article>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <span style={{ 
            display: 'inline-block',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-700)',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: 'var(--space-3)'
          }}>
            {potensi.kategori}
          </span>
          <Typography variant="h1" style={{ marginBottom: 'var(--space-4)' }}>{potensi.nama}</Typography>
        </div>

        {potensi.gambarUrl && (
          <div style={{ 
            width: '100%', 
            height: '400px', 
            borderRadius: 'var(--radius-xl)', 
            overflow: 'hidden',
            marginBottom: 'var(--space-8)'
          }}>
            <img 
              src={potensi.gambarUrl} 
              alt={potensi.nama} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-8)' }}>
          <div>
            <Typography variant="h3" style={{ marginBottom: 'var(--space-4)' }}>Deskripsi</Typography>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--gray-700)', lineHeight: 1.6 }}>
              {potensi.deskripsi}
            </div>
          </div>

          <div>
            <div style={{ backgroundColor: 'var(--gray-50)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
              <Typography variant="h4" style={{ marginBottom: 'var(--space-4)' }}>Informasi</Typography>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {potensi.lokasi && (
                  <div>
                    <Typography variant="body2" color="secondary" style={{ fontWeight: 500, marginBottom: 'var(--space-1)' }}>Lokasi</Typography>
                    <Typography variant="body1">{potensi.lokasi}</Typography>
                  </div>
                )}
                
                {potensi.kontak && (
                  <div>
                    <Typography variant="body2" color="secondary" style={{ fontWeight: 500, marginBottom: 'var(--space-1)' }}>Kontak</Typography>
                    <Typography variant="body1">{potensi.kontak}</Typography>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Container>
  );
}
