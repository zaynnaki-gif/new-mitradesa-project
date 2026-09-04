import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Typography } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { TransparansiForm } from '@/components/forms/TransparansiForm';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './TransparansiPage.module.css';

interface Apbdes {
  id: string;
  tahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  totalPembiayaan: number;
  isAktif: boolean;
  dokumenUrl: string | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TransparansiPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Apbdes[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahunSearch, setTahunSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Apbdes | null>(null);

  const fetchData = async (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (tahunSearch) params.set('tahun', tahunSearch);

    try {
      const res = await fetch(`${API_URL}/transparansi?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data || []);
        setMeta(result.meta);
      } else {
        throw new Error(result.error?.message || 'Gagal memuat data');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [token]);

  const handleSearch = () => fetchData(1);

  const handleOpenCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleOpenEdit = (item: Apbdes) => { setEditingItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const handleFormSuccess = () => { handleCloseModal(); fetchData(meta?.page || 1); };

  const handleDelete = async (item: Apbdes) => {
    if (!confirm(`Hapus APBDes tahun ${item.tahun}?`)) return;
    try {
      const res = await fetch(`${API_URL}/transparansi/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) fetchData(meta?.page || 1);
      else alert(result.error?.message || 'Gagal hapus');
    } catch { alert('Terjadi kesalahan'); }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <AdminLayout>
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
              onChange={e => setTahunSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Cari tahun..."
              className={styles.yearInput}
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.875rem', width: '120px' }}
            />
            <Button onClick={handleSearch}>Cari</Button>
            <Button variant="outline" onClick={() => { setTahunSearch(''); fetchData(1); }}>Reset</Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => fetchData()} />
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
                onPageChange={fetchData}
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
