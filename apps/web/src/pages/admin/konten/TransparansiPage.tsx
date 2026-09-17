import { useState, useRef } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { TransparansiForm } from '@/components/forms/TransparansiForm';
import { useAuthStore } from '@/stores/auth.store';
import styles from './TransparansiPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';
import { useAdminApbdesList, useDeleteApbdes, Apbdes } from '@/hooks/useTransparansi';

export default function TransparansiPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  
  const [page, setPage] = useState(1);
  const [tahunSearch, setTahunSearch] = useState('');
  const [debouncedTahun, setDebouncedTahun] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Apbdes | null>(null);

  const { data: listResponse, isLoading: loading, error: queryError, refetch } = useAdminApbdesList(
    page,
    debouncedTahun,
    token || ''
  );
  
  const deleteMutation = useDeleteApbdes();

  const data = listResponse?.data || [];
  const meta = listResponse?.meta;
  const error = queryError?.message || '';

  const handleSearchChange = (value: string) => {
    setTahunSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedTahun(value);
      setPage(1);
    }, 400);
  };

  const handleSearch = () => {
    setDebouncedTahun(tahunSearch);
    setPage(1);
  };

  const handleOpenCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleOpenEdit = (item: Apbdes) => { setEditingItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const handleFormSuccess = () => { handleCloseModal(); refetch(); };

  const handleDelete = async (item: Apbdes) => {
    const _ok = await confirm({ message: `Hapus APBDes tahun ${item.tahun}?`, title: 'Konfirmasi' }); 
    if (!_ok) return;
    
    try {
      await deleteMutation.mutateAsync({ id: item.id, token: token || '' });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Terjadi kesalahan');
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Transparansi APBDes</h1>
            <p className={styles.subtitle}>{meta?.total || 0} data APBDes</p>
          </div>
          <Button onClick={handleOpenCreate}>+ Tambah APBDes</Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <input
              type="number"
              value={tahunSearch}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Cari tahun..."
              className={styles.yearInput}
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.875rem', width: '120px' }}
            />
            <Button onClick={handleSearch}>Cari</Button>
            <Button variant="outline" onClick={() => { 
              setTahunSearch(''); 
              setDebouncedTahun('');
              setPage(1); 
            }}>Reset</Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => refetch()} />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Pendapatan</th>
                    <th>Belanja</th>
                    <th>Pembiayaan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        Belum ada data.{' '}
                        <Button size="sm" variant="outline" onClick={handleOpenCreate}>+ Tambah</Button>
                      </td>
                    </tr>
                  ) : data.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.tahun}</strong></td>
                      <td style={{ color: 'var(--color-success)' }}>{formatRupiah(item.totalPendapatan)}</td>
                      <td style={{ color: 'var(--color-error)' }}>{formatRupiah(item.totalBelanja)}</td>
                      <td>{formatRupiah(item.totalPembiayaan)}</td>
                      <td>
                        <Typography variant="caption" style={{ color: item.isAktif ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                          {item.isAktif ? 'Aktif' : 'Nonaktif'}
                        </Typography>
                      </td>
                      <td className={styles.actions}>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(item)}
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                        >Hapus</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                disabled={loading}
              />
            )}
          </>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editingItem ? 'Edit APBDes' : 'Tambah APBDes'}</h2>
                <button onClick={handleCloseModal}>&times;</button>
              </div>
              <TransparansiForm
                initialData={editingItem || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
