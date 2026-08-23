import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './SaranPage.module.css';

// ============================================
// Types
// ============================================

interface SaranAduan {
  id: string;
  judul: string;
  isi: string;
  kategori: 'SARAN' | 'ADUAN' | 'ASPIRASI';
  status: 'BARU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';
  namaPengirim?: string;
  emailPengirim?: string;
  teleponPengirim?: string;
  jawaban?: string;
  dijawabOleh?: string;
  dijawabPada?: string;
  createdAt: string;
  updatedAt: string;
}

interface SaranStats {
  total: number;
  baru: number;
  diproses: number;
  selesai: number;
  ditolak: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'SARAN', label: 'Saran' },
  { value: 'ADUAN', label: 'Aduan' },
  { value: 'ASPIRASI', label: 'Aspirasi' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'BARU', label: 'Baru' },
  { value: 'DIPROSES', label: 'Diproses' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DITOLAK', label: 'Ditolak' },
];

const STATUS_COLOR: Record<string, string> = {
  BARU: 'warning',
  DIPROSES: 'info',
  SELESAI: 'success',
  DITOLAK: 'error',
};

const KATEGORI_LABEL: Record<string, string> = {
  SARAN: 'Saran',
  ADUAN: 'Aduan',
  ASPIRASI: 'Aspirasi',
};

export default function SaranPage() {
  const { token } = useAuthStore();

  // ============================================
  // State
  // ============================================
  const [items, setItems] = useState<SaranAduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<SaranStats | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [status, setStatus] = useState('');

  // Detail modal
  const [selectedItem, setSelectedItem] = useState<SaranAduan | null>(null);
  const [replyText, setReplyText] = useState('');

  // ============================================
  // Fetch Data
  // ============================================
  const fetchData = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (kategori) params.append('kategori', kategori);
      if (status) params.append('status', status);

      const res = await fetch(`${API_URL}/saran-aduan?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Gagal mengambil data');

      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
        setPagination(data.meta || null);
      } else {
        throw new Error(data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/saran-aduan/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchStats();
    }
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1);
  };

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  // ============================================
  // Detail / Reply Handlers
  // ============================================
  const openDetail = (item: SaranAduan) => {
    setSelectedItem(item);
    setReplyText(item.jawaban || '');
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setReplyText('');
  };

  const handleReply = async (newStatus?: SaranAduan['status']) => {
    if (!selectedItem) return;

    try {
      const res = await fetch(`${API_URL}/saran-aduan/${selectedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jawaban: replyText,
          status: newStatus || selectedItem.status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        closeDetail();
        fetchData(pagination?.page || 1);
        fetchStats();
      } else {
        alert(data.message || 'Gagal menyimpan');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus saran/aduan ini?')) return;

    try {
      const res = await fetch(`${API_URL}/saran-aduan/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchData(pagination?.page || 1);
        fetchStats();
      } else {
        alert('Gagal menghapus');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Saran & Aduan</h1>
            <p className={styles.subtitle}>
              {pagination?.total || 0} total masuk
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Baru</span>
              <span className={`${styles.statValue} ${styles.warning}`}>{stats.baru}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Diproses</span>
              <span className={`${styles.statValue} ${styles.info}`}>{stats.diproses}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Selesai</span>
              <span className={`${styles.statValue} ${styles.success}`}>{stats.selesai}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Ditolak</span>
              <span className={`${styles.statValue} ${styles.error}`}>{stats.ditolak}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Cari judul, isi, nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              style={{ width: 160 }}
            >
              {KATEGORI_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: 160 }}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Button type="submit">Cari</Button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data saran..." fullPage />
        ) : error ? (
          <ErrorState
            title="Gagal Memuat Data"
            message={error}
            onRetry={() => fetchData()}
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Kategori</th>
                    <th>Judul</th>
                    <th>Pengirim</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        Tidak ada saran atau aduan
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>{formatDate(item.createdAt)}</td>
                        <td><Badge>{KATEGORI_LABEL[item.kategori] || item.kategori}</Badge></td>
                        <td className={styles.judul}>{item.judul}</td>
                        <td className={styles.pengirim}>
                          <div>{item.namaPengirim || 'Anonim'}</div>
                          {item.emailPengirim && <small>{item.emailPengirim}</small>}
                        </td>
                        <td>
                          <Badge color={STATUS_COLOR[item.status] as any}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openDetail(item)}>
                            Detail
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
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
        {selectedItem && (
          <div className={styles.modalOverlay} onClick={closeDetail}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Detail Saran/Aduan</h2>
                <button onClick={closeDetail}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detailMeta}>
                  <span><Badge>{KATEGORI_LABEL[selectedItem.kategori] || selectedItem.kategori}</Badge></span>
                  <span><Badge color={STATUS_COLOR[selectedItem.status] as any}>{selectedItem.status}</Badge></span>
                  <span>{formatDate(selectedItem.createdAt)}</span>
                </div>

                <div className={styles.detailSection}>
                  <label>Judul</label>
                  <p className={styles.detailTitle}>{selectedItem.judul}</p>
                </div>

                <div className={styles.detailSection}>
                  <label>Isi</label>
                  <p className={styles.detailContent}>{selectedItem.isi}</p>
                </div>

                <div className={styles.detailSection}>
                  <label>Pengirim</label>
                  <p>{selectedItem.namaPengirim || 'Anonim'}</p>
                  {selectedItem.emailPengirim && <p className={styles.small}>{selectedItem.emailPengirim}</p>}
                  {selectedItem.teleponPengirim && <p className={styles.small}>{selectedItem.teleponPengirim}</p>}
                </div>

                {selectedItem.jawaban && (
                  <div className={`${styles.detailSection} ${styles.jawabanSection}`}>
                    <label>Jawaban / Tanggapan</label>
                    <p className={styles.detailContent}>{selectedItem.jawaban}</p>
                    {selectedItem.dijawabPada && (
                      <small className={styles.small}>
                        Dijawab pada: {formatDate(selectedItem.dijawabPada)}
                      </small>
                    )}
                  </div>
                )}

                <div className={styles.replySection}>
                  <label>Jawaban / Update Status</label>
                  <textarea
                    className={styles.textarea}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tulis jawaban atau tanggapan..."
                    rows={4}
                  />
                  <div className={styles.statusButtons}>
                    <Select
                      value={selectedItem.status}
                      onChange={(e) => {
                        setSelectedItem({ ...selectedItem, status: e.target.value as SaranAduan['status'] });
                      }}
                      style={{ width: 150 }}
                    >
                      <option value="BARU">Baru</option>
                      <option value="DIPROSES">Diproses</option>
                      <option value="SELESAI">Selesai</option>
                      <option value="DITOLAK">Ditolak</option>
                    </Select>
                    <Button onClick={() => handleReply()}>Simpan</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
