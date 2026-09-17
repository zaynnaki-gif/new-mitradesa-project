import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { PotensiForm } from '@/components/forms/PotensiForm';
import { usePotensiList, useDeletePotensi, Potensi } from '@/hooks/useKonten';
import styles from './PotensiPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';

export function PotensiPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Potensi> | null>(null);

  const { data: queryData, isLoading: loading, error, refetch } = usePotensiList(page, search, token || '');
  const data = queryData?.data || [];


  const deletePotensi = useDeletePotensi();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleOpenCreate = async () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Potensi) => {
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
    const _ok = await confirm({ message: 'Yakin ingin menghapus potensi desa ini?', title: 'Konfirmasi' }); 
    if (!_ok) return;
    try {
      await deletePotensi.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    }
  };

  if (loading && !data.length) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error) return <AdminLayout><ErrorState message={error.message || 'Gagal'} onRetry={() => refetch()} /></AdminLayout>;

  return (
    <AdminLayout>
      {ConfirmElement}
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
