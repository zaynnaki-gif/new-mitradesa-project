import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { HalamanForm } from '@/components/forms/HalamanForm';
import { API_URL } from '@/lib/constants';
import styles from './HalamanPage.module.css';

interface Halaman {
  id: string;
  judul: string;
  slug: string;
  excerpt: string | null;
  konten: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isMenu: boolean;
  urutan: number;
  createdBy: { id: string; username: string } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function HalamanPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Halaman[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Halaman> | null>(null);

  const fetchData = async (page = 1, searchQuery = '', status = '') => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(searchQuery && { search: searchQuery }),
      ...(status && { status }),
    });
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/halaman?${params}`, { headers });
    const result = await res.json();
    if (result.success) {
      setData(result.data || []);
      if (result.meta) setMeta(result.meta);
    } else {
      throw new Error(result.error?.message || 'Failed to fetch');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(1, search, statusFilter); }, []);

  const handleSearch = () => fetchData(1, search, statusFilter);
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchData(1, search, newStatus);
  };

  const handlePublish = async (id: string) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/halaman/${id}/publish`, { method: 'POST', headers });
    const result = await res.json();
    if (result.success) fetchData(meta.page, search, statusFilter);
    else alert(result.error?.message || 'Gagal mempublikasikan');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/halaman/${id}`, { method: 'DELETE', headers });
    const result = await res.json();
    if (result.success) fetchData(meta.page, search, statusFilter);
    else alert(result.error?.message || 'Gagal menghapus');
  };

  const handleOpenCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleOpenEdit = (item: Halaman) => { setEditingItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const handleFormSuccess = () => { handleCloseModal(); fetchData(meta.page, search, statusFilter); };

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED') return <span className={`${styles.badge} ${styles.badgeAktif}`}>Dipublikasikan</span>;
    if (status === 'DRAFT') return <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>;
    return <span className={`${styles.badge} ${styles.badgeArchived}`}>Diarsipkan</span>;
  };

  if (error) {
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
            <Typography variant="h4">Halaman Statis</Typography>
            <Typography variant="body2" color="secondary">Kelola halaman profil dan informasi desa</Typography>
          </div>
          <Button variant="primary" onClick={handleOpenCreate}>+ Tambah Halaman</Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Cari halaman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <Button variant="secondary" onClick={handleSearch}>Cari</Button>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Judul</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Menu</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Urutan</th>
                <th className={`${styles.th} ${styles.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    <LoadingState message="Memuat data halaman..." />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>Belum ada halaman</td>
                </tr>
              ) : data.map((item) => (
                <tr key={item.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ fontWeight: 500 }}>{item.judul}</div>
                    <div className={styles.slugText}>/halaman/{item.slug}</div>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    {item.isMenu ? (
                      <span className={`${styles.badge} ${styles.badgeYa}`}>Ya</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeTidak}`}>Tidak</span>
                    )}
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    {getStatusBadge(item.status)}
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>{item.urutan}</td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.actionsRow}>
                      {item.status !== 'PUBLISHED' && (
                        <Button variant="outline" size="sm" onClick={() => handlePublish(item.id)}>Publish</Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className={styles.btnHapus}>Hapus</Button>
                    </div>
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
              Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </span>
            <div className={styles.paginationControls}>
              <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => fetchData(meta.page - 1, search, statusFilter)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchData(meta.page + 1, search, statusFilter)}>Next</Button>
            </div>
          </div>
        )}

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Halaman' : 'Tambah Halaman'}>
          <HalamanForm
            mode={editingItem ? 'edit' : 'create'}
            initialData={editingItem ? {
              id: editingItem.id,
              judul: editingItem.judul,
              slug: editingItem.slug,
              excerpt: editingItem.excerpt || '',
              konten: editingItem.konten,
              gambarUrl: '',
              metaTitle: '',
              metaDeskripsi: '',
              metaKeywords: '',
              urutan: editingItem.urutan || 0,
              isMenu: editingItem.isMenu || false,
              status: editingItem.status,
            } : undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>
      </div>
    </AdminLayout>
  );
}

