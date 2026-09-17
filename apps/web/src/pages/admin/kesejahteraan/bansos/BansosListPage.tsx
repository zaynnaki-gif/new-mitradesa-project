import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useBansos, useDeleteBansos } from '@/hooks/useBansos';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './BansosListPage.module.css';

export default function BansosListPage() {
  const { data: items, isLoading, error, refetch } = useBansos();
  const deleteBansos = useDeleteBansos();
  const { confirm, ConfirmElement } = useConfirm();

  const handleDelete = async (id: string, nama: string) => {
    const ok = await confirm({
      title: 'Hapus Program Bansos',
      message: `Apakah Anda yakin ingin menghapus program "${nama}"? Semua data penerima juga akan terhapus.`,
    });

    if (ok) {
      deleteBansos.mutate(id, {
        onError: (err) => {
          alert(err.message || 'Gagal menghapus program bansos');
        }
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'success';
      case 'SELESAI': return 'secondary';
      case 'DRAFT': return 'muted';
      default: return 'primary';
    }
  };

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Data Program Bantuan Sosial</h1>
            <p className={styles.subtitle}>Kelola program bansos dan daftar penerima</p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/admin/kesejahteraan/bansos/create">
              <Button variant="primary">+ Tambah Program</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Memuat daftar bansos..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal Memuat Data" message={error.message || 'Terjadi kesalahan'} onRetry={refetch} />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Program</th>
                  <th>Penyelenggara</th>
                  <th>Target</th>
                  <th>Penerima</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!items || items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>Belum ada program bansos.</td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.nama}</strong>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          {item.jenisBantuan}
                        </div>
                      </td>
                      <td>{item.penyelenggara}</td>
                      <td>{item.targetPenerima}</td>
                      <td>
                        {item.totalPenerima} {item.kuota ? `/ ${item.kuota}` : ''}
                      </td>
                      <td>
                        <Badge color={getStatusBadgeColor(item.status)}>{item.status}</Badge>
                      </td>
                      <td className={styles.actions}>
                        <Link to={`/admin/kesejahteraan/bansos/${item.id}/penerima`}>
                          <Button variant="outline" size="sm">Penerima</Button>
                        </Link>
                        <Link to={`/admin/kesejahteraan/bansos/${item.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                          onClick={() => handleDelete(item.id, item.nama)}
                        >
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
