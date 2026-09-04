import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './LayananPage.module.css';

interface ILayanan {
  id: string;
  kode: string;
  nama: string;
  slug: string;
  kategori?: string;
  isActive: boolean;
}

export default function LayananPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<ILayanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/services?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat');
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.meta?.totalPages || 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page]);

  const hapus = async (id: string) => {
    if (!confirm('Hapus?')) return;
    try {
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal hapus');
      load();
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
