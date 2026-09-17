import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { useConfirm } from '@/hooks/useConfirm';
import shared from '@/styles/AdminShared.module.css';
import { 
  BukuBankEntry, 
  useBukuBankList, 
  useSaveBukuBank, 
  useDeleteBukuBank 
} from '@/hooks/useKeuangan';

export default function BukuBankPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: listResponse, isLoading, error: queryError, refetch } = useBukuBankList(page, search, token || '');
  const saveMutation = useSaveBukuBank();
  const deleteMutation = useDeleteBukuBank();

  const entries = listResponse?.data || [];
  const meta = listResponse?.meta;
  const error = queryError instanceof Error ? queryError.message : null;

  // Modal form
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BukuBankEntry | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    bank: '',
    uraian: '',
    kodeBukti: '',
    debit: '0',
    kredit: '0',
    rekonsiliasi: false,
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      bank: '',
      uraian: '',
      kodeBukti: '',
      debit: '0',
      kredit: '0',
      rekonsiliasi: false,
    });
    setShowModal(true);
  };

  const openEdit = (entry: BukuBankEntry) => {
    setEditing(entry);
    setFormData({
      tanggal: entry.tanggal.split('T')[0],
      bank: entry.bank,
      uraian: entry.uraian,
      kodeBukti: entry.kodeBukti || '',
      debit: String(entry.debit),
      kredit: String(entry.kredit),
      rekonsiliasi: entry.rekonsiliasi,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank || !formData.uraian) return;

    try {
      const body = {
        tanggal: formData.tanggal,
        bank: formData.bank,
        uraian: formData.uraian,
        kodeBukti: formData.kodeBukti,
        debit: parseFloat(formData.debit) || 0,
        kredit: parseFloat(formData.kredit) || 0,
        rekonsiliasi: formData.rekonsiliasi,
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
    if (!await confirm({ title: 'Hapus transaksi ini?', message: 'Data yang dihapus tidak dapat dikembalikan.' })) return;

    try {
      await deleteMutation.mutateAsync({ id, token: token || '' });
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
          <h1 className={shared.pageTitle}>Buku Bank Desa</h1>
          <p className={shared.pageDescription}>Kelola transaksi dan rekening bank desa</p>
        </div>
        <Button onClick={openCreate}>Catat Transaksi</Button>
      </div>

      <div className={shared.filterBar}>
        <input 
          type="search" 
          placeholder="Cari uraian atau bank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={shared.input}
          style={{ width: '300px' }}
        />
      </div>

      <div className={shared.card}>
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => refetch()} />
        ) : (
          <div className={shared.tableWrapper}>
            <table className={shared.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Bank</th>
                  <th>Uraian</th>
                  <th>Bukti</th>
                  <th className={shared.textRight}>Penerimaan</th>
                  <th className={shared.textRight}>Pengeluaran</th>
                  <th className={shared.textRight}>Saldo</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={shared.textCenter} style={{ padding: '2rem' }}>Belum ada data buku bank</td>
                  </tr>
                ) : (
                  entries.map(entry => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.tanggal).toLocaleDateString('id-ID')}</td>
                      <td>{entry.bank}</td>
                      <td>{entry.uraian}</td>
                      <td>{entry.kodeBukti || '-'}</td>
                      <td className={shared.textRight} style={{ color: entry.debit > 0 ? 'var(--color-success)' : 'inherit' }}>
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className={shared.textRight} style={{ color: entry.kredit > 0 ? 'var(--color-error)' : 'inherit' }}>
                        {entry.kredit > 0 ? formatCurrency(entry.kredit) : '-'}
                      </td>
                      <td className={shared.textRight}><strong>{formatCurrency(entry.saldo)}</strong></td>
                      <td>
                        <span className={shared.badge} data-variant={entry.rekonsiliasi ? 'success' : 'warning'}>
                          {entry.rekonsiliasi ? 'Terekonsiliasi' : 'Belum'}
                        </span>
                      </td>
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
              onClick={() => setPage(meta.page - 1)}
            >
              Sebelumnya
            </Button>
            <span>Halaman {meta.page} dari {meta.totalPages}</span>
            <Button 
              variant="outline" 
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(meta.page + 1)}
            >
              Berikutnya
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !saveMutation.isPending && setShowModal(false)}
        title={editing ? 'Edit Transaksi Bank' : 'Catat Transaksi Bank'}
      >
        <form onSubmit={handleSubmit} className={shared.formGrid}>
          {saveMutation.error && <div className={shared.errorMessage}>{saveMutation.error.message}</div>}
          
          <div className={shared.formGroup}>
            <label>Tanggal Transaksi</label>
            <input 
              type="date"
              className={shared.input}
              value={formData.tanggal}
              onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
              required
            />
          </div>

          <div className={shared.formGroup}>
            <label>Nama Bank</label>
            <input 
              type="text"
              className={shared.input}
              value={formData.bank}
              onChange={e => setFormData({ ...formData, bank: e.target.value })}
              required
              placeholder="Contoh: Bank BPD DIY"
            />
          </div>

          <div className={shared.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Uraian Transaksi</label>
            <input 
              type="text"
              className={shared.input}
              value={formData.uraian}
              onChange={e => setFormData({ ...formData, uraian: e.target.value })}
              required
            />
          </div>

          <div className={shared.formGroup}>
            <label>Kode Bukti (Opsional)</label>
            <input 
              type="text"
              className={shared.input}
              value={formData.kodeBukti}
              onChange={e => setFormData({ ...formData, kodeBukti: e.target.value })}
            />
          </div>

          <div className={shared.formGroup}>
            <label>Status Rekonsiliasi</label>
            <select 
              className={shared.input}
              value={formData.rekonsiliasi ? 'true' : 'false'}
              onChange={e => setFormData({ ...formData, rekonsiliasi: e.target.value === 'true' })}
            >
              <option value="false">Belum Direkonsiliasi</option>
              <option value="true">Sudah Direkonsiliasi</option>
            </select>
          </div>

          <div className={shared.formGroup}>
            <label>Penerimaan (Debit)</label>
            <input 
              type="number"
              min="0"
              className={shared.input}
              value={formData.debit}
              onChange={e => setFormData({ ...formData, debit: e.target.value })}
            />
          </div>

          <div className={shared.formGroup}>
            <label>Pengeluaran (Kredit)</label>
            <input 
              type="number"
              min="0"
              className={shared.input}
              value={formData.kredit}
              onChange={e => setFormData({ ...formData, kredit: e.target.value })}
            />
          </div>

          <div className={shared.modalActions}>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saveMutation.isPending}>Batal</Button>
            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
