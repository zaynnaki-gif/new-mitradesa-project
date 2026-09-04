import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from './BumilPage.module.css';

// ============================================
// Types
// ============================================

interface Bumil {
  id: string;
  pendudukId: string;
  namaLengkap: string;
  nik: string;
  telepon?: string;
  alamat?: string;
  trimester?: number;
  dusun?: string;
  rt?: string;
  rw?: string;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  byTrimester: { trimester: number; count: number }[];
}

interface Penduduk {
  id: string;
  nik: string;
  namaLengkap: string;
}

const TRIMESTER_OPTIONS = [
  { value: '', label: 'Semua Trimester' },
  { value: '1', label: 'Trimester 1' },
  { value: '2', label: 'Trimester 2' },
  { value: '3', label: 'Trimester 3' },
];

const defaultFormData = () => ({
  pendudukId: '',
  namaLengkap: '',
  nik: '',
  telepon: '',
  alamat: '',
  trimester: '1',
  dusun: '',
  rt: '',
  rw: '',
});

export default function BumilPage() {
  const { token } = useAuthStore();

  // ============================================
  // State
  // ============================================
  const [items, setItems] = useState<Bumil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  // Penduduk list for dropdown
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [trimester, setTrimester] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Bumil | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<ReturnType<typeof defaultFormData>>(defaultFormData());

  // ============================================
  // Fetch Helpers
  // ============================================
  const fetchBumil = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (trimester) params.set('trimester', trimester);

    try {
      const data = await safeFetchJson(`${API_URL}/bumil?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setItems(data.data || []);
        setMeta(data.meta);
      } else {
        throw new Error(data.error?.message || data.message || 'Gagal memuat data');
      }
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [token, search, trimester]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await safeFetchJson(`${API_URL}/bumil/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setStats(data.data);
    } catch { /* ignore */ }
  }, [token]);

  const fetchPendudukList = useCallback(async (q = '') => {
    try {
      const params = new URLSearchParams({ search: q, limit: '50' });
      const data = await safeFetchJson(`${API_URL}/penduduk?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setPendudukList(data.data || []);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { fetchBumil(); }, [fetchBumil]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPendudukList(); }, [fetchPendudukList]);

  // ============================================
  // Modal Handlers
  // ============================================
  const openCreate = () => {
    setEditing(null);
    setFormData(defaultFormData());
    setShowModal(true);
  };

  const openEdit = (item: Bumil) => {
    setEditing(item);
    setFormData({
      pendudukId: item.pendudukId,
      namaLengkap: item.namaLengkap,
      nik: item.nik,
      telepon: item.telepon || '',
      alamat: item.alamat || '',
      trimester: String(item.trimester || 1),
      dusun: item.dusun || '',
      rt: item.rt || '',
      rw: item.rw || '',
    });
    setShowModal(true);
  };

  // ============================================
  // CRUD
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const payload: Record<string, unknown> = {
      pendudukId: formData.pendudukId,
      namaLengkap: formData.namaLengkap,
      nik: formData.nik,
      telepon: formData.telepon || undefined,
      alamat: formData.alamat || undefined,
      trimester: parseInt(formData.trimester) || 1,
      dusun: formData.dusun || undefined,
      rt: formData.rt || undefined,
      rw: formData.rw || undefined,
    };

    try {
      const url = editing
        ? `${API_URL}/bumil/${editing.id}`
        : `${API_URL}/bumil`;
      const method = editing ? 'PATCH' : 'POST';

      const data = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setShowModal(false);
        fetchBumil(meta?.page || 1);
        fetchStats();
      } else {
        alert(data.error?.message || data.message || 'Terjadi kesalahan');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (item: Bumil) => {
    if (!confirm(`Hapus data "${item.namaLengkap}" (NIK: ${maskNik(item.nik)})?`)) return;

    try {
      const data = await safeFetchJson(`${API_URL}/bumil/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        fetchBumil(meta?.page || 1);
        fetchStats();
      } else {
        alert(data.error?.message || data.message || 'Gagal hapus');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  // ============================================
  // Helpers
  // ============================================

  const getTrimesterLabel = (t?: number) => {
    if (!t) return '—';
    return `T${t}`;
  };

  const getTrimesterBadgeColor = (t?: number): "primary" | "secondary" | "error" | "success" | "muted" => {
    switch (t) {
      case 1: return 'primary';
      case 2: return 'secondary';
      case 3: return 'primary';
      default: return 'muted';
    }
  };

  const resetFilters = () => {
    setSearch('');
    setTrimester('');
  };

  // ============================================
  // Render
  // ============================================
  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Data Ibu Hamil (Bumil)</h1>
            <p className={styles.subtitle}>
              {meta?.total || 0} total ibu hamil terdaftar
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="primary" onClick={openCreate}>
              + Tambah Bumil
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.total}</span>
              <span className={styles.statLabel}>Total Bumil</span>
            </div>
            {stats.byTrimester.map(s => (
              <div key={s.trimester} className={styles.statCard}>
                <span className={styles.statNumber}>{s.count}</span>
                <span className={styles.statLabel}>Trimester {s.trimester}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <Input
              placeholder="Cari nama atau NIK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <Select
              value={trimester}
              onChange={e => setTrimester(e.target.value)}
              style={{ width: 160 }}
            >
              {TRIMESTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Button onClick={() => fetchBumil(1)}>Cari</Button>
            <Button variant="outline" onClick={resetFilters}>Reset</Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data ibu hamil..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => fetchBumil()} />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Nama Lengkap</th>
                    <th>NIK</th>
                    <th>Telepon</th>
                    <th>Alamat</th>
                    <th>Trimester</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        Belum ada data ibu hamil.{' '}
                        <Button size="sm" variant="outline" onClick={openCreate}>+ Tambah</Button>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{((meta?.page || 1) - 1) * (meta?.limit || 20) + index + 1}</td>
                        <td className={styles.nama}>{item.namaLengkap}</td>
                        <td className={styles.nik}>{maskNik(item.nik)}</td>
                        <td>{item.telepon || '—'}</td>
                        <td className={styles.alamat}>
                          {[item.dusun, item.rt && `RT ${item.rt}`, item.rw && `RW ${item.rw}`]
                            .filter(Boolean)
                            .join(', ') || item.alamat || '—'}
                        </td>
                        <td>
                          <Badge color={getTrimesterBadgeColor(item.trimester)}>
                            {getTrimesterLabel(item.trimester)}
                          </Badge>
                        </td>
                        <td className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                          >Hapus</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={fetchBumil}
                disabled={loading}
              />
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editing ? 'Edit Ibu Hamil' : 'Tambah Ibu Hamil'}</h2>
                <button onClick={() => setShowModal(false)} aria-label="Tutup">&times;</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Data Penduduk */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Data Penduduk</h3>
                  <div className={styles.formGrid}>
                    <Select
                      label="Pilih Penduduk *"
                      value={formData.pendudukId}
                      onChange={e => {
                        const selected = pendudukList.find(p => p.id === e.target.value);
                        setFormData(f => ({
                          ...f,
                          pendudukId: e.target.value,
                          namaLengkap: selected?.namaLengkap || '',
                          nik: selected?.nik || '',
                        }));
                      }}
                      required
                    >
                      <option value="">Pilih Penduduk</option>
                      {pendudukList.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.namaLengkap} — NIK: {p.nik}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Nama Lengkap *"
                      value={formData.namaLengkap}
                      onChange={e => setFormData(f => ({ ...f, namaLengkap: e.target.value }))}
                      required
                    />
                    <Input
                      label="NIK *"
                      value={formData.nik}
                      onChange={e => setFormData(f => ({ ...f, nik: e.target.value }))}
                      maxLength={16}
                      required
                      placeholder="16 digit NIK"
                    />
                    <Input
                      label="No. Telepon"
                      value={formData.telepon}
                      onChange={e => setFormData(f => ({ ...f, telepon: e.target.value }))}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>

                {/* Data Kehamilan */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Data Kehamilan</h3>
                  <div className={styles.formGrid}>
                    <Select
                      label="Trimester"
                      value={formData.trimester}
                      onChange={e => setFormData(f => ({ ...f, trimester: e.target.value }))}
                    >
                      <option value="1">Trimester 1 (Minggu 1-12)</option>
                      <option value="2">Trimester 2 (Minggu 13-26)</option>
                      <option value="3">Trimester 3 (Minggu 27-40)</option>
                    </Select>
                  </div>
                </div>

                {/* Alamat */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Alamat</h3>
                  <div className={styles.formGrid}>
                    <Input
                      label="Dusun"
                      value={formData.dusun}
                      onChange={e => setFormData(f => ({ ...f, dusun: e.target.value }))}
                      placeholder="Nama dusun"
                    />
                    <Input
                      label="RT"
                      value={formData.rt}
                      onChange={e => setFormData(f => ({ ...f, rt: e.target.value }))}
                      placeholder="001"
                    />
                    <Input
                      label="RW"
                      value={formData.rw}
                      onChange={e => setFormData(f => ({ ...f, rw: e.target.value }))}
                      placeholder="001"
                    />
                    <div className={styles.fullWidth}>
                      <Input
                        label="Alamat Lengkap"
                        value={formData.alamat}
                        onChange={e => setFormData(f => ({ ...f, alamat: e.target.value }))}
                        placeholder="Alamat lengkap"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.formActions}>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Utility
function maskNik(nik: string): string {
  if (nik.length === 16) return `${nik.slice(0, 6)}xxxxxx${nik.slice(-4)}`;
  return nik;
}
