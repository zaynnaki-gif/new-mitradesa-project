import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { AgendaForm } from '@/components/forms/AgendaForm';
import { useAgendaList, useDeleteAgenda, Agenda } from '@/hooks/useKonten';
import styles from '@/styles/AdminShared.module.css';
import { useConfirm } from '@/hooks/useConfirm';

export function AgendaPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Agenda> | null>(null);

  const { data: queryData, isLoading: loading, error, refetch } = useAgendaList(page, search, token || '');
  const data = queryData?.data || [];


  const deleteAgenda = useDeleteAgenda();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };



  const handleOpenCreate = async () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Agenda) => {
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
    const _ok = await confirm({ message: 'Yakin ingin menghapus agenda ini?', title: 'Konfirmasi' }); 
    if (!_ok) return;
    try {
      await deleteAgenda.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    }
  };

  return (
    <AdminLayout>
      {ConfirmElement}
      <div style={{ padding: '1.5rem' }}>
        <div className={styles.pageHeader}>
          <Typography variant="h2">Kelola Agenda</Typography>
          <Button onClick={handleOpenCreate}>Tambah Agenda</Button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul..."
            className={styles.searchInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
