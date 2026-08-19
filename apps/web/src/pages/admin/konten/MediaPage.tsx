import { useState, useEffect } from 'react';
import { Container, Typography, Button, Modal } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import { MediaUploadForm } from '../../../components/forms/MediaUploadForm';

interface Media {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  kategori: string | null;
  uploadedBy: {
    id: string;
    username: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  images: number;
  videos: number;
  audio: number;
  documents: number;
}

const fileTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  IMAGE: { bg: '#dbeafe', text: '#1e40af', icon: '🖼️' },
  VIDEO: { bg: '#fce7f3', text: '#9d174d', icon: '🎬' },
  AUDIO: { bg: '#dcfce7', text: '#166534', icon: '🎵' },
  DOCUMENT: { bg: '#fef3c7', text: '#92400e', icon: '📄' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function MediaPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Media[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Media> | null>(null);

  const fetchData = async (page = 1, searchQuery = '', fileType = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(fileType && { fileType }),
      });

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/media?${params}`, { headers });
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

  const fetchStats = async () => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/media/stats', { headers });
      const result = await res.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchData(1, search, fileTypeFilter);
    fetchStats();
  }, []);

  const handleSearch = () => fetchData(1, search, fileTypeFilter);
  const handleFilterChange = (newFileType: string) => {
    setFileTypeFilter(newFileType);
    fetchData(1, search, newFileType);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus media ini?')) return;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/media/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData(meta.page, search, fileTypeFilter);
        fetchStats();
      } else {
        alert(result.error?.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus media');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Media) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    fetchData(meta.page, search, fileTypeFilter);
    fetchStats();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && data.length === 0) {
    return (
      <Container>
        <div style={{ padding: '2rem' }}>
          <LoadingState message="Memuat data media..." fullPage />
        </div>
      </Container>
    );
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <Typography variant="h4">
              Media Library
            </Typography>
            <Typography variant="body2" color="secondary">
              Kelola file media website
            </Typography>
          </div>
          <Button variant="primary" onClick={handleOpenCreate}>
            + Upload Media
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.total}</div>
              <div style={{ fontSize: '0.625rem', color: '#6b7280' }}>Total</div>
            </div>
            <div style={{ backgroundColor: '#dbeafe', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af' }}>{stats.images}</div>
              <div style={{ fontSize: '0.625rem', color: '#1e40af' }}>Images</div>
            </div>
            <div style={{ backgroundColor: '#fce7f3', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#9d174d' }}>{stats.videos}</div>
              <div style={{ fontSize: '0.625rem', color: '#9d174d' }}>Videos</div>
            </div>
            <div style={{ backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>{stats.audio}</div>
              <div style={{ fontSize: '0.625rem', color: '#166534' }}>Audio</div>
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#92400e' }}>{stats.documents}</div>
              <div style={{ fontSize: '0.625rem', color: '#92400e' }}>Docs</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: '1 1 200px',
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
          <select
            value={fileTypeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
            }}
          >
            <option value="">Semua Tipe</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="AUDIO">Audio</option>
            <option value="DOCUMENT">Documents</option>
          </select>
          <Button variant="secondary" onClick={handleSearch}>
            Cari
          </Button>
        </div>

        {/* Grid */}
        {data.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
            <Typography variant="h4" color="secondary" style={{ fontSize: '1rem' }}>
              Belum ada media
            </Typography>
            <Typography variant="body2" color="secondary">
              Upload media untuk menampilkan di sini
            </Typography>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {data.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}
              >
                {/* Preview */}
                <div
                  style={{
                    height: '120px',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {item.fileType === 'IMAGE' && item.fileUrl ? (
                    <img
                      src={item.fileUrl}
                      alt={item.alt || item.nama}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>
                      {fileTypeColors[item.fileType]?.icon || '📄'}
                    </span>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      backgroundColor: fileTypeColors[item.fileType]?.bg || '#f3f4f6',
                      color: fileTypeColors[item.fileType]?.text || '#6b7280',
                    }}
                  >
                    {item.fileType}
                  </span>
                </div>

                {/* Info */}
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.nama}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {formatFileSize(item.fileSize)}
                    {item.width && item.height && ` • ${item.width}x${item.height}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    {formatDate(item.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '0.25rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textDecoration: 'none',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem',
                    }}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    style={{
                      flex: 1,
                      padding: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#3B82F6',
                      background: 'none',
                      border: '1px solid #bfdbfe',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      flex: 1,
                      padding: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#ef4444',
                      background: 'none',
                      border: '1px solid #fecaca',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Typography variant="body2" color="secondary">
              Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </Typography>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => fetchData(meta.page - 1, search, fileTypeFilter)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchData(meta.page + 1, search, fileTypeFilter)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Upload/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingItem ? 'Edit Media' : 'Upload Media'}
        >
          <MediaUploadForm
            mode={editingItem ? 'edit' : 'create'}
            initialData={editingItem ? {
              nama: editingItem.nama,
              slug: editingItem.slug,
              deskripsi: editingItem.deskripsi || '',
              fileUrl: editingItem.fileUrl,
              fileType: editingItem.fileType as 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT',
              fileSize: editingItem.fileSize,
              mimeType: editingItem.mimeType,
              width: editingItem.width || undefined,
              height: editingItem.height || undefined,
              alt: editingItem.alt || '',
              kategori: editingItem.kategori || '',
            } : undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>
      </div>
    </Container>
  );
}

export default MediaPage;
