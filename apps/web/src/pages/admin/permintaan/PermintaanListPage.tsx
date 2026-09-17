import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { usePermintaanList } from '@/hooks/usePermintaan';
import styles from './PermintaanListPage.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Diajukan' },
  { value: 'VERIFICATION', label: 'Verifikasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  VERIFICATION: 'Verifikasi',
  PROCESSING: 'Diproses',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default function PermintaanListPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: listResponse, isLoading: loading, error: queryError, refetch } = usePermintaanList(
    page,
    statusFilter,
    debouncedSearch,
    token || ''
  );

  const requests = listResponse?.data || [];
  const pagination = listResponse?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const error = queryError?.message || '';

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: styles.statusDraft,
      SUBMITTED: styles.statusSubmitted,
      VERIFICATION: styles.statusVerification,
      PROCESSING: styles.statusProcessing,
      APPROVED: styles.statusApproved,
      REJECTED: styles.statusRejected,
      COMPLETED: styles.statusCompleted,
      CANCELLED: styles.statusCancelled,
    };
    return map[status] || styles.statusDraft;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Permintaan Layanan</h1>
            <p className={styles.subtitle}>
              {loading ? 'Memuat...' : `${pagination.total} permintaan ditemukan`}
            </p>
          </div>
          <button
            className={styles.refreshButton}
            onClick={() => refetch()}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari nomor permintaan atau nama pemohon..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {search && (
              <button
                className={styles.clearSearch}
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                  setPage(1);
                }}
              >
                ✕
              </button>
            )}
          </div>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️ {error}</span>
            <button
              onClick={() => refetch()}
              className={styles.retryButton}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <span>Memuat permintaan...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>Tidak ada permintaan{statusFilter ? ` dengan status "${STATUS_LABEL[statusFilter]}"` : ''}{debouncedSearch ? ` yang cocok dengan pencarian "${debouncedSearch}"` : ''}</p>
              {(statusFilter || debouncedSearch) && (
                <button
                  className={styles.clearFilterButton}
                  onClick={() => {
                    setStatusFilter('');
                    setSearch('');
                    setDebouncedSearch('');
                  }}
                >
                  Hapus Filter
                </button>
              )}
            </div>
          ) : (
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>Nomor</th>
                  <th className={styles.tableHeadCell}>Layanan</th>
                  <th className={styles.tableHeadCell}>Pemohon</th>
                  <th className={`${styles.tableHeadCell} ${styles.tableHeadCellCenter}`}>
                    Status
                  </th>
                  <th className={styles.tableHeadCell}>Tanggal</th>
                  <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className={styles.tableRow}>
                    <td className={`${styles.tableCell} ${styles.tableCellMono}`}>
                      {req.nomorPermintaan}
                    </td>
                    <td className={styles.tableCell}>{req.layananNama || '-'}</td>
                    <td className={styles.tableCell}>{req.pendudukNama || '-'}</td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                      <span className={`${styles.statusBadge} ${getStatusClass(req.status)}`}>
                        {STATUS_LABEL[req.status] || req.status}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      {formatDate(req.submittedAt || req.createdAt)}
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                      <button
                        onClick={() => navigate(`/admin/permintaan/${req.id}`)}
                        className={styles.actionLink}
                      >
                        Detail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              ← Sebelumnya
            </button>
            <span className={styles.pageInfo}>
              Halaman {page} dari {pagination.totalPages}
              <span className={styles.pageTotalItems}> ({pagination.total} total)</span>
            </span>
            <button
              className={styles.pageButton}
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
