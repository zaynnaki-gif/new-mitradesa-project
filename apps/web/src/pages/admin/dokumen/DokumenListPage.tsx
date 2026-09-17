import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import shared from '@/styles/AdminShared.module.css';
import s from '@/pages/admin/layanan/LayananListPage.module.css';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { useDokumenInstances } from '@/hooks/useDokumen';
import { ErrorState, LoadingState } from '@/components/states';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  GENERATED: { bg: '#f3f4f6', text: '#374151' },
  PENDING_SIGNATURE: { bg: '#fef3c7', text: '#92400e' },
  SIGNED: { bg: '#dbeafe', text: '#1e40af' },
  VERIFIED: { bg: '#d1fae5', text: '#065f46' },
  ARCHIVED: { bg: '#fee2e2', text: '#991b1b' },
};

const STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Dibuat',
  PENDING_SIGNATURE: 'Menunggu TTD',
  SIGNED: 'Ditandatangani',
  VERIFIED: 'Terverifikasi',
  ARCHIVED: 'Diarsipkan',
};

export default function DokumenListPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ search: '', status: '' });
  const [searchInput, setSearchInput] = useState('');

  const { data: queryData, isLoading: loading, error, refetch } = useDokumenInstances(
    { page, limit: 20, search: filter.search, status: filter.status },
    token || ''
  );

  const documents = queryData?.data || [];
  const meta = queryData?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const handleSearch = () => {
    setFilter(prev => ({ ...prev, search: searchInput }));
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    setPage(1);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const copyVerificationLink = (verificationToken: string) => {
    const url = `${window.location.origin}/verifikasi/${verificationToken}`;
    navigator.clipboard.writeText(url);
    alert('Link verifikasi berhasil disalin!');
  };

  if (error && documents.length === 0) {
    return (
      <AdminLayout>
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
        <div className={shared.pageHeader}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Manajemen Dokumen
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Kelola dokumen yang telah dibuat
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={shared.filters}>
          <input
            type="text"
            placeholder="Cari nomor dokumen, judul..."
            className={shared.searchInput}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className={shared.selectInput}
            value={filter.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="GENERATED">Dibuat</option>
            <option value="PENDING_SIGNATURE">Menunggu TTD</option>
            <option value="SIGNED">Ditandatangani</option>
            <option value="VERIFIED">Terverifikasi</option>
            <option value="ARCHIVED">Diarsipkan</option>
          </select>
        </div>

        {/* Table */}
        <div className={shared.tableContainer}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th className={shared.th}>Nomor Dokumen</th>
                <th className={shared.th}>Judul</th>
                <th className={shared.th}>Template</th>
                <th className={`${shared.th} ${shared.thCenter}`}>Status</th>
                <th className={shared.th}>Tanggal</th>
                <th className={`${shared.th} ${shared.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className={shared.emptyState}>
                    <LoadingState message="Memuat data dokumen..." />
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className={shared.emptyState}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                    <p style={{ margin: '0 0 0.25rem' }}>Belum ada dokumen</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Dokumen akan muncul setelah ada permintaan yang disetujui
                    </p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className={shared.tr}>
                    <td className={shared.td}>
                      <code className={s.codeBadge}>{doc.nomorDokumen}</code>
                    </td>
                    <td className={shared.td}>
                      <div style={{ fontWeight: 500 }}>{doc.judul}</div>
                      {doc.dokumen && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          {doc.dokumen.nama}
                        </div>
                      )}
                    </td>
                    <td className={shared.td}>
                      <div style={{ fontSize: '0.875rem' }}>
                        {doc.templateVersion?.template?.nama || '-'}
                      </div>
                      {doc.templateVersion && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          v{doc.templateVersion.version}
                        </div>
                      )}
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: STATUS_COLORS[doc.status]?.bg || 'var(--color-bg-muted)',
                        color: STATUS_COLORS[doc.status]?.text || 'var(--color-text-primary)',
                      }}>
                        {STATUS_LABELS[doc.status] || doc.status}
                      </span>
                    </td>
                    <td className={shared.td} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {formatDate(doc.generatedAt)}
                    </td>
                    <td className={`${shared.td} ${shared.tdRight}`}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button
                          onClick={() => navigate(`/admin/dokumen/${doc.id}`)}
                          className={`${s.actionLink} ${s.actionLinkBlue}`}
                        >
                          Detail
                        </button>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${s.actionLink} ${s.actionLinkGreen}`}
                          >
                            Download
                          </a>
                        )}
                        {doc.verificationToken && (
                          <button
                            onClick={() => copyVerificationLink(doc.verificationToken!)}
                            className={`${s.actionLink} ${s.actionLinkBlue}`}
                            title="Salin link verifikasi"
                          >
                            Copy Link
                          </button>
                        )}
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
          <div className={shared.pagination}>
            <span className={shared.pageInfo}>
              Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </span>
            <div className={shared.paginationControls}>
              <button
                disabled={meta.page <= 1}
                onClick={() => setPage(meta.page - 1)}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-base)',
                  cursor: meta.page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: meta.page <= 1 ? 0.5 : 1,
                  fontSize: '0.875rem',
                }}
              >
                ← Sebelumnya
              </button>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(meta.page + 1)}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-base)',
                  cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer',
                  opacity: meta.page >= meta.totalPages ? 0.5 : 1,
                  fontSize: '0.875rem',
                }}
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
