import { useState, useEffect } from 'react';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { PotensiForm } from '@/components/forms/PotensiForm';
import { AdminLayout } from '@/layouts';
import { API_URL } from '@/lib/constants';
import styles from './PotensiPage.module.css';

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

      const res = await fetch(`${API_URL}/cms/potensi?${params}`, { headers });
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

      const res = await fetch(`${API_URL}/cms/potensi/${id}`, { method: 'DELETE', headers });
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

  if (loading && !data.length) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error) return <AdminLayout><ErrorState message={error} onRetry={() => fetchData()} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Typography variant="h3">Manajemen Potensi Desa</Typography>
            <Typography variant="body1" color="secondary">Kelola data potensi desa.</Typography>
          </div>
          <Button onClick={handleOpenCreate}>Tambah Potensi</Button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Cari potensi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <Button variant="outline" onClick={handleSearch}>Cari</Button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nama</th>
                <th className={styles.th}>Kategori</th>
                <th className={styles.th}>Lokasi</th>
                <th className={styles.th}>Status</th>
                <th className={`${styles.th} ${styles.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    Tidak ada data potensi desa.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>
                      <Typography variant="body2" style={{ fontWeight: 500 }}>{item.nama}</Typography>
                    </td>
                    <td className={styles.td}>{item.kategori}</td>
                    <td className={styles.td}>{item.lokasi || '-'}</td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${item.isAktif ? styles.badgeAktif : styles.badgeDraft}`}>
                        {item.isAktif ? 'Aktif' : 'Draft'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionsRow}>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className={styles.btnHapus}>Hapus</Button>
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
      </div>
    </AdminLayout>
  );
}
