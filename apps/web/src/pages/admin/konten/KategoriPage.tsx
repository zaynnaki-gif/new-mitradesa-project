import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { KategoriForm } from '@/components/forms/KategoriForm';
import { API_URL } from '@/lib/constants';
import styles from './KategoriPage.module.css';

interface Kategori {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string | null;
  ikon: string | null;
  warna: string | null;
  urutan: number;
  isAktif: boolean;
  jumlahBerita: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function KategoriPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Kategori[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Kategori> | null>(null);

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

      const res = await fetch(`${API_URL}/api/kategori?${params}`, { headers });
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

  const handleOpenEdit = (item: Kategori) => {
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
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/kategori/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page);
      } else {
        alert(result.error?.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus kategori');
    }
  };

  if (error && data.length === 0) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <ErrorState message={error} onRetry={() => fetchData()} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Typography variant="h4">Kategori Berita</Typography>
            <Typography variant="body2" color="secondary">
              Kelola kategori untuk berita dan informasi
            </Typography>
          </div>
          <Button variant="primary" onClick={handleOpenCreate}>
            + Tambah Kategori
          </Button>
        </div>

        {/* Search */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <Button variant="secondary" onClick={handleSearch}>
            Cari
          </Button>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nama</th>
                <th className={styles.th}>Slug</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Berita</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                <th className={`${styles.th} ${styles.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    <LoadingState message="Memuat data kategori..." />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    Belum ada kategori
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.itemName}>
                        {item.warna && (
                          <span className={styles.colorDot} style={{ backgroundColor: item.warna }} />
                        )}
                        <span>{item.nama}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.slugText}>{item.slug}</span>
                    </td>
                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      <span className={`${styles.badge} ${item.jumlahBerita > 0 ? styles.badgeCount : ''}`}>
                        {item.jumlahBerita}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      <span className={`${styles.badge} ${item.isAktif ? styles.badgeAktif : styles.badgeNonaktif}`}>
                        {item.isAktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <div className={styles.actionsRow}>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className={styles.btnHapus}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </span>
            <div className={styles.paginationControls}>
              <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => fetchData(meta.page - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchData(meta.page + 1)}>Next</Button>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingItem ? 'Edit Kategori' : 'Tambah Kategori'}
        >
          <KategoriForm
            mode={editingItem ? 'edit' : 'create'}
            initialData={editingItem ? {
              id: editingItem.id,
              nama: editingItem.nama || '',
              slug: editingItem.slug || '',
              deskripsi: editingItem.deskripsi || '',
              ikon: editingItem.ikon || '',
              warna: editingItem.warna || '#3B82F6',
              urutan: editingItem.urutan || 0,
              isAktif: editingItem.isAktif ?? true,
            } : undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>
      </div>
    </AdminLayout>
  );
}

