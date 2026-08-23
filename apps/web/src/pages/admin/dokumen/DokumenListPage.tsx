import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import shared from '@/styles/AdminShared.module.css';
import s from '@/pages/admin/layanan/LayananListPage.module.css';
import { AdminLayout } from '@/layouts';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';

interface DocumentInstance {
  id: string;
  dokumenId: string;
  permintaanId?: string;
  templateVersionId: string;
  nomorDokumen: string;
  judul: string;
  status: string;
  fileUrl?: string;
  verificationToken?: string;
  generatedAt: string;
  signedAt?: string;
  dokumen?: { id: string; kode: string; nama: string };
  templateVersion?: {
    id: string;
    version: number;
    template?: { id: string; nama: string };
  };
  signature?: {
    id: string;
    penandatangan?: { nama: string; jabatan: string };
    signedAt: string;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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
  const [documents, setDocuments] = useState<DocumentInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [filter, setFilter] = useState({ search: '', status: '' });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (filter.search) params.set('search', filter.search);
      if (filter.status) params.set('status', filter.status);

      const res = await fetch(`${API_URL}/api/documents/instances?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat data');
      const json = await res.json();
      setDocuments(json.data || []);
      setPagination(json.meta || pagination);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter, token]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const copyVerificationLink = (verificationToken: string) => {
    const url = `${window.location.origin}/verifikasi/${verificationToken}`;
    navigator.clipboard.writeText(url);
    alert('Link verifikasi berhasil disalin!');
  };

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
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
          />
          <select
            className={shared.selectInput}
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
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
          {loading ? (
            <div className={shared.emptyState}>Memuat...</div>
          ) : error ? (
            <div className={shared.emptyState} style={{ color: 'var(--color-error)' }}>{error}</div>
          ) : documents.length === 0 ? (
            <div className={shared.emptyState}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
              <p style={{ margin: '0 0 0.25rem' }}>Belum ada dokumen</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Dokumen akan muncul setelah ada permintaan yang disetujui
              </p>
            </div>
          ) : (
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
                {documents.map((doc) => (
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
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={shared.pagination}>
            <span className={shared.pageInfo}>
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <div className={shared.paginationControls}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-base)',
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page <= 1 ? 0.5 : 1,
                  fontSize: '0.875rem',
                }}
              >
                ← Sebelumnya
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-base)',
                  cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
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
