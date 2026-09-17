import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import { useKunjunganList, useSaveKunjungan, useDeleteKunjungan, Kunjungan } from '@/hooks/useKesehatan';
import { RecordSelector } from '@/components/RecordSelector';
import styles from './AdminPosyanduKunjungan.module.css';
import { useConfirm } from '@/hooks/useConfirm';

// ============================================
// Types
// ============================================



const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'IBU_HAMIL', label: 'Ibu Hamil' },
  { value: 'BALITA', label: 'Balita' },
  { value: 'LANSIA', label: 'Lansia' },
  { value: 'UMUM', label: 'Umum' },
];

const STATUS_GIZI_OPTIONS = [
  { value: '', label: 'Pilih Status Gizi' },
  { value: 'BGM', label: 'BGM (Berat Badan Sangat Kurang)' },
  { value: 'GIZI_KURANG', label: 'Gizi Kurang' },
  { value: 'GIZI_BAIK', label: 'Gizi Baik' },
  { value: 'GIZI_LEBIH', label: 'Gizi Lebih' },
  { value: 'RISIKO_GIZI', label: 'Risiko Gizi' },
];

const defaultFormData = () => ({
  pendudukId: '',
  tanggalKunjungan: new Date().toISOString().split('T')[0],
  kategori: 'UMUM' as Kunjungan['kategori'],
  mingguKehamilan: '',
  tekananDarah: '',
  beratBadanIbu: '',
  tekananDarahUmum: '',
  gulaDarah: '',
  beratBadan: '',
  panjangBadan: '',
  lingkarKepala: '',
  statusGizi: '',
  imunisasi: '',
  vitamin: '',
  catatan: '',
});

export default function AdminPosyanduKunjunganPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();

  // ============================================
  // State
  // ============================================
  // ============================================
  // State
  // ============================================
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');

  const { data: kunjunganData, isLoading: loading, error, refetch: fetchKunjungan } = useKunjunganList({ page, limit: 20, search, kategori, tanggalMulai, tanggalSelesai }, token || '');
  const items = kunjunganData?.data || [];
  const meta = kunjunganData?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Kunjungan | null>(null);
  const [formData, setFormData] = useState<ReturnType<typeof defaultFormData>>(defaultFormData());
  const [defaultSearchName, setDefaultSearchName] = useState('');

  const saveKunjungan = useSaveKunjungan();
  const deleteKunjungan = useDeleteKunjungan();
  const formLoading = saveKunjungan.isPending;

  // ============================================
  // Modal Handlers
  // ============================================
  const openCreate = () => {
    setEditing(null);
    setFormData(defaultFormData());
    setDefaultSearchName('');
    setShowModal(true);
  };

  const openEdit = (item: Kunjungan) => {
    setEditing(item);
    setFormData({
      pendudukId: item.pendudukId,
      tanggalKunjungan: item.tanggalKunjungan?.split('T')[0] || '',
      kategori: item.kategori,
      mingguKehamilan: String(item.mingguKehamilan || ''),
      tekananDarah: item.tekananDarah || item.tekananDarahUmum || '',
      beratBadanIbu: String(item.beratBadanIbu || ''),
      tekananDarahUmum: item.tekananDarahUmum || '',
      gulaDarah: String(item.gulaDarah || ''),
      beratBadan: String(item.beratBadan || ''),
      panjangBadan: String(item.panjangBadan || ''),
      lingkarKepala: String(item.lingkarKepala || ''),
      statusGizi: item.statusGizi || '',
      imunisasi: item.imunisasi || '',
      vitamin: item.vitamin || '',
      catatan: item.catatan || '',
    });
    setDefaultSearchName(item.penduduk?.namaLengkap || '');
    setShowModal(true);
  };

  // ============================================
  // CRUD
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      pendudukId: formData.pendudukId,
      tanggalKunjungan: formData.tanggalKunjungan,
      kategori: formData.kategori,
      catatan: formData.catatan,
    };

    if (formData.kategori === 'IBU_HAMIL') {
      if (formData.mingguKehamilan) payload.mingguKehamilan = Number(formData.mingguKehamilan);
      if (formData.tekananDarah) payload.tekananDarah = formData.tekananDarah;
      if (formData.beratBadanIbu) payload.beratBadanIbu = Number(formData.beratBadanIbu);
    }

    if (formData.kategori === 'BALITA') {
      if (formData.beratBadan) payload.beratBadan = Number(formData.beratBadan);
      if (formData.panjangBadan) payload.panjangBadan = Number(formData.panjangBadan);
      if (formData.lingkarKepala) payload.lingkarKepala = Number(formData.lingkarKepala);
      if (formData.statusGizi) payload.statusGizi = formData.statusGizi;
    }

    if (formData.kategori === 'LANSIA' || formData.kategori === 'UMUM') {
      if (formData.tekananDarahUmum) payload.tekananDarah = formData.tekananDarahUmum;
      if (formData.gulaDarah) payload.gulaDarah = Number(formData.gulaDarah);
    }

    if (formData.imunisasi) payload.imunisasi = formData.imunisasi;
    if (formData.vitamin) payload.vitamin = formData.vitamin;
    try {
      await saveKunjungan.mutateAsync({
        id: editing?.id,
        payload,
        token: token || '',
      });
      setShowModal(false);
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (item: Kunjungan) => {
    const nama = item.penduduk?.namaLengkap || item.pendudukId;
    const _ok = await confirm({ message: `Hapus kunjungan "${nama}" pada ${formatDate(item.tanggalKunjungan)}?`, title: 'Konfirmasi' }); if (!_ok) return;

    try {
      await deleteKunjungan.mutateAsync({
        id: item.id,
        token: token || '',
      });
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan');
    }
  };

  // ============================================
  // Helpers
  // ============================================
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getKategoriLabel = (k: string) => {
    return KATEGORI_OPTIONS.find(o => o.value === k)?.label || k;
  };

  const getKategoriBadgeColor = (k: string): "primary" | "secondary" | "error" | "success" | "muted" => {
    switch (k) {
      case 'IBU_HAMIL': return 'secondary';
      case 'BALITA': return 'primary';
      case 'LANSIA': return 'error';
      case 'UMUM': return 'muted';
      default: return 'muted';
    }
  };

  const resetFilters = () => {
    setSearch('');
    setKategori('');
    setTanggalMulai('');
    setTanggalSelesai('');
  };

  // ============================================
  // Render
  // ============================================
  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Kunjungan Posyandu</h1>
            <p className={styles.subtitle}>
              {meta?.total || 0} total kunjungan
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="primary" onClick={openCreate}>
              + Tambah Kunjungan
            </Button>
          </div>
        </div>

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
              value={kategori}
              onChange={e => setKategori(e.target.value)}
              style={{ width: 160 }}
            >
              {KATEGORI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Input
              type="date"
              value={tanggalMulai}
              onChange={e => setTanggalMulai(e.target.value)}
              style={{ width: 160 }}
              title="Tanggal Mulai"
            />
            <Input
              type="date"
              value={tanggalSelesai}
              onChange={e => setTanggalSelesai(e.target.value)}
              style={{ width: 160 }}
              title="Tanggal Selesai"
            />
            <Button onClick={() => setPage(1)}>Cari</Button>
            <Button variant="outline" onClick={resetFilters}>Reset</Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data kunjungan..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal Memuat Data" message={error.message || 'Gagal'} onRetry={() => fetchKunjungan()} />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama</th>
                    <th>NIK</th>
                    <th>Kategori</th>
                    <th>Ukuran</th>
                    <th>Status Gizi</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.empty}>
                        Belum ada data kunjungan.{' '}
                        <Button size="sm" variant="outline" onClick={openCreate}>+ Tambah</Button>
                      </td>
                    </tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.id}>
                        <td>{formatDate(item.tanggalKunjungan)}</td>
                        <td className={styles.nama}>{item.penduduk?.namaLengkap || '—'}</td>
                        <td className={styles.nik}>{item.penduduk?.nik ? maskNik(item.penduduk.nik) : '—'}</td>
                        <td>
                          <Badge color={getKategoriBadgeColor(item.kategori)}>
                            {getKategoriLabel(item.kategori)}
                          </Badge>
                        </td>
                        <td className={styles.ukuran}>
                          {item.kategori === 'IBU_HAMIL' && (
                            <span>
                              {item.beratBadanIbu ? `${item.beratBadanIbu} kg` : '—'}
                              {item.mingguKehamilan ? ` · MK ${item.mingguKehamilan}` : ''}
                            </span>
                          )}
                          {item.kategori === 'BALITA' && (
                            <span>
                              {item.beratBadan ? `${item.beratBadan} kg` : '—'}
                              {item.panjangBadan ? ` / ${item.panjangBadan} cm` : ''}
                            </span>
                          )}
                          {item.kategori === 'LANSIA' && (
                            <span>
                              {item.tekananDarahUmum || '—'}
                              {item.gulaDarah ? ` · GDS ${item.gulaDarah}` : ''}
                            </span>
                          )}
                          {item.kategori === 'UMUM' && (
                            <span>
                              {item.tekananDarahUmum || '—'}
                              {item.gulaDarah ? ` · GDS ${item.gulaDarah}` : ''}
                            </span>
                          )}
                        </td>
                        <td>{item.statusGizi ? (
                          <Badge color={
                            item.statusGizi === 'GIZI_BAIK' ? 'success' :
                            item.statusGizi === 'GIZI_KURANG' || item.statusGizi === 'BGM' ? 'error' :
                            'secondary'
                          }>
                            {item.statusGizi.replace(/_/g, ' ')}
                          </Badge>
                        ) : '—'}</td>
                        <td className={styles.catatan}>{item.catatan || '—'}</td>
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
                onPageChange={setPage}
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
                <h2>{editing ? 'Edit Kunjungan' : 'Tambah Kunjungan'}</h2>
                <button onClick={() => setShowModal(false)} aria-label="Tutup">&times;</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Penduduk & Tanggal */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Identitas Kunjungan</h3>
                  <div className={styles.formGrid}>
                    <RecordSelector
                      endpoint="/cms/penduduk"
                      label="Peserta *"
                      value={formData.pendudukId}
                      defaultName={defaultSearchName}
                      onChange={(id) => setFormData(f => ({ ...f, pendudukId: id }))}
                      renderItem={res => (
                        <>
                          <div style={{ fontWeight: 500 }}>{res.namaLengkap}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>NIK: {res.nik}</div>
                        </>
                      )}
                      getDisplayValue={res => res.namaLengkap}
                    />
                    <Input
                      label="Tanggal Kunjungan *"
                      type="date"
                      value={formData.tanggalKunjungan}
                      onChange={e => setFormData(f => ({ ...f, tanggalKunjungan: e.target.value }))}
                      required
                    />
                    <Select
                      label="Kategori *"
                      value={formData.kategori}
                      onChange={e => setFormData(f => ({ ...f, kategori: e.target.value as Kunjungan['kategori'] }))}
                      required
                    >
                      {KATEGORI_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </div>
                </div>

                {/* Ibu Hamil Fields */}
                {formData.kategori === 'IBU_HAMIL' && (
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Data Kesehatan — Ibu Hamil</h3>
                    <div className={styles.formGrid}>
                      <Input
                        label="Minggu Kehamilan"
                        type="number"
                        min="1"
                        max="42"
                        value={formData.mingguKehamilan}
                        onChange={e => setFormData(f => ({ ...f, mingguKehamilan: e.target.value }))}
                        placeholder="1–42"
                      />
                      <Input
                        label="Tekanan Darah"
                        value={formData.tekananDarah}
                        onChange={e => setFormData(f => ({ ...f, tekananDarah: e.target.value }))}
                        placeholder="120/80"
                      />
                      <Input
                        label="Berat Badan (kg)"
                        type="number"
                        step="0.1"
                        value={formData.beratBadanIbu}
                        onChange={e => setFormData(f => ({ ...f, beratBadanIbu: e.target.value }))}
                        placeholder="60.0"
                      />
                    </div>
                  </div>
                )}

                {/* Balita Fields */}
                {formData.kategori === 'BALITA' && (
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Data Kesehatan — Balita</h3>
                    <div className={styles.formGrid}>
                      <Input
                        label="Berat Badan (kg)"
                        type="number"
                        step="0.1"
                        value={formData.beratBadan}
                        onChange={e => setFormData(f => ({ ...f, beratBadan: e.target.value }))}
                        placeholder="9.5"
                      />
                      <Input
                        label="Panjang Badan (cm)"
                        type="number"
                        step="0.1"
                        value={formData.panjangBadan}
                        onChange={e => setFormData(f => ({ ...f, panjangBadan: e.target.value }))}
                        placeholder="75.0"
                      />
                      <Input
                        label="Lingkar Kepala (cm)"
                        type="number"
                        step="0.1"
                        value={formData.lingkarKepala}
                        onChange={e => setFormData(f => ({ ...f, lingkarKepala: e.target.value }))}
                        placeholder="44.0"
                      />
                      <Select
                        label="Status Gizi"
                        value={formData.statusGizi}
                        onChange={e => setFormData(f => ({ ...f, statusGizi: e.target.value }))}
                      >
                        {STATUS_GIZI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                    </div>
                  </div>
                )}

                {/* Lansia / Umum Fields */}
                {(formData.kategori === 'LANSIA' || formData.kategori === 'UMUM') && (
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Data Kesehatan — {getKategoriLabel(formData.kategori)}</h3>
                    <div className={styles.formGrid}>
                      <Input
                        label="Tekanan Darah"
                        value={formData.tekananDarahUmum}
                        onChange={e => setFormData(f => ({ ...f, tekananDarahUmum: e.target.value }))}
                        placeholder="120/80"
                      />
                      <Input
                        label="Gula Darah Sewaktu (mg/dL)"
                        type="number"
                        value={formData.gulaDarah}
                        onChange={e => setFormData(f => ({ ...f, gulaDarah: e.target.value }))}
                        placeholder="140"
                      />
                    </div>
                  </div>
                )}

                {/* Imunisasi & Vitamin */}
                {(formData.kategori === 'IBU_HAMIL' || formData.kategori === 'BALITA') && (
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Imunisasi & Suplemen</h3>
                    <div className={styles.formGrid}>
                      <Input
                        label="Imunisasi"
                        value={formData.imunisasi}
                        onChange={e => setFormData(f => ({ ...f, imunisasi: e.target.value }))}
                        placeholder="TT, Hepatitis B, dll."
                      />
                      <Input
                        label="Vitamin"
                        value={formData.vitamin}
                        onChange={e => setFormData(f => ({ ...f, vitamin: e.target.value }))}
                        placeholder="Vitamin A, Asam Folat, dll."
                      />
                    </div>
                  </div>
                )}

                {/* Catatan */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Catatan</h3>
                  <div className={styles.fullWidth}>
                    <Input
                      label="Catatan"
                      value={formData.catatan}
                      onChange={e => setFormData(f => ({ ...f, catatan: e.target.value }))}
                      placeholder="Catatan hasil pemeriksaan..."
                    />
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
