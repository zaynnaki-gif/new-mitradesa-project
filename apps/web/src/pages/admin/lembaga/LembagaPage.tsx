import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select, Modal } from '../../../components/ui';
import { ErrorState, LoadingState } from '../../../components/states';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '../../../stores/auth.store';
import { API_URL } from '../../../lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from './LembagaPage.module.css';

interface Lembaga {
  id: string;
  jenis: string;
  nama: string;
  deskripsi?: string;
  status: string;
  createdAt: string;
}

interface PaginationMeta { page: number; limit: number; total: number; totalPages: number }

const JENIS_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'BPD', label: 'BPD' },
  { value: 'PKK', label: 'PKK' },
  { value: 'KADER', label: 'KADER' },
  { value: 'RT', label: 'RT' },
  { value: 'RW', label: 'RW' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export default function LembagaPage() {
  const { token } = useAuthStore();

  const [items, setItems] = useState<Lembaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Filters
  const [jenis, setJenis] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lembaga | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ jenis: '', nama: '', deskripsi: '' });

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (jenis) params.set('jenis', jenis);
    if (search) params.set('search', search);
    if (status) params.set('status', status);

    try {
      const data = await safeFetchJson(`${API_URL}/lembaga?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setItems(data.data || []);
        setMeta(data.meta);
      } else {
        throw new Error(data.error?.message || 'Gagal memuat');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, jenis, search, status]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setEditing(null); setFormData({ jenis: '', nama: '', deskripsi: '' }); setShowModal(true); };
  const openEdit = (item: Lembaga) => {
    setEditing(item);
    setFormData({ jenis: item.jenis, nama: item.nama, deskripsi: item.deskripsi || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const url = editing ? `${API_URL}/lembaga/${editing.id}` : `${API_URL}/lembaga`;
    const method = editing ? 'PATCH' : 'POST';
    try {
      const data = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (data.success) { setShowModal(false); fetchItems(meta?.page || 1); }
      else alert(data.error?.message || 'Terjadi kesalahan');
    } catch (err: any) { alert(err.message || 'Terjadi kesalahan'); } // eslint-disable-line @typescript-eslint/no-explicit-any
    finally { setFormLoading(false); }
  };

  const handleDelete = async (item: Lembaga) => {
    if (!confirm(`Hapus "${item.nama}"?`)) return;
    try {
      const data = await safeFetchJson(`${API_URL}/lembaga/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (data.success) fetchItems(meta?.page || 1);
      else alert(data.error?.message || 'Gagal hapus');
    } catch (err: any) { alert(err.message || 'Terjadi kesalahan'); } // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Organisasi & Lembaga</h1>
            <p className={styles.subtitle}>{meta?.total || 0} total lembaga</p>
          </div>
          <Button onClick={openCreate}>+ Tambah</Button>
        </div>

        <div className={styles.filters}>
          <Select value={jenis} onChange={e => setJenis(e.target.value)} options={JENIS_OPTIONS} style={{ width: 160 }} />
          <Input placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[{ value: '', label: 'Semua Status' }, { value: 'AKTIF', label: 'Aktif' }, { value: 'NONAKTIF', label: 'Nonaktif' }]}
            style={{ width: 140 }}
          />
          <Button onClick={() => fetchItems(1)}>Cari</Button>
        </div>

        {loading ? (
          <LoadingState message="Memuat..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal" message={error} onRetry={() => fetchItems()} />
        ) : (
          <>
            <div className={styles.list}>
              {items.length === 0 ? (
                <p className={styles.empty}>Belum ada data. <Button size="sm" onClick={openCreate}>+ Tambah</Button></p>
              ) : (
                items.map(item => (
                  <div key={item.id} className={styles.card}>
                    <div className={styles.cardBody}>
                      <div className={styles.cardLeft}>
                        <span className={styles.jenisBadge}>{item.jenis}</span>
                        <h3 className={styles.cardTitle}>{item.nama}</h3>
                        {item.deskripsi && <p className={styles.cardDesc}>{item.deskripsi}</p>}
                      </div>
                      <div className={styles.cardRight}>
                        <span className={`${styles.statusBadge} ${item.status === 'AKTIF' ? styles.aktif : styles.nonaktif}`}>
                          {item.status}
                        </span>
                        <div className={styles.cardActions}>
                          <Button size="sm" variant="outline" onClick={() => openEdit(item)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item)} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>Hapus</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className={styles.pagination}>
                <Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => fetchItems(meta.page - 1)}>← Prev</Button>
                <span>Halaman {meta.page} / {meta.totalPages}</span>
                <Button size="sm" variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => fetchItems(meta.page + 1)}>Next →</Button>
              </div>
            )}
          </>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Lembaga' : 'Tambah Lembaga'}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Select
              label="Jenis"
              value={formData.jenis}
              onChange={e => setFormData(f => ({ ...f, jenis: e.target.value }))}
              options={JENIS_OPTIONS.filter(o => o.value)}
              required
            />
            <Input label="Nama" value={formData.nama} onChange={e => setFormData(f => ({ ...f, nama: e.target.value }))} required placeholder="Nama lengkap" />
            <Input label="Deskripsi" value={formData.deskripsi} onChange={e => setFormData(f => ({ ...f, deskripsi: e.target.value }))} />
            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
