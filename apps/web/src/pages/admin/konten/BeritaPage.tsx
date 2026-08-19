import { useState, useEffect } from 'react';
import { Container, Typography, Button, Modal } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import { BeritaForm } from '../../../components/forms/BeritaForm';
import styles from '../../../styles/AdminShared.module.css';

interface Berita {
  id: string;
  judul: string;
  slug: string;
  excerpt: string | null;
  gambarUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  kategori: {
    id: string;
    nama: string;
    slug: string;
    warna: string | null;
  } | null;
  penulis: {
    id: string;
    username: string;
  } | null;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDeskripsi: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#fef3c7', text: '#92400e' },
  PUBLISHED: { bg: '#d1fae5', text: '#065f46' },
  ARCHIVED: { bg: '#f3f4f6', text: '#374151' },
};

export function BeritaPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Berita[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Berita> | null>(null);

  const fetchData = async (page = 1, searchQuery = '', status = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(status && { status }),
      });

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/berita?${params}`, { headers });
      const result = await res.json();

      if (result.success) {
        setData(result.data || []);
        if (result.meta) setMeta(result.meta);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, search, statusFilter);
  }, []);

  const handleSearch = () => fetchData(1, search, statusFilter);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchData(1, search, newStatus);
  };

  const handlePublish = async (id: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/berita/${id}/publish`, { method: 'POST', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page, search, statusFilter);
      } else {
        alert(result.error?.message || 'Gagal mempublikasikan');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal mempublikasikan berita');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/berita/${id}/archive`, { method: 'POST', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page, search, statusFilter);
      } else {
        alert(result.error?.message || 'Gagal mengarsipkan');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal mengarsipkan berita');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/berita/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page, search, statusFilter);
      } else {
        alert(result.error?.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus berita');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Berita) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    fetchData(meta.page, search, statusFilter);
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
      <Container>
        <div style={{ padding: '2rem' }}>
          <ErrorState message={error} onRetry={() => fetchData()} />
        </div>
      </Container>
    );
  }

  return (
    <Container>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                onClick={() => fetchData(meta.page - 1, search, statusFilter)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchData(meta.page + 1, search, statusFilter)}
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
    </Container>
  );
}
export default BeritaPage;
