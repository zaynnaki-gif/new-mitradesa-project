import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { HalamanForm } from '@/components/forms/HalamanForm';
import { useHalamanList, useDeleteHalaman, usePublishHalaman, Halaman } from '@/hooks/useKonten';
import styles from './HalamanPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';



export function HalamanPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Halaman> | null>(null);

  const { data: queryData, isLoading: loading, error, refetch } = useHalamanList(page, search, statusFilter, token || '');
  const data = queryData?.data || [];
  const meta = queryData?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const deleteHalaman = useDeleteHalaman();
  const publishHalaman = usePublishHalaman();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handlePublish = async (id: string) => {
    try {
      await publishHalaman.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal mempublikasikan');
    }
  };

  const handleDelete = async (id: string) => {
    const _ok = await confirm({ message: 'Yakin ingin menghapus?', title: 'Konfirmasi' }); 
    if (!_ok) return;
    try {
      await deleteHalaman.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const handleOpenCreate = async () => { setEditingItem(null); setIsModalOpen(true); };
  const handleOpenEdit = async (item: Halaman) => { setEditingItem(item); setIsModalOpen(true); };
  const handleCloseModal = async () => { setIsModalOpen(false); setEditingItem(null); };
  const handleFormSuccess = async () => { handleCloseModal(); refetch(); };

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED') return <span className={`${styles.badge} ${styles.badgeAktif}`}>Dipublikasikan</span>;
    if (status === 'DRAFT') return <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>;
    return <span className={`${styles.badge} ${styles.badgeArchived}`}>Diarsipkan</span>;
  };

  if (error) {
    return (
      <AdminLayout>
      {ConfirmElement}
        <div className={styles.container}>
          <ErrorState message={error.message || 'Gagal'} onRetry={() => refetch()} />
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
              <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>Next</Button>
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

