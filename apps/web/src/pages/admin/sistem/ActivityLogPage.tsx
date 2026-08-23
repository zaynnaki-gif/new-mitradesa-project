import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './ActivityLogPage.module.css';

// ============================================
// Types
// ============================================

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string;
  actorType?: string;
  actorIp?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}



const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Buat',
  UPDATE: 'Ubah',
  DELETE: 'Hapus',
  LOGIN_SUCCESS: 'Login Berhasil',
  LOGIN_FAILED: 'Login Gagal',
  LOGOUT: 'Logout',
  OTP_REQUESTED: 'Request OTP',
  OTP_VERIFIED: 'OTP Verified',
  OTP_FAILED: 'OTP Gagal',
  ACCOUNT_DISABLED: 'Akun Dinonaktifkan',
  ACCOUNT_ENABLED: 'Akun Diaktifkan',
  PASSWORD_CHANGED: 'Password Diubah',
  PENDUDUK_CREATED: 'Buat Penduduk',
  PENDUDUK_UPDATED: 'Ubah Penduduk',
  PENDUDUK_DELETED: 'Hapus Penduduk',
  KELUARGA_CREATED: 'Buat Keluarga',
  KELUARGA_UPDATED: 'Ubah Keluarga',
  KELUARGA_DELETED: 'Hapus Keluarga',
  BERITA_CREATED: 'Buat Berita',
  BERITA_UPDATED: 'Ubah Berita',
  BERITA_DELETED: 'Hapus Berita',
  MEDIA_UPLOADED: 'Upload Media',
  MEDIA_DELETED: 'Hapus Media',
};

const ENTITY_TYPES = [
  { value: '', label: 'Semua Entitas' },
  { value: 'ACCOUNT', label: 'Akun' },
  { value: 'PENDUDUK', label: 'Penduduk' },
  { value: 'KELUARGA', label: 'Keluarga' },
  { value: 'BERITA', label: 'Berita' },
  { value: 'Halaman', label: 'Halaman' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'LEMBAGA', label: 'Lembaga' },
  { value: 'LAYANAN', label: 'Layanan' },
  { value: 'KATEGORI', label: 'Kategori' },
];

const getActionLabel = (action: string) => {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  // Convert SNAKE_CASE to Title Case
  return action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
};

const getActionColor = (action: string) => {
  if (action.includes('CREATE') || action.includes('SUCCESS') || action.includes('VERIFIED') || action.includes('ENABLED')) return 'success';
  if (action.includes('DELETE') || action.includes('FAILED') || action.includes('DISABLED')) return 'error';
  if (action.includes('LOGIN')) return action.includes('FAILED') ? 'error' : 'success';
  return 'info';
};

export default function ActivityLogPage() {
  const { token } = useAuthStore();

  // ============================================
  // State
  // ============================================
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Filters
  const [entityType, setEntityType] = useState('');
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // ============================================
  // Fetch Data
  // ============================================
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });

      if (entityType) params.append('entity_type', entityType);
      
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const res = await fetch(`${API_URL}/audit-log?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Gagal mengambil data');

      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setPagination({
          page: data.meta?.page || 1,
          limit: data.meta?.per_page || 20,
          total: data.meta?.total || 0,
          totalPages: data.meta?.total_pages || 1,
        });
      } else {
        throw new Error(data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  // ============================================
  // Formatters
  // ============================================
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEntityLabel = (type: string) => {
    const found = ENTITY_TYPES.find(t => t.value === type.toUpperCase());
    return found ? found.label : type;
  };

  // ============================================
  // Detail
  // ============================================
  const openDetail = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const renderJson = (data: any) => {
    if (!data) return <span className={styles.emptyJson}>Tidak ada data</span>;
    return (
      <pre className={styles.jsonPre}>
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Activity Log</h1>
            <p className={styles.subtitle}>
              {pagination?.total || 0} total aktivitas
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              style={{ width: 180 }}
            >
              {ENTITY_TYPES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: 150 }}
              placeholder="Dari tanggal"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: 150 }}
              placeholder="Sampai tanggal"
            />
            <Button type="submit">Filter</Button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat activity log..." fullPage />
        ) : error ? (
          <ErrorState
            title="Gagal Memuat Data"
            message={error}
            onRetry={() => fetchLogs()}
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Aksi</th>
                    <th>Entitas</th>
                    <th>ID</th>
                    <th>IP</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        Tidak ada activity log
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className={styles.logRow} onClick={() => openDetail(log)}>
                        <td className={styles.waktu}>{formatDate(log.createdAt)}</td>
                        <td>
                          <Badge color={getActionColor(log.action) as any}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </td>
                        <td>{getEntityLabel(log.entityType)}</td>
                        <td className={styles.entityId}>{log.entityId}</td>
                        <td className={styles.ip}>{log.actorIp || '-'}</td>
                        <td className={styles.actions}>
                          <Button variant="outline" size="sm">
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                disabled={loading}
              />
            )}
          </>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Detail Activity</h2>
                <button onClick={() => setSelectedLog(null)}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detailMeta}>
                  <span><Badge color={getActionColor(selectedLog.action) as any}>{getActionLabel(selectedLog.action)}</Badge></span>
                  <span>{formatDate(selectedLog.createdAt)}</span>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailSection}>
                    <label>Entitas</label>
                    <p>{getEntityLabel(selectedLog.entityType)}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <label>Entity ID</label>
                    <p className={styles.monospace}>{selectedLog.entityId}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <label>Actor ID</label>
                    <p className={styles.monospace}>{selectedLog.actorId || '-'}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <label>IP Address</label>
                    <p>{selectedLog.actorIp || '-'}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <label>Actor Type</label>
                    <p>{selectedLog.actorType || 'USER'}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <label>Reason</label>
                    <p>{selectedLog.reason || '-'}</p>
                  </div>
                </div>

                {selectedLog.beforeData && (
                  <div className={styles.detailSection}>
                    <label>Data Sebelum</label>
                    {renderJson(selectedLog.beforeData)}
                  </div>
                )}

                {selectedLog.afterData && (
                  <div className={styles.detailSection}>
                    <label>Data Sesudah</label>
                    {renderJson(selectedLog.afterData)}
                  </div>
                )}

                {selectedLog.metadata && (
                  <div className={styles.detailSection}>
                    <label>Metadata</label>
                    {renderJson(selectedLog.metadata)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
