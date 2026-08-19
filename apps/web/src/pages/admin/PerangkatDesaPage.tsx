import { useState, useEffect } from 'react';
import { Container, Typography, Button, Badge } from '../../components/ui';
import { LoadingState, ErrorState } from '../../components/states';
import { useAuthStore } from '../../stores/auth.store';
import styles from '../../styles/AdminShared.module.css';

interface PerangkatDesa {
  id: string;
  pendudukId: string;
  pendudukNik: string;
  pendudukNama: string;
  desaId: string;
  desaNama: string;
  jabatan: string;
  status: string;
  fotoUrl: string | null;
  accountId: string | null;
  accountUsername: string | null;
  isAktif: boolean;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function PerangkatDesaPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<PerangkatDesa[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async (page = 1, searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
      });

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/perangkat-desa?${params}`, { headers });
      const result = await res.json();

      if (result.success) {
        setData(result.data || []);
        if (result.meta) setMeta(result.meta);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => fetchData(1, search);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/perangkat-desa/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page);
      } else {
        alert(result.error?.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus perangkat desa');
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ padding: '2rem' }}>
          <LoadingState message="Memuat data perangkat desa..." fullPage />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ padding: '2rem' }}>
          <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => fetchData()} />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ padding: '1.5rem' }}>
        <div className={styles.pageHeader}>
          <Typography variant="h2">Perangkat Desa</Typography>
        </div>

        {/* Search */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Cari NIK atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <Button variant="secondary" onClick={handleSearch}>Cari</Button>
        </div>

        {/* Info */}
        <Typography variant="body2" color="secondary" style={{ marginBottom: '1rem' }}>
          Total: {meta.total} perangkat desa
        </Typography>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {['NIK', 'Nama', 'Jabatan', 'Desa', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : data.map((item) => (
                <tr key={item.id} className={styles.tr}>
                  <td className={styles.td}>{item.pendudukNik}</td>
                  <td className={styles.td}>{item.pendudukNama}</td>
                  <td className={styles.td}>
                    <Badge color="primary">{item.jabatan}</Badge>
                  </td>
                  <td className={styles.td}>{item.desaNama}</td>
                  <td className={styles.td}>
                    <Badge color={item.isAktif ? 'success' : 'error'}>{item.status}</Badge>
                  </td>
                  <td className={styles.td}>
                    <Button variant="secondary" size="sm" onClick={() => handleDelete(item.id)}>
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Halaman {meta.page} dari {meta.totalPages}
            </span>
            <div className={styles.paginationControls}>
              <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => fetchData(meta.page - 1, search)}>
                Sebelumnya
              </Button>
              <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchData(meta.page + 1, search)}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
