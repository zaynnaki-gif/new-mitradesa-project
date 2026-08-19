import { useState, useEffect } from 'react';
import { Container, Typography, Button, Modal } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import { UmkmForm } from '../../../components/forms/UmkmForm';

interface Umkm {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string;
  kategori: string;
  gambarUrl: string | null;
  harga: string | null;
  kontak: string;
  pemilik: string;
  isAktif: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UmkmPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Umkm[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Umkm> | null>(null);

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

      const res = await fetch(`/api/umkm?${params}`, { headers });
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

  const handleOpenEdit = (item: Umkm) => {
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
    if (!confirm('Yakin ingin menghapus produk UMKM ini?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/umkm/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page);
      } else {
        throw new Error(result.error?.message || 'Gagal menghapus');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Typography variant="h2">Kelola UMKM</Typography>
        <Button onClick={handleOpenCreate}>Tambah UMKM</Button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Cari nama..." 
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <Button onClick={handleSearch} variant="secondary">Cari</Button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={() => fetchData()} />}

      {!loading && !error && (
        <div style={{ overflowX: 'auto', marginTop: '1rem', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Nama</th>
                <th style={{ padding: '0.5rem' }}>Kategori</th>
                <th style={{ padding: '0.5rem' }}>Pemilik</th>
                <th style={{ padding: '0.5rem' }}>Harga</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{item.nama}</td>
                  <td style={{ padding: '0.5rem' }}>{item.kategori}</td>
                  <td style={{ padding: '0.5rem' }}>{item.pemilik}</td>
                  <td style={{ padding: '0.5rem' }}>{item.harga || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{item.isAktif ? 'Aktif' : 'Nonaktif'}</td>
                  <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                    <Button onClick={() => handleOpenEdit(item)} variant="outline" size="sm" style={{ marginRight: '0.5rem' }}>Edit</Button>
                    <Button onClick={() => handleDelete(item.id)} variant="outline" size="sm" style={{ color: 'red', borderColor: 'red' }}>Hapus</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit UMKM' : 'Tambah UMKM'}>
        <UmkmForm initialData={editingItem} onSuccess={handleFormSuccess} onCancel={handleCloseModal} />
      </Modal>
    </Container>
  );
}
