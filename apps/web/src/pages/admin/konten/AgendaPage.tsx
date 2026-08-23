import { useState, useEffect } from 'react';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { AgendaForm } from '@/components/forms/AgendaForm';
import { AdminLayout } from '@/layouts';
import { API_URL } from '@/lib/constants';
import styles from '@/styles/AdminShared.module.css';

interface Agenda {
  id: string;
  judul: string;
  slug: string;
  deskripsi: string;
  lokasi: string;
  penyelenggara: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
  isAktif: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AgendaPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Agenda[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Agenda> | null>(null);

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

      const res = await fetch(`${API_URL}/api/agenda?${params}`, { headers });
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

  const handleOpenEdit = (item: Agenda) => {
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
    if (!confirm('Yakin ingin menghapus agenda ini?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/agenda/${id}`, { method: 'DELETE', headers });
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
    <AdminLayout>
      <div style={{ padding: '1.5rem' }}>
        <div className={styles.pageHeader}>
          <Typography variant="h2">Kelola Agenda</Typography>
          <Button onClick={handleOpenCreate}>Tambah Agenda</Button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul..."
            className={styles.searchInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="secondary">Cari</Button>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={() => fetchData()} />}

        {!loading && !error && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Judul</th>
                  <th className={styles.th}>Lokasi</th>
                  <th className={styles.th}>Tanggal</th>
                  <th className={styles.th}>Status</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={5} className={styles.emptyState}>Belum ada agenda.</td></tr>
                ) : data.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>{item.judul}</td>
                    <td className={styles.td}>{item.lokasi}</td>
                    <td className={styles.td}>
                      {new Date(item.tanggalMulai).toLocaleDateString('id-ID')}
                    </td>
                    <td className={styles.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: item.status === 'AKTIF' ? '#d1fae5' : 'var(--color-bg-muted)',
                        color: item.status === 'AKTIF' ? '#065f46' : 'var(--color-text-secondary)',
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button onClick={() => handleOpenEdit(item)} variant="outline" size="sm">Edit</Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          variant="outline"
                          size="sm"
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Agenda' : 'Tambah Agenda'}>
          <AgendaForm initialData={editingItem} onSuccess={handleFormSuccess} onCancel={handleCloseModal} />
        </Modal>
      </div>
    </AdminLayout>
  );
}
