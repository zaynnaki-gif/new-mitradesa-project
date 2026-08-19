import { useState, useEffect } from 'react';
import { Container, Typography, Button } from '../../components/ui';
import { LoadingState, ErrorState } from '../../components/states';

interface Province {
  id: number;
  kode: string;
  nama: string;
}

export function WilayahPage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  // Placeholder states for hierarchical wilayah data - to be implemented when API supports cascading
  const [_kabupatens, _setKabupatens] = useState<Province[]>([]);
  const [_kecamatans, _setKecamatans] = useState<Province[]>([]);
  const [_desas, _setDesas] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wilayah/provinsi');
      if (!res.ok) throw new Error('Failed to fetch provinces');
      const data = await res.json();
      setProvinces(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ padding: '2rem' }}>
          <LoadingState message="Memuat data wilayah..." fullPage />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ padding: '2rem' }}>
          <ErrorState
            title="Gagal Memuat Data"
            message={error}
            onRetry={fetchProvinces}
          />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ padding: '2rem' }}>
        <Typography variant="h2" style={{ marginBottom: '2rem' }}>Master Wilayah</Typography>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Province */}
          <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '0.5rem' }}>
            <Typography variant="h4" style={{ marginBottom: '1rem' }}>Provinsi</Typography>
            {provinces.length === 0 ? (
              <Typography variant="body2" color="secondary">
                Tidak ada data provinsi.
              </Typography>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {provinces.map((prov) => (
                  <div key={prov.id} style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg-surface)', borderRadius: '0.25rem' }}>
                    <Typography variant="body2">
                      <strong>{prov.kode}</strong> - {prov.nama}
                    </Typography>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              <Button variant="primary" disabled>
                Tambah Provinsi
              </Button>
            </div>
          </div>

          {/* Kabupaten */}
          <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '0.5rem' }}>
            <Typography variant="h4" style={{ marginBottom: '1rem' }}>Kabupaten</Typography>
            <Typography variant="body2" color="secondary">
              Pilih provinsi terlebih dahulu.
            </Typography>
          </div>

          {/* Kecamatan */}
          <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '0.5rem' }}>
            <Typography variant="h4" style={{ marginBottom: '1rem' }}>Kecamatan</Typography>
            <Typography variant="body2" color="secondary">
              Pilih kabupaten terlebih dahulu.
            </Typography>
          </div>

          {/* Desa */}
          <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '0.5rem' }}>
            <Typography variant="h4" style={{ marginBottom: '1rem' }}>Desa</Typography>
            <Typography variant="body2" color="secondary">
              Pilih kecamatan terlebih dahulu.
            </Typography>
          </div>
        </div>
      </div>
    </Container>
  );
}
