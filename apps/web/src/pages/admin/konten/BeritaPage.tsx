import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { BeritaForm } from '@/components/forms/BeritaForm';
import { useBeritaList, useDeleteBerita, usePublishBerita, useArchiveBerita, Berita } from '@/hooks/useKonten';
import styles from '@/styles/AdminShared.module.css';
import { useConfirm } from '@/hooks/useConfirm';

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#fef3c7', text: '#92400e' },
  PUBLISHED: { bg: '#d1fae5', text: '#065f46' },
  ARCHIVED: { bg: '#f3f4f6', text: '#374151' },
};

export function BeritaPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Berita> | null>(null);

  const { data: queryData, isLoading: loading, error, refetch } = useBeritaList(page, search, statusFilter, token || '');
  const data = queryData?.data || [];
  const meta = queryData?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const publishBerita = usePublishBerita();
  const archiveBerita = useArchiveBerita();
  const deleteBerita = useDeleteBerita();

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
      await publishBerita.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal mempublikasikan berita');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await archiveBerita.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal mengarsipkan berita');
    }
  };

  const handleDelete = async (id: string) => {
    const _ok = await confirm({ message: 'Yakin ingin menghapus?', title: 'Konfirmasi' }); 
    if (!_ok) return;
    try {
      await deleteBerita.mutateAsync({ id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus berita');
    }
  };



  const handleOpenCreate = async () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Berita) => {
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error && data.length === 0) {
    return (
      <AdminLayout>
      {ConfirmElement}
        <div style={{ padding: '2rem' }}>
          <ErrorState message={error.message || 'Gagal'} onRetry={() => refetch()} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <Typography variant="h4">
              Berita & Informasi
            </Typography>
            <Typography variant="body2" color="secondary">
              Kelola berita dan informasi desa
            </Typography>
          </div>
          <Button variant="primary" onClick={handleOpenCreate}>
            + Tambah Berita
          </Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Cari berita..."
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
          <Button variant="secondary" onClick={handleSearch}>
            Cari
          </Button>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Judul</th>
                <th className={styles.th}>Kategori</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                <th className={styles.th}>Penulis</th>
                <th className={styles.th}>Tanggal</th>
                <th className={`${styles.th} ${styles.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    <LoadingState message="Memuat data berita..." />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Belum ada berita
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td} style={{ maxWidth: '300px' }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.judul}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                        /{item.slug}
                      </div>
                    </td>
                    <td className={styles.td}>
                      {item.kategori ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: item.kategori.warna ? `${item.kategori.warna}20` : 'var(--color-bg-muted)',
                            color: item.kategori.warna || 'var(--color-text-primary)',
                          }}
                        >
                          {item.kategori.nama}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>-</span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: statusColors[item.status]?.bg || '#f3f4f6',
                          color: statusColors[item.status]?.text || '#374151',
                        }}
                      >
                        {item.status === 'PUBLISHED' ? 'Dipublikasikan' : item.status === 'DRAFT' ? 'Draft' : 'Diarsipkan'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {item.penulis?.username || '-'}
                    </td>
                    <td className={styles.td} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {formatDate(item.publishedAt || item.createdAt)}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {item.status !== 'PUBLISHED' ? (
                          <Button variant="outline" size="sm" onClick={() => handlePublish(item.id)}>
                            Publish
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleUnpublish(item.id)}>
                            Arsip
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
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
              <Button
                variant="secondary"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage(meta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(meta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingItem ? 'Edit Berita' : 'Tambah Berita'}
        >
          <BeritaForm
            mode={editingItem ? 'edit' : 'create'}
            initialData={editingItem ? {
              id: editingItem.id,
              judul: editingItem.judul,
              slug: editingItem.slug,
              excerpt: editingItem.excerpt || '',
              konten: '',
              gambarUrl: editingItem.gambarUrl || '',
              kategoriId: editingItem.kategori?.id || '',
              metaTitle: editingItem.metaTitle || '',
              metaDeskripsi: editingItem.metaDeskripsi || '',
              metaKeywords: '',
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
