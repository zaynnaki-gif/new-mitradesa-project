import { useState, useEffect } from 'react';
import { Container, Typography, Button, Modal } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import { PotensiForm } from '../../../components/forms/PotensiForm';

interface Potensi {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string;
  kategori: string;
  gambarUrl: string | null;
  lokasi: string | null;
  kontak: string | null;
  isAktif: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function PotensiPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Potensi[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Potensi> | null>(null);

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

      const res = await fetch(`/api/cms/potensi?${params}`, { headers });
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

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Potensi) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    fetchData(meta.page);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus potensi desa ini?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/cms/potensi/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      
      if (result.success) {
        fetchData(meta.page);
      } else {
        throw new Error(result.error?.message || 'Failed to delete');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading && !data.length) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => fetchData()} />;

  return (
    <Container style={{ padding: 'var(--space-6) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <Typography variant="h3">Manajemen Potensi Desa</Typography>
          <Typography variant="body1" color="secondary">Kelola data potensi desa.</Typography>
        </div>
        <Button onClick={handleOpenCreate}>Tambah Potensi</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <input 
          type="text" 
          placeholder="Cari potensi..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', flex: 1 }}
        />
        <Button variant="outline" onClick={handleSearch}>Cari</Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
              <th style={{ padding: 'var(--space-3)' }}>Nama</th>
              <th style={{ padding: 'var(--space-3)' }}>Kategori</th>
              <th style={{ padding: 'var(--space-3)' }}>Lokasi</th>
              <th style={{ padding: 'var(--space-3)' }}>Status</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--gray-500)' }}>
                  Tidak ada data potensi desa.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <Typography variant="body2" style={{ fontWeight: 500 }}>{item.nama}</Typography>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>{item.kategori}</td>
                  <td style={{ padding: 'var(--space-3)' }}>{item.lokasi || '-'}</td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <span style={{ 
                      padding: 'var(--space-1) var(--space-2)', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.75rem',
                      backgroundColor: item.isAktif ? 'var(--success-50)' : 'var(--gray-100)',
                      color: item.isAktif ? 'var(--success-700)' : 'var(--gray-700)',
                    }}>
                      {item.isAktif ? 'Aktif' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} style={{ color: 'var(--error-600)', borderColor: 'var(--error-200)' }}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Potensi Desa' : 'Tambah Potensi Desa'}
      >
        <PotensiForm 
          initialData={editingItem}
          onSuccess={handleFormSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </Container>
  );
}
