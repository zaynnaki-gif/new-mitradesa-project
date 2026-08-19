import { useState, useEffect } from 'react';
import { Container, Typography, Button, Modal } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import { TransparansiForm } from '../../../components/forms/TransparansiForm';

interface Apbdes {
  id: string;
  tahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  totalPembiayaan: number;
  isAktif: boolean;
  dokumenUrl: string | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function TransparansiPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Apbdes[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahunSearch, setTahunSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Apbdes> | null>(null);

  const fetchData = async (page = 1, searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { tahun: searchQuery }),
      });

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/transparansi?${params}`, { headers });
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

  const handleSearch = () => fetchData(1, tahunSearch);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Apbdes) => {
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
    if (!confirm('Yakin ingin menghapus data APBDes ini?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/transparansi/${id}`, { method: 'DELETE', headers });
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

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Typography variant="h2">Kelola Transparansi APBDes</Typography>
        <Button onClick={handleOpenCreate}>Tambah APBDes</Button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="number" 
          value={tahunSearch} 
          onChange={(e) => setTahunSearch(e.target.value)} 
          placeholder="Cari tahun..." 
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <Button onClick={handleSearch} variant="secondary">Cari</Button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={() => fetchData()} />}

      {!loading && !error && (
        <div style={{ overflowX: 'auto', marginTop: '1rem', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Tahun</th>
                <th style={{ padding: '0.5rem' }}>Pendapatan</th>
                <th style={{ padding: '0.5rem' }}>Belanja</th>
                <th style={{ padding: '0.5rem' }}>Pembiayaan</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{item.tahun}</td>
                  <td style={{ padding: '0.5rem' }}>{formatRupiah(item.totalPendapatan)}</td>
                  <td style={{ padding: '0.5rem' }}>{formatRupiah(item.totalBelanja)}</td>
                  <td style={{ padding: '0.5rem' }}>{formatRupiah(item.totalPembiayaan)}</td>
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit APBDes' : 'Tambah APBDes'}>
        <TransparansiForm initialData={editingItem} onSuccess={handleFormSuccess} onCancel={handleCloseModal} />
      </Modal>
    </Container>
  );
}
