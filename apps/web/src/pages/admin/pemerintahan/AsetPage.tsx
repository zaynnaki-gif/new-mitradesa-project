import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import { useConfirm } from '@/hooks/useConfirm';
import shared from '@/styles/AdminShared.module.css';

interface AsetDesaEntry {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string;
  tahunPerolehan: number;
  harga: number;
  kondisi: string;
  asalUsul: string;
  keterangan: string | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AsetPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();

  const [entries, setEntries] = useState<AsetDesaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const [search, setSearch] = useState('');

  // Modal form
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AsetDesaEntry | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kodeBarang: '',
    namaBarang: '',
    kategori: 'TANAH',
    tahunPerolehan: new Date().getFullYear().toString(),
    harga: '0',
    kondisi: 'BAIK',
    asalUsul: 'Beli',
    keterangan: '',
  });

  const fetchEntries = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(search && { search }),
    });

    try {
      const data = await safeFetchJson(`${API_URL}/pemerintahan/aset?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
  }, [token, search]);

  useEffect(() => {
    fetchEntries(1);
  }, [fetchEntries]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      kodeBarang: '',
      namaBarang: '',
      kategori: 'TANAH',
      tahunPerolehan: new Date().getFullYear().toString(),
      harga: '0',
      kondisi: 'BAIK',
      asalUsul: 'Beli',
      keterangan: '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (entry: AsetDesaEntry) => {
    setEditing(entry);
    setFormData({
      kodeBarang: entry.kodeBarang,
      namaBarang: entry.namaBarang,
      kategori: entry.kategori,
      tahunPerolehan: String(entry.tahunPerolehan),
      harga: String(entry.harga),
      kondisi: entry.kondisi,
      asalUsul: entry.asalUsul,
      keterangan: entry.keterangan || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeBarang || !formData.namaBarang) return;
    setFormLoading(true);
    setFormError(null);

    const url = editing
      ? `${API_URL}/pemerintahan/aset/${editing.id}`
      : `${API_URL}/pemerintahan/aset`;
    const method = editing ? 'PATCH' : 'POST';
    const body = {
      kodeBarang: formData.kodeBarang,
      namaBarang: formData.namaBarang,
      kategori: formData.kategori,
      tahunPerolehan: parseInt(formData.tahunPerolehan) || new Date().getFullYear(),
      harga: parseFloat(formData.harga) || 0,
      kondisi: formData.kondisi,
      asalUsul: formData.asalUsul,
      keterangan: formData.keterangan,
    };

    try {
      const data = await safeFetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (data.success) {
        setShowModal(false);
        fetchEntries(meta?.page || 1);
      } else {
        throw new Error(data.error?.message || 'Gagal menyimpan data');
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Hapus aset ini?', message: 'Data yang dihapus tidak dapat dikembalikan.' })) return;

    try {
      const data = await safeFetchJson(`${API_URL}/pemerintahan/aset/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        fetchEntries(meta?.page || 1);
      } else {
        alert(data.error?.message || 'Gagal menghapus data');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Manajemen Aset Desa</h1>
          <p className={shared.pageDescription}>Kelola inventaris dan kekayaan milik desa</p>
        </div>
        <Button onClick={openCreate}>Tambah Aset</Button>
      </div>

      <div className={shared.filterBar}>
        <input 
          type="search" 
          placeholder="Cari nama atau kode aset..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={shared.input}
          style={{ width: '300px' }}
        />
      </div>

      <div className={shared.card}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchEntries(1)} />
        ) : (
          <div className={shared.tableWrapper}>
            <table className={shared.table}>
              <thead>
                <tr>
                  <th>Kode Barang</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>Tahun</th>
                  <th>Harga</th>
                  <th>Kondisi</th>
                  <th>Asal Usul</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={shared.textCenter} style={{ padding: '2rem' }}>Belum ada data aset desa</td>
                  </tr>
                ) : (
                  entries.map(entry => (
                    <tr key={entry.id}>
                      <td><strong>{entry.kodeBarang}</strong></td>
                      <td>{entry.namaBarang}</td>
                      <td>{entry.kategori}</td>
                      <td>{entry.tahunPerolehan}</td>
                      <td>{formatCurrency(entry.harga)}</td>
                      <td>
                        <span className={shared.badge} data-variant={entry.kondisi === 'BAIK' ? 'success' : entry.kondisi === 'RUSAK_RINGAN' ? 'warning' : 'danger'}>
                          {entry.kondisi}
                        </span>
                      </td>
                      <td>{entry.asalUsul}</td>
                      <td>
                        <div className={shared.actionButtons}>
                          <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(entry.id)} style={{ color: 'var(--color-error)' }}>Hapus</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {meta && meta.totalPages > 1 && (
          <div className={shared.pagination}>
            <Button 
              variant="outline" 
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => fetchEntries(meta.page - 1)}
            >
              Sebelumnya
            </Button>
            <span>Halaman {meta.page} dari {meta.totalPages}</span>
            <Button 
              variant="outline" 
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchEntries(meta.page + 1)}
            >
              Berikutnya
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !formLoading && setShowModal(false)}
        title={editing ? 'Edit Aset' : 'Tambah Aset'}
      >
        <form onSubmit={handleSubmit} className={shared.formGrid}>
          {formError && <div className={shared.errorMessage}>{formError}</div>}
          
          <div className={shared.formGroup}>
            <label>Kode Barang</label>
            <input 
              type="text"
              className={shared.input}
              value={formData.kodeBarang}
              onChange={e => setFormData({ ...formData, kodeBarang: e.target.value })}
              required
            />
          </div>

          <div className={shared.formGroup}>
            <label>Nama Barang</label>
            <input 
              type="text"
              className={shared.input}
              value={formData.namaBarang}
              onChange={e => setFormData({ ...formData, namaBarang: e.target.value })}
              required
            />
          </div>

          <div className={shared.formGroup}>
            <label>Kategori</label>
            <select 
              className={shared.input}
              value={formData.kategori}
              onChange={e => setFormData({ ...formData, kategori: e.target.value })}
            >
              <option value="TANAH">Tanah</option>
              <option value="GEDUNG">Gedung / Bangunan</option>
              <option value="PERALATAN">Peralatan / Kendaraan</option>
              <option value="JALAN">Jalan / Jaringan</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div className={shared.formGroup}>
            <label>Tahun Perolehan</label>
            <input 
              type="number"
              min="1900"
              max="2100"
              className={shared.input}
              value={formData.tahunPerolehan}
              onChange={e => setFormData({ ...formData, tahunPerolehan: e.target.value })}
              required
            />
          </div>

          <div className={shared.formGroup}>
            <label>Kondisi</label>
            <select 
              className={shared.input}
              value={formData.kondisi}
              onChange={e => setFormData({ ...formData, kondisi: e.target.value })}
            >
              <option value="BAIK">Baik</option>
              <option value="RUSAK_RINGAN">Rusak Ringan</option>
              <option value="RUSAK_BERAT">Rusak Berat</option>
            </select>
          </div>

          <div className={shared.formGroup}>
            <label>Harga (Rp)</label>
            <input 
              type="number"
              min="0"
              className={shared.input}
              value={formData.harga}
              onChange={e => setFormData({ ...formData, harga: e.target.value })}
            />
          </div>

          <div className={shared.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Asal Usul</label>
            <input 
              type="text"
              className={shared.input}
              value={formData.asalUsul}
              onChange={e => setFormData({ ...formData, asalUsul: e.target.value })}
              required
            />
          </div>

          <div className={shared.modalActions}>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" disabled={formLoading}>{formLoading ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
