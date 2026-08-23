import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Input, Select, Modal, Badge } from '../../../components/ui';
import { LoadingState, ErrorState } from '../../../components/states';
import { useAuthStore } from '../../../stores/auth.store';
import { API_URL } from '../../../lib/constants';
import styles from './KeluargaPage.module.css';

// Types
interface Anggota {
  id: string;
  pendudukId: string;
  nik: string;
  namaLengkap: string;
  hubungan: string;
  isAktif: boolean;
}

interface Keluarga {
  id: string;
  noKk: string;
  kepalaId: string;
  kepalaNik: string;
  kepalaNama: string;
  alamat: string | null;
  dusun: string | null;
  rw: string | null;
  rt: string | null;
  createdAt: string;
  isAktif: boolean;
}

interface KeluargaDetail extends Keluarga {
  anggota: Anggota[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ImportResult {
  keluargaCreated: number;
  keluargaUpdated: number;
  pendudukCreated: number;
  pendudukUpdated: number;
  failed: number;
  errors: string[];
}

// Form types
interface KeluargaForm {
  noKk: string;
  kepalaId: string;
  alamat: string;
  dusun: string;
  rw: string;
  rt: string;
}

interface AnggotaForm {
  pendudukId: string;
  hubungan: string;
}

export default function KeluargaPage() {
  const { token } = useAuthStore();

  // State - list
  const [keluarga, setKeluarga] = useState<Keluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Filters
  const [search, setSearch] = useState('');

  // List modal
  const [showListModal, setShowListModal] = useState(false);
  const [selectedKeluarga, setSelectedKeluarga] = useState<KeluargaDetail | null>(null);
  const [listLoading, setListLoading] = useState(false);

  // Form modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingKeluarga, setEditingKeluarga] = useState<Keluarga | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<KeluargaForm>({
    noKk: '',
    kepalaId: '',
    alamat: '',
    dusun: '',
    rw: '',
    rt: '',
  });

