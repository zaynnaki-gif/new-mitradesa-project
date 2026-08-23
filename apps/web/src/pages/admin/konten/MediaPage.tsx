import { useState, useEffect } from 'react';
import { Typography, Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { MediaUploadForm } from '@/components/forms/MediaUploadForm';
import { AdminLayout } from '@/layouts';
import { API_URL } from '@/lib/constants';
import styles from './MediaPage.module.css';

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
  uploadedBy: { id: string; username: string } | null;
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
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(searchQuery && { search: searchQuery }),
      ...(fileType && { fileType }),
    });
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/media?${params}`, { headers });
    const result = await res.json();
    if (result.success) {
      setData(result.data || []);
      if (result.meta) setMeta(result.meta);
    } else {
      throw new Error(result.error?.message || 'Failed to fetch');
    }
  };

  const fetchStats = async () => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/media/stats`, { headers });
    const result = await res.json();
    if (result.success) setStats(result.data);
  };

  useEffect(() => { fetchData(1, search, fileTypeFilter); fetchStats(); }, []);

  const handleSearch = () => fetchData(1, search, fileTypeFilter);
  const handleFilterChange = (newFileType: string) => {
    setFileTypeFilter(newFileType);
    fetchData(1, search, newFileType);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus media ini?')) return;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/media/${id}`, { method: 'DELETE', headers });
    const result = await res.json();
    if (result.success) { fetchData(meta.page, search, fileTypeFilter); fetchStats(); }
    else alert(result.error?.message || 'Gagal menghapus');
  };

  const handleOpenCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleOpenEdit = (item: Media) => { setEditingItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const handleFormSuccess = () => { handleCloseModal(); fetchData(meta.page, search, fileTypeFilter); fetchStats(); };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading && data.length === 0) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <LoadingState message="Memuat data media..." fullPage />
        </div>
      </AdminLayout>
    );
  }

  if (error && data.length === 0) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <ErrorState message={error} onRetry={() => fetchData()} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Typography variant="h4">Media Library</Typography>
            <Typography variant="body2" color="secondary">Kelola file media website</Typography>
          </div>
          <Button variant="primary" onClick={handleOpenCreate}>+ Upload Media</Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statTotal}`}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
            <div className={`${styles.statCard} ${styles.statImage}`}>
              <div className={styles.statValue} style={{ color: '#1e40af' }}>{stats.images}</div>
              <div className={styles.statLabel} style={{ color: '#1e40af' }}>Images</div>
            </div>
            <div className={`${styles.statCard} ${styles.statVideo}`}>
              <div className={styles.statValue} style={{ color: '#9d174d' }}>{stats.videos}</div>
              <div className={styles.statLabel} style={{ color: '#9d174d' }}>Videos</div>
            </div>
            <div className={`${styles.statCard} ${styles.statAudio}`}>
              <div className={styles.statValue} style={{ color: '#166534' }}>{stats.audio}</div>
              <div className={styles.statLabel} style={{ color: '#166534' }}>Audio</div>
            </div>
            <div className={`${styles.statCard} ${styles.statDoc}`}>
              <div className={styles.statValue} style={{ color: '#92400e' }}>{stats.documents}</div>
              <div className={styles.statLabel} style={{ color: '#92400e' }}>Docs</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Cari media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <select
            value={fileTypeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Semua Tipe</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="AUDIO">Audio</option>
            <option value="DOCUMENT">Documents</option>
          </select>
          <Button variant="secondary" onClick={handleSearch}>Cari</Button>
        </div>

        {/* Grid */}
        {data.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <Typography variant="h4" color="secondary" style={{ fontSize: '1rem' }}>Belum ada media</Typography>
            <Typography variant="body2" color="secondary">Upload media untuk menampilkan di sini</Typography>
          </div>
        ) : (
          <div className={styles.mediaGrid}>
            {data.map((item) => (
              <div key={item.id} className={styles.mediaCard}>
                <div className={styles.mediaPreview}>
                  {item.fileType === 'IMAGE' && item.fileUrl ? (
                    <img
                      src={item.fileUrl}
                      alt={item.alt || item.nama}
                      className={styles.mediaPreviewImg}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>{fileTypeColors[item.fileType]?.icon || '📄'}</span>
                  )}
                  <span
                    className={styles.mediaTypeBadge}
                    style={{
                      backgroundColor: fileTypeColors[item.fileType]?.bg || '#f3f4f6',
                      color: fileTypeColors[item.fileType]?.text || '#6b7280',
                    }}
                  >
                    {item.fileType}
                  </span>
                </div>
                <div className={styles.mediaInfo}>
                  <div className={styles.mediaName}>{item.nama}</div>
                  <div className={styles.mediaMeta}>
                    {formatFileSize(item.fileSize)}
                    {item.width && item.height && ` • ${item.width}x${item.height}`}
                  </div>
                  <div className={styles.mediaDate}>{formatDate(item.createdAt)}</div>
                </div>
                <div className={styles.mediaActions}>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mediaActionBtn}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className={`${styles.mediaActionBtn} ${styles.btnEdit}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={`${styles.mediaActionBtn} ${styles.btnHapus}`}
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
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </span>
            <div className={styles.paginationControls}>
              <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => fetchData(meta.page - 1, search, fileTypeFilter)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchData(meta.page + 1, search, fileTypeFilter)}>Next</Button>
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
    </AdminLayout>
  );
}

export default MediaPage;
