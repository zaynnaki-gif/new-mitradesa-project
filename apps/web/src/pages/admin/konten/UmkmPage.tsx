import { useState } from 'react';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { UmkmForm } from '@/components/forms/UmkmForm';
import { AdminLayout } from '@/layouts';
import { useUmkmList, useDeleteUmkm, Umkm } from '@/hooks/useUmkm';
import styles from './UmkmPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';



export function UmkmPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Umkm> | null>(null);

  const { data: queryData, isLoading: loading, error, refetch } = useUmkmList(
    { page, search, limit: 20 },
    token || ''
  );
  
  const data = queryData?.data || [];
  
  const deleteUmkm = useDeleteUmkm();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleOpenCreate = async () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Umkm) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSuccess = async () => {
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const _ok = await confirm({ message: 'Yakin ingin menghapus produk UMKM ini?', title: 'Konfirmasi' }); 
    if (!_ok) return;
    
    try {
      await deleteUmkm.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        <div className={styles.header}>
          <Typography variant="h2">Kelola UMKM</Typography>
          <Button onClick={handleOpenCreate}>Tambah UMKM</Button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Cari nama..."
            className={styles.searchInput}
          />
          <Button onClick={handleSearch} variant="secondary">Cari</Button>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error.message || 'Gagal'} onRetry={() => refetch()} />}

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

