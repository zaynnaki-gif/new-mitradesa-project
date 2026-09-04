import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from './PerangkatDesaPage.module.css';

interface PerangkatDesa {
  id: string;
  pendudukId: string;
  pendudukNik: string;
  pendudukNama: string;
  desaId: string;
  desaNama: string;
  jabatan: string;
  status: string;
  fotoUrl: string | null;
  accountId: string | null;
  accountUsername: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isAktif: boolean;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const JABATAN_OPTIONS = [
  { value: 'KEPALA_DESA', label: 'Kepala Desa' },
  { value: 'SEKRETARIS', label: 'Sekretaris Desa' },
  { value: 'KAUR', label: 'Kaur (Kepala Urusan)' },
  { value: 'KASI', label: 'Kasi (Kepala Seksi)' },
  { value: 'RT', label: 'RT' },
  { value: 'RW', label: 'RW' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const STATUS_OPTIONS = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'NONAKTIF', label: 'Nonaktif' },
];

export default function PerangkatDesaPage() {
  const { token } = useAuthStore();

  const [items, setItems] = useState<PerangkatDesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PerangkatDesa | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ jabatan: '', status: 'AKTIF' });

  // Penduduk search for linking
  const [pendudukSearch, setPendudukSearch] = useState('');
  const [selectedPenduduk, setSelectedPenduduk] = useState<{ id: string; nik: string; namaLengkap: string } | null>(null);
  const [pendudukLoading, setPendudukLoading] = useState(false);
  const [pendudukList, setPendudukList] = useState<{ id: string; nik: string; namaLengkap: string }[]>([]);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);

    try {
      const data = await safeFetchJson(`${API_URL}/perangkat-desa?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setItems(data.data || []);
        setMeta(data.meta);
      } else {
        throw new Error(data.error?.message || 'Gagal memuat data');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, search, status]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Search penduduk for linking
  useEffect(() => {
    if (!pendudukSearch || pendudukSearch.length < 3) {
      setPendudukList([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPendudukLoading(true);
      try {
        const data = await safeFetchJson(`${API_URL}/penduduk?search=${encodeURIComponent(pendudukSearch)}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPendudukList(data.data.map((p: any) => ({ id: p.id, nik: p.nik, namaLengkap: p.namaLengkap })));
        }
      } catch { /* ignore */ }
      finally { setPendudukLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [pendudukSearch, token]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ jabatan: '', status: 'AKTIF' });
    setSelectedPenduduk(null);
    setPendudukSearch('');
    setPendudukList([]);
    setShowModal(true);
  };

  const openEdit = (item: PerangkatDesa) => {
    setEditing(item);
    setFormData({ jabatan: item.jabatan, status: item.status });
    setSelectedPenduduk(null);
    setPendudukSearch('');
    setPendudukList([]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!editing && !selectedPenduduk) {
      alert('Pilih penduduk terlebih dahulu');
      return;
    }
    if (!formData.jabatan) {
      alert('Jabatan wajib diisi');
      return;
    }

    setFormLoading(true);
    try {
      const url = editing
        ? `${API_URL}/perangkat-desa/${editing.id}`
        : `${API_URL}/perangkat-desa`;
      const method = editing ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { ...formData };
      if (!editing && selectedPenduduk) body.pendudukId = selectedPenduduk.id;

      const data = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (data.success) {
        setShowModal(false);
        fetchItems(meta?.page || 1);
      } else {
        alert(data.error?.message || data.message || 'Terjadi kesalahan');
      }
    } catch (err: any) { alert(err.message || 'Terjadi kesalahan'); } // eslint-disable-line @typescript-eslint/no-explicit-any
    finally { setFormLoading(false); }
  };

  const handleDelete = async (item: PerangkatDesa) => {
    if (!confirm(`Hapus perangkat "${item.pendudukNama}" (${item.jabatan})?`)) return;
    try {
      const data = await safeFetchJson(`${API_URL}/perangkat-desa/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) fetchItems(meta?.page || 1);
      else alert(data.error?.message || 'Gagal hapus');
    } catch (err: any) { alert(err.message || 'Terjadi kesalahan'); } // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Perangkat Desa</h1>
            <p className={styles.subtitle}>{meta?.total || 0} total perangkat desa</p>
          </div>
          <Button onClick={openCreate}>+ Tambah Perangkat</Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <input
              type="text"
              placeholder="Cari NIK atau nama..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchItems(1)}
              className={styles.filterInput}
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.875rem', minWidth: '200px' }}
            />
            <Select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Button onClick={() => fetchItems(1)}>Cari</Button>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus(''); fetchItems(1); }}>Reset</Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => fetchItems()} />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>Jabatan</th>
                    <th>Status</th>
                    <th>Daftar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        Belum ada data.{' '}
                        <Button size="sm" variant="outline" onClick={openCreate}>+ Tambah</Button>
                      </td>
                    </tr>
                  ) : items.map(item => (
                    <tr key={item.id}>
                      <td className={styles.nik}>{item.pendudukNik}</td>
                      <td>{item.pendudukNama}</td>
                      <td><Badge color="primary">{item.jabatan}</Badge></td>
                      <td>
                        <Badge color={item.status === 'AKTIF' ? 'success' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={fetchItems}
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
                <h2>{editing ? 'Edit Perangkat Desa' : 'Tambah Perangkat Desa'}</h2>
                <button onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                {!editing && (
                  <>
                    <div className={styles.formGrid}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                          Penduduk *
                        </label>
                        <input
                          type="text"
                          placeholder="Ketik nama atau NIK untuk mencari..."
                          value={pendudukSearch}
                          onChange={e => {
                            setPendudukSearch(e.target.value);
                            setSelectedPenduduk(null);
                          }}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                        />
                        {pendudukLoading && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>Mencari...</p>}
                        {pendudukList.length > 0 && !selectedPenduduk && (
                          <ul style={{ listStyle: 'none', margin: '0.25rem 0 0', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', background: 'white', maxHeight: '150px', overflowY: 'auto' }}>
                            {pendudukList.map(p => (
                              <li key={p.id} style={{ padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => { setSelectedPenduduk(p); setPendudukSearch(p.namaLengkap); setPendudukList([]); }}>
                                {p.namaLengkap} — NIK: {p.nik}
                              </li>
                            ))}
                          </ul>
                        )}
                        {selectedPenduduk && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-success)', margin: '0.25rem 0 0' }}>
                            ✓ Dipilih: {selectedPenduduk.namaLengkap} (NIK: {selectedPenduduk.nik})
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.formGrid}>
                  <Select
                    label="Jabatan *"
                    value={formData.jabatan}
                    onChange={e => setFormData(f => ({ ...f, jabatan: e.target.value }))}
                    required
                  >
                    <option value="">Pilih Jabatan</option>
                    {JABATAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <Select
                    label="Status *"
                    value={formData.status}
                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                    required
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>

                <div className={styles.formActions}>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
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
