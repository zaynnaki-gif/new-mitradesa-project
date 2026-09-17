import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { KategoriForm } from '@/components/forms/KategoriForm';
import { useKategoriList, useDeleteKategori, Kategori } from '@/hooks/useKonten';
import styles from './KategoriPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';



export function KategoriPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Kategori> | null>(null);

  const { data: queryData, isLoading: loading, error, refetch } = useKategoriList(page, search, token || '');
  const data = queryData?.data || [];
  const meta = queryData?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const deleteKategori = useDeleteKategori();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };



  const handleOpenCreate = async () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Kategori) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSuccess = async () => {
    handleCloseModal();
    refetch();
  };

  const handleDelete = async (id: string) => {
    const _ok = await confirm({ message: 'Yakin ingin menghapus?', title: 'Konfirmasi' }); 
    if (!_ok) return;
    try {
      await deleteKategori.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    }
  };

  if (error && data.length === 0) {
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
              <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>Next</Button>
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

