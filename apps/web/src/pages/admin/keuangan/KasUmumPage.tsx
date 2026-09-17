import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import styles from './KasUmumPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';
import {
  KasUmumEntry,
  useKasUmumList,
  useKasUmumSaldo,
  useSaveKasUmum,
  useDeleteKasUmum
} from '@/hooks/useKeuangan';

const JENIS_OPTIONS = [
  { value: 'KAS_MASUK', label: 'Kas Masuk' },
  { value: 'KAS_KELUAR', label: 'Kas Keluar' },
];

export default function KasUmumPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();

  const [page, setPage] = useState(1);
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [bulan, setBulan] = useState('');
  const [jenis, setJenis] = useState('');

  const { data: listResponse, isLoading, error: queryError, refetch } = useKasUmumList(page, tahun, bulan, jenis, token || '');
  const { data: saldoData } = useKasUmumSaldo(token || '');
  const saveMutation = useSaveKasUmum();
  const deleteMutation = useDeleteKasUmum();

  const entries = listResponse?.data || [];
  const meta = listResponse?.meta;
  const saldo = saldoData?.saldo || 0;
  const error = queryError instanceof Error ? queryError.message : null;

  // Modal form
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KasUmumEntry | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'KAS_MASUK' as 'KAS_MASUK' | 'KAS_KELUAR',
    uraian: '',
    jumlah: '',
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      jenis: 'KAS_MASUK',
      uraian: '',
      jumlah: '',
    });
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
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraian || !formData.jumlah) return;

    try {
      const body = {
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        uraian: formData.uraian,
        jumlah: parseFloat(formData.jumlah),
      };

      await saveMutation.mutateAsync({
        id: editing?.id,
        data: body,
        token: token || '',
      });
      setShowModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ message: 'Hapus entri ini?', title: 'Konfirmasi' })) return;

    try {
      await deleteMutation.mutateAsync({ id, token: token || '' });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
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
      {ConfirmElement}
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
            onChange={e => { setTahun(e.target.value); setPage(1); }}
          >
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={bulan}
            onChange={e => { setBulan(e.target.value); setPage(1); }}
          >
            <option value="">Semua Bulan</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={jenis}
            onChange={e => { setJenis(e.target.value); setPage(1); }}
          >
            <option value="">Semua Jenis</option>
            {JENIS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState message="Memuat..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal" message={error} onRetry={() => refetch()} />
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
                  onClick={() => setPage(meta.page - 1)}
                >
                  ← Prev
                </Button>
                <span className={styles.pageInfo}>
                  Halaman {meta.page} / {meta.totalPages}
                </span>
                <Button
                  size="sm" variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage(meta.page + 1)}
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
          onClose={() => !saveMutation.isPending && setShowModal(false)}
          title={editing ? 'Edit Entri Kas Umum' : 'Tambah Entri Kas Umum'}
        >
          <form onSubmit={handleSubmit} className={styles.form}>
            {saveMutation.error && (
              <div className={styles.formError}>{saveMutation.error.message}</div>
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
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saveMutation.isPending}>Batal</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
