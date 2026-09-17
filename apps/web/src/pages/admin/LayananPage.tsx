import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import styles from './LayananPage.module.css';
import { useAdminLayananList, useDeleteLayanan } from '@/hooks/useLayanan';

export default function LayananPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: response, isLoading: loading, error: queryError } = useAdminLayananList(page, token || '');
  const data = response?.data || [];
  const total = response?.meta?.totalPages || 1;
  const error = queryError ? queryError.message : '';

  const deleteMutation = useDeleteLayanan();

  const hapus = async (id: string) => {
    if (!confirm('Hapus?')) return;
    try {
      await deleteMutation.mutateAsync({ id, token: token || '' });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  if (loading) return <div className={styles.loading}>Memuat...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Manajemen Layanan</h1>
          <button className={styles.addButton}>+ Tambah</button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Kode</th>
                <th className={styles.th}>Nama</th>
                <th className={styles.th}>Kategori</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyState}>Belum ada layanan</td></tr>
              ) : data.map(l => (
                <tr key={l.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdMono}`}>{l.kode}</td>
                  <td className={styles.td}>{l.nama}</td>
                  <td className={styles.td}>{l.kategori || '-'}</td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    <span className={l.isActive ? styles.badgeActive : styles.badgeInactive}>
                      {l.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    <button onClick={() => navigate(`/admin/layanan/${l.id}/fields`)} className={`${styles.actionButton} ${styles.actionEdit}`}>Edit Fields</button>
                    <button onClick={() => hapus(l.id)} className={`${styles.actionButton} ${styles.actionDelete}`}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 1 && (
          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.pageButton}>Prev</button>
            <span className={styles.pageInfo}>Halaman {page} / {total}</span>
            <button disabled={page === total} onClick={() => setPage(p => p + 1)} className={styles.pageButton}>Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
