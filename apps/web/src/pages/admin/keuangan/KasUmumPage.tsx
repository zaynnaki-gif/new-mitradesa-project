import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './KasUmumPage.module.css';

interface KasUmumEntry {
  id: string;
  tanggal: string;
  jenis: 'KAS_MASUK' | 'KAS_KELUAR';
  uraian: string;
  jumlah: number;
  saldo: number;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}



const JENIS_OPTIONS = [
  { value: 'KAS_MASUK', label: 'Kas Masuk' },
  { value: 'KAS_KELUAR', label: 'Kas Keluar' },
];

export default function KasUmumPage() {
  const { token } = useAuthStore();

  const [entries, setEntries] = useState<KasUmumEntry[]>([]);
  const [saldo, setSaldo] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Filters
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [bulan, setBulan] = useState('');
  const [jenis, setJenis] = useState('');

  // Modal form
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KasUmumEntry | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'KAS_MASUK' as 'KAS_MASUK' | 'KAS_KELUAR',
    uraian: '',
    jumlah: '',
  });

  const fetchEntries = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      tahun,
      ...(bulan && { bulan }),
      ...(jenis && { jenis }),
    });

    try {
      const res = await fetch(`${API_URL}/kas-umum?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEntries(data.data || []);
        setMeta(data.meta);
      } else {
        throw new Error(data.error?.message || 'Gagal memuat data');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [token, tahun, bulan, jenis]);

  const fetchSaldo = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/kas-umum/saldo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSaldo(data.data.saldo || 0);
      }
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchEntries(1);
    fetchSaldo();
  }, [fetchEntries, fetchSaldo]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      jenis: 'KAS_MASUK',
      uraian: '',
      jumlah: '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (entry: KasUmumEntry) => {
    setEditing(entry);
    setFormData({
      tanggal: entry.tanggal.split('T')[0],
      jenis: entry.jenis,
      uraian: entry.uraian,
      jumlah: String(entry.jumlah),
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraian || !formData.jumlah) return;
    setFormLoading(true);
    setFormError(null);

    const url = editing
      ? `${API_URL}/kas-umum/${editing.id}`
      : `${API_URL}/kas-umum`;
    const method = editing ? 'PATCH' : 'POST';
    const body = {
      tanggal: formData.tanggal,
      jenis: formData.jenis,
      uraian: formData.uraian,
      jumlah: parseFloat(formData.jumlah),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchEntries(meta?.page || 1);
        fetchSaldo();
      } else {
        setFormError(data.error?.message || 'Terjadi kesalahan');
      }
    } catch { setFormError('Terjadi kesalahan'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus entri ini?')) return;
    try {
      const res = await fetch(`${API_URL}/kas-umum/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchEntries(meta?.page || 1);
        fetchSaldo();
      } else {
        alert(data.error?.message || 'Gagal hapus');
      }
    } catch { alert('Terjadi kesalahan'); }
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const months = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
    { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Kas Umum</h1>
            <p className={styles.subtitle}>Buku kas umum desa</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.saldoCard}>
              <span className={styles.saldoLabel}>Saldo Kas</span>
              <span className={saldo >= 0 ? styles.saldoValue : styles.saldoNegative}>
                {formatRupiah(saldo)}
              </span>
            </div>
            <Button onClick={openCreate}>+ Tambah Entri</Button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={tahun}
            onChange={e => { setTahun(e.target.value); }}
          >
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={bulan}
            onChange={e => setBulan(e.target.value)}
          >
            <option value="">Semua Bulan</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={jenis}
            onChange={e => setJenis(e.target.value)}
          >
            <option value="">Semua Jenis</option>
            {JENIS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => fetchEntries(1)}>Filter</Button>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal" message={error} onRetry={() => fetchEntries()} />
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Tanggal</th>
                    <th className={styles.th}>Jenis</th>
                    <th className={styles.th}>Uraian</th>
                    <th className={`${styles.th} ${styles.thRight}`}>Jumlah</th>
                    <th className={`${styles.th} ${styles.thRight}`}>Saldo</th>
                    <th className={`${styles.th} ${styles.thCenter}`}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        Belum ada data kas umum untuk periode ini.
                      </td>
                    </tr>
                  ) : entries.map(entry => (
                    <tr key={entry.id} className={styles.tr}>
                      <td className={styles.td}>{formatDate(entry.tanggal)}</td>
                      <td className={styles.td}>
                        <span className={`${styles.jenisBadge} ${entry.jenis === 'KAS_MASUK' ? styles.badgeMasuk : styles.badgeKeluar}`}>
                          {entry.jenis === 'KAS_MASUK' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className={styles.td}>{entry.uraian}</td>
                      <td className={`${styles.td} ${styles.tdRight}`}
                        style={{ color: entry.jenis === 'KAS_MASUK' ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {entry.jenis === 'KAS_MASUK' ? '+' : '-'}
                        {formatRupiah(entry.jumlah)}
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        {formatRupiah(entry.saldo)}
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>
                        <div className={styles.actions}>
                          <Button size="sm" variant="outline" onClick={() => openEdit(entry)}>Edit</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(entry.id)}
                            className={styles.btnHapus}
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  size="sm" variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() => fetchEntries(meta.page - 1)}
                >
                  ← Prev
                </Button>
                <span className={styles.pageInfo}>
                  Halaman {meta.page} / {meta.totalPages}
                </span>
                <Button
                  size="sm" variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchEntries(meta.page + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editing ? 'Edit Entri Kas Umum' : 'Tambah Entri Kas Umum'}
        >
          <form onSubmit={handleSubmit} className={styles.form}>
            {formError && (
              <div className={styles.formError}>{formError}</div>
            )}
            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Tanggal *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.tanggal}
                  onChange={e => setFormData(f => ({ ...f, tanggal: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Jenis *</label>
                <select
                  className={styles.input}
                  value={formData.jenis}
                  onChange={e => setFormData(f => ({ ...f, jenis: e.target.value as 'KAS_MASUK' | 'KAS_KELUAR' }))}
                  required
                >
                  {JENIS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={styles.label}>Uraian *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.uraian}
                onChange={e => setFormData(f => ({ ...f, uraian: e.target.value }))}
                placeholder="Contoh: Penerimaan pajak daerah"
                required
              />
            </div>
            <div>
              <label className={styles.label}>Jumlah (Rp) *</label>
              <input
                type="number"
                className={styles.input}
                value={formData.jumlah}
                onChange={e => setFormData(f => ({ ...f, jumlah: e.target.value }))}
                min="0"
                step="1"
                placeholder="0"
                required
              />
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