  // Anggota modal
  const [showAnggotaModal, setShowAnggotaModal] = useState(false);
  const [anggotaForm, setAnggotaForm] = useState<AnggotaForm>({ pendudukId: '', hubungan: '' });
  const [anggotaLoading, setAnggotaLoading] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [gubugOptions, setGubugOptions] = useState<{kode: string, nama: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch keluarga list
  const fetchKeluarga = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.append('search', search);

      const res = await fetch(`${API_URL}/keluarga?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setKeluarga(data.data);
        setPagination(data.meta);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    fetchKeluarga();
  }, [fetchKeluarga]);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/wilayah/dropdown`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.gubug) {
          setGubugOptions(data.data.gubug);
        }
      })
      .catch(err => console.error(err));
    }
  }, [token]);

  // Open create modal
  const openCreateModal = () => {
    setEditingKeluarga(null);
    setFormData({ noKk: '', kepalaId: '', alamat: '', dusun: '', rw: '', rt: '' });
    setShowFormModal(true);
  };

  // Open edit modal
  const openEditModal = (item: Keluarga) => {
    setEditingKeluarga(item);
    setFormData({
      noKk: item.noKk,
      kepalaId: item.kepalaId,
      alamat: item.alamat || '',
      dusun: item.dusun || '',
      rw: item.rw || '',
      rt: item.rt || '',
    });
    setShowFormModal(true);
  };

  // Open detail/list modal
  const openListModal = async (item: Keluarga) => {
    setSelectedKeluarga(null);
    setListLoading(true);
    setShowListModal(true);

    try {
      const res = await fetch(`${API_URL}/keluarga/${item.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedKeluarga(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch detail:', err);
    } finally {
      setListLoading(false);
    }
  };

  // Submit keluarga form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingKeluarga
        ? `${API_URL}/keluarga/${editingKeluarga.id}`
        : `${API_URL}/keluarga`;
      const method = editingKeluarga ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setShowFormModal(false);
        fetchKeluarga();
      } else {
        alert(data.error?.message || 'Terjadi kesalahan');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete keluarga
  const handleDelete = async (item: Keluarga) => {
    if (!confirm(`Yakin ingin menghapus keluarga dengan No. KK ${item.noKk}?`)) return;

    try {
      const res = await fetch(`${API_URL}/keluarga/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchKeluarga();
      } else {
        alert(data.error?.message || 'Gagal menghapus');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  // Add anggota
  const handleAddAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeluarga || !anggotaForm.pendudukId) return;

    setAnggotaLoading(true);
    try {
      const res = await fetch(`${API_URL}/keluarga/${selectedKeluarga.id}/anggota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(anggotaForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAnggotaModal(false);
        setAnggotaForm({ pendudukId: '', hubungan: '' });
        openListModal(selectedKeluarga);
      } else {
        alert(data.error?.message || 'Gagal menambah anggota');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setAnggotaLoading(false);
    }
  };

  // Remove anggota
  const handleRemoveAnggota = async (anggotaId: string) => {
    if (!selectedKeluarga || !confirm('Yakin ingin menghapus anggota ini?')) return;

    try {
      const res = await fetch(`${API_URL}/keluarga/${selectedKeluarga.id}/anggota/${anggotaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        openListModal(selectedKeluarga);
      } else {
        alert(data.error?.message || 'Gagal menghapus anggota');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  // Export Data
  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const res = await fetch(`${API_URL}/keluarga/export?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const arrayBuffer = await res.arrayBuffer();
      const contentType = format === 'xlsx' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'text/csv; charset=utf-8';
      const blob = new Blob([arrayBuffer], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keluarga_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      a.remove();
    } catch {
      alert('Gagal export data');
    }
  };

  // Import CSV
  const handleImport = async (file: File) => {
    setImportLoading(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;

        const res = await fetch(`${API_URL}/keluarga/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ csv }),
        });

        const data = await res.json();
        setImportResult(data.data || data);

        if (data.success && (data.data?.keluargaCreated > 0 || data.data?.keluargaUpdated > 0)) {
          fetchKeluarga();
        }
      } catch {
        setImportResult({ keluargaCreated: 0, keluargaUpdated: 0, pendudukCreated: 0, pendudukUpdated: 0, failed: 1, errors: ['Gagal import file'] });
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Mask NIK
  const maskNik = (nik: string) => {
    if (nik.length === 16) {
      return `${nik.slice(0, 6)}xxxxxx${nik.slice(-4)}`;
    }
    return nik;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Data Keluarga</h1>
          <p className={styles.subtitle}>
            {pagination?.total || 0} total keluarga
          </p>
        </div>
        <div className={styles.headerActions} style={{ gap: '8px', display: 'flex', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            📄 Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            📊 Export Excel
          </Button>
          <Button variant="outline" onClick={() => { setShowImportModal(true); setImportResult(null); }}>
            📤 Import CSV
          </Button>
          <Button variant="primary" onClick={openCreateModal}>
            + Tambah Keluarga
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.filters}>
        <form onSubmit={(e) => { e.preventDefault(); fetchKeluarga(1); }} className={styles.searchForm}>
          <Input
            placeholder="Cari No. KK atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit">Cari</Button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Memuat data keluarga..." fullPage />
      ) : error ? (
        <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => fetchKeluarga()} />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. KK</th>
                <th>Kepala Keluarga</th>
                <th>Alamat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {keluarga.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>Tidak ada data keluarga</td>
                </tr>
              ) : (
                keluarga.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.noKk}>{maskNik(item.noKk)}</td>
                    <td>{item.kepalaNama}</td>
                    <td>
                      {item.alamat || '-'}
                      {item.dusun && `, ${item.dusun}`}
                      {item.rw && ` RW ${item.rw}`}
                      {item.rt && ` RT ${item.rt}`}
                    </td>
                    <td className={styles.actions}>
                      <Button variant="outline" size="sm" onClick={() => openListModal(item)}>
                        Detail
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
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
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchKeluarga(pagination.page - 1)}
          >
            ← Prev
          </Button>
          <span>Halaman {pagination.page} dari {pagination.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchKeluarga(pagination.page + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showListModal} onClose={() => setShowListModal(false)} title="Detail Keluarga">
        {listLoading ? (
          <LoadingState message="Memuat..." />
        ) : selectedKeluarga ? (
          <div className={styles.detailModal}>
            <div className={styles.detailHeader}>
              <div>
                <p className={styles.detailLabel}>No. KK</p>
                <p className={styles.detailValue}>{selectedKeluarga.noKk}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Alamat</p>
                <p className={styles.detailValue}>
                  {selectedKeluarga.alamat || '-'}
                  {selectedKeluarga.dusun && `, ${selectedKeluarga.dusun}`}
                  {selectedKeluarga.rw && ` RW ${selectedKeluarga.rw}`}
                  {selectedKeluarga.rt && ` RT ${selectedKeluarga.rt}`}
                </p>
              </div>
            </div>

            <div className={styles.anggotaSection}>
              <div className={styles.anggotaHeader}>
                <h4>Daftar Anggota Keluarga</h4>
                <Button variant="outline" size="sm" onClick={() => setShowAnggotaModal(true)}>
                  + Tambah Anggota
                </Button>
              </div>

              {selectedKeluarga.anggota.length === 0 ? (
                <p className={styles.noAnggota}>Belum ada anggota</p>
              ) : (
                <table className={styles.anggotaTable}>
                  <thead>
                    <tr>
                      <th>NIK</th>
                      <th>Nama</th>
                      <th>Hubungan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedKeluarga.anggota.map((a) => (
                      <tr key={a.id}>
                        <td>{maskNik(a.nik)}</td>
                        <td>{a.namaLengkap}</td>
                        <td><Badge color="primary">{a.hubungan}</Badge></td>
                        <td>
                          {a.hubungan !== 'KEPALA' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAnggota(a.id)}
                              style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                            >
                              Hapus
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingKeluarga ? 'Edit Keluarga' : 'Tambah Keluarga'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="No. KK"
            value={formData.noKk}
            onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
            required
            maxLength={16}
            disabled={!!editingKeluarga}
            placeholder="16 digit nomor KK"
          />
          <Input
            label="NIK Kepala Keluarga"
            value={formData.kepalaId}
            onChange={(e) => setFormData({ ...formData, kepalaId: e.target.value })}
            required
            disabled={!!editingKeluarga}
            placeholder="NIK 16 digit"
          />
          <Input
            label="Alamat"
            value={formData.alamat}
            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
          />
          <div className={styles.rowFields}>
            <Select
              label="Dusun"
              value={formData.dusun}
              onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
            >
              <option value="">Pilih Dusun</option>
              {gubugOptions.map((g) => (
                <option key={g.kode} value={g.nama}>{g.nama}</option>
              ))}
            </Select>
            <Input
              label="RW"
              value={formData.rw}
              onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
              placeholder="01"
            />
            <Input
              label="RT"
              value={formData.rt}
              onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
              placeholder="001"
            />
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Anggota Modal */}
      <Modal isOpen={showAnggotaModal} onClose={() => setShowAnggotaModal(false)} title="Tambah Anggota">
        <form onSubmit={handleAddAnggota} className={styles.form}>
          <Input
            label="NIK Anggota"
            value={anggotaForm.pendudukId}
            onChange={(e) => setAnggotaForm({ ...anggotaForm, pendudukId: e.target.value })}
            required
            placeholder="NIK 16 digit"
          />
          <Select
            label="Hubungan"
            value={anggotaForm.hubungan}
            onChange={(e) => setAnggotaForm({ ...anggotaForm, hubungan: e.target.value })}
            required
          >
            <option value="">Pilih Hubungan</option>
            <option value="ISTRI">Istri</option>
            <option value="ANAK">Anak</option>
            <option value="CUCU">Cucu</option>
            <option value="MENANTU">Menantu</option>
            <option value="ORANGTUA">Orang Tua</option>
            <option value="MERTUA">Mertua</option>
            <option value="SAUDARA">Saudara</option>
            <option value="PEMBANTU">Pembantu</option>
            <option value="LAINNYA">Lainnya</option>
          </Select>
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setShowAnggotaModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={anggotaLoading}>
              {anggotaLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Data Keluarga dari CSV">
        <div className={styles.importModal}>
          <p className={styles.importInfo}>
            Upload file CSV dengan format: No_KK, Nama_Kepala, NIK_Kepala, Alamat, Daven, RW, RT, Nama_Anggota, NIK_Anggota, Hubungan
          </p>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
          />
          {importLoading && <p className={styles.importLoading}>Memproses import...</p>}
          {importResult && (
            <div className={styles.importResult}>
              <p>✅ Keluarga dibuat: {importResult.keluargaCreated}</p>
              <p>✅ Keluarga diupdate: {importResult.keluargaUpdated}</p>
              <p>✅ Penduduk dibuat: {importResult.pendudukCreated}</p>
              <p>✅ Penduduk diupdate: {importResult.pendudukUpdated}</p>
              {importResult.failed > 0 && <p>❌ Gagal: {importResult.failed}</p>}
              {importResult.errors.length > 0 && (
                <div className={styles.importErrors}>
                  <p>Errors:</p>
                  <ul>
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importResult.errors.length > 5 && <li>...dan {importResult.errors.length - 5} lagi</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
