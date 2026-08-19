import { Link } from 'react-router-dom';
import { Container, Typography } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { usePotensiList } from '../../../hooks/usePotensi';

export function PotensiListPage() {
  const { data: potensi, loading, error, refetch } = usePotensiList();

  if (loading && !potensi.length) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <Container style={{ padding: 'var(--space-8) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <Typography variant="h2" style={{ marginBottom: 'var(--space-3)' }}>
          Potensi Desa
        </Typography>
        <Typography variant="body1" color="secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Jelajahi berbagai potensi unggulan yang ada di desa kami, mulai dari pertanian, pariwisata, hingga kerajinan lokal.
        </Typography>
      </div>

      {potensi.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
          <Typography variant="h4" color="secondary">Belum ada data potensi desa.</Typography>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 'var(--space-6)' 
        }}>
          {potensi.map((item) => (
            <Link 
              key={item.id} 
              to={`/potensi/${item.slug}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--gray-200)',
                backgroundColor: 'white',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ height: '200px', backgroundColor: 'var(--gray-100)', position: 'relative' }}>
                {item.gambarUrl ? (
                  <img 
                    src={item.gambarUrl} 
                    alt={item.nama} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                )}
                <div style={{ 
                  position: 'absolute', 
                  top: 'var(--space-3)', 
                  right: 'var(--space-3)',
                  backgroundColor: 'var(--primary-600)',
                  color: 'white',
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {item.kategori}
                </div>
              </div>
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Typography variant="h4" style={{ marginBottom: 'var(--space-2)' }}>{item.nama}</Typography>
                <Typography variant="body2" color="secondary" style={{ 
                  marginBottom: 'var(--space-4)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.deskripsi}
                </Typography>
                
                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', color: 'var(--primary-600)', fontWeight: 500, fontSize: '0.875rem' }}>
                  Baca selengkapnya
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'var(--space-1)' }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
