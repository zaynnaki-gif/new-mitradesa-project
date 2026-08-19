import { useState, useEffect } from 'react';
import { Container, Typography, Button, Modal } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import { HalamanForm } from '../../../components/forms/HalamanForm';

interface Halaman {
  id: string;
  judul: string;
  slug: string;
  excerpt: string | null;
  konten: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isMenu: boolean;
  urutan: number;
  createdBy: {
    id: string;
    username: string;
  } | null;
  publishedAt: string | null;
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

export function HalamanPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Halaman[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Halaman> | null>(null);

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

      const res = await fetch(`/api/halaman?${params}`, { headers });
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

      const res = await fetch(`/api/halaman/${id}/publish`, { method: 'POST', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page, search, statusFilter);
      } else {
        alert(result.error?.message || 'Gagal mempublikasikan');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal mempublikasikan halaman');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/halaman/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page, search, statusFilter);
      } else {
        alert(result.error?.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus halaman');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Halaman) => {
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

  if (error) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <Typography variant="h4">
              Halaman Statis
            </Typography>
            <Typography variant="body2" color="secondary">
              Kelola halaman profil dan informasi desa
            </Typography>
          </div>
          <Button variant="primary" onClick={handleOpenCreate}>
            + Tambah Halaman
          </Button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari halaman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
            }}
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
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Judul
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Menu
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Urutan
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>
                    <LoadingState message="Memuat data halaman..." />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    Belum ada halaman
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 500 }}>{item.judul}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                        /halaman/{item.slug}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {item.isMenu ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                          }}
                        >
                          Ya
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                          }}
                        >
                          Tidak
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
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
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {item.urutan}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {item.status !== 'PUBLISHED' && (
                        <Button variant="outline" size="sm" onClick={() => handlePublish(item.id)}>
                          Publish
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
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

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <Typography variant="body2" color="secondary">
              Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </Typography>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          title={editingItem ? 'Edit Halaman' : 'Tambah Halaman'}
        >
          <HalamanForm
            mode={editingItem ? 'edit' : 'create'}
            initialData={editingItem ? {
              id: editingItem.id,
              judul: editingItem.judul,
              slug: editingItem.slug,
              excerpt: editingItem.excerpt || '',
              konten: editingItem.konten,
              gambarUrl: '',
              metaTitle: '',
              metaDeskripsi: '',
              metaKeywords: '',
              urutan: editingItem.urutan || 0,
              isMenu: editingItem.isMenu || false,
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

export default HalamanPage;
