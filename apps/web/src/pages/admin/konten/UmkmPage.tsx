import { useState, useEffect } from 'react';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { UmkmForm } from '@/components/forms/UmkmForm';
import { AdminLayout } from '@/layouts';
import { API_URL } from '@/lib/constants';
import styles from './UmkmPage.module.css';

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

      const res = await fetch(`${API_URL}/umkm?${params}`, { headers });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const res = await fetch(`${API_URL}/umkm/${id}`, { method: 'DELETE', headers });
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
      <div className={styles.container}>
        <div className={styles.header}>
          <Typography variant="h2">Kelola UMKM</Typography>
          <Button onClick={handleOpenCreate}>Tambah UMKM</Button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Cari nama..."
            className={styles.searchInput}
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
                  <th className={styles.th}>Nama</th>
                  <th className={styles.th}>Kategori</th>
                  <th className={styles.th}>Pemilik</th>
                  <th className={styles.th}>Harga</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      Belum ada data UMKM
                    </td>
                  </tr>
                ) : data.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>{item.nama}</td>
                    <td className={styles.td}>{item.kategori}</td>
                    <td className={styles.td}>{item.pemilik}</td>
                    <td className={styles.td}>{item.harga || '-'}</td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${item.isAktif ? styles.badgeAktif : styles.badgeNonaktif}`}>
                        {item.isAktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionsRow}>
                        <Button onClick={() => handleOpenEdit(item)} variant="outline" size="sm">Edit</Button>
                        <Button onClick={() => handleDelete(item.id)} variant="outline" size="sm" className={styles.btnHapus}>Hapus</Button>
                      </div>
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
      </div>
    </AdminLayout>
  );
}

