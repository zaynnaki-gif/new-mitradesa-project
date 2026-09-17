import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Modal, Input, Select } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import styles from './ApbdesEntryPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';
import {
  ApbdesItem,
  useApbdesList,
  useApbdesDetail,
  useRkpdesByTahun,
  useSaveApbdesItem,
  useDeleteApbdesItem
} from '@/hooks/usePerencanaan';

const KATEGORI_OPTIONS = [
  { value: 'PENDAPATAN', label: 'Pendapatan' },
  { value: 'BELANJA', label: 'Belanja' },
  { value: 'PEMBIAYAAN', label: 'Pembiayaan' },
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ApbdesEntryPage() {
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());

  const { data: apbdesList, isLoading: listLoading, error: listError } = useApbdesList(tahun, token || '');
  
  // Set default apbdesId if list is available
  const [selectedApbdesId, setSelectedApbdesId] = useState<string | null>(null);

  useEffect(() => {
    if (apbdesList && apbdesList.length > 0) {
      setSelectedApbdesId(apbdesList[0].id);
    } else {
      setSelectedApbdesId(null);
    }
  }, [apbdesList]);

  const { data: apbdes, isLoading: detailLoading, error: detailError, refetch } = useApbdesDetail(selectedApbdesId, token || '');
  const { data: rkpdesList = [], isLoading: rkpdesLoading } = useRkpdesByTahun(tahun, token || '');

  const saveMutation = useSaveApbdesItem();
  const deleteMutation = useDeleteApbdesItem();

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ApbdesItem | null>(null);
  const [itemForm, setItemForm] = useState({
    kategori: 'PENDAPATAN',
    nama: '',
    anggaran: '',
    realization: '',
    rkpdesId: '',
  });

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm({ kategori: 'PENDAPATAN', nama: '', anggaran: '', realization: '', rkpdesId: '' });
    setShowItemModal(true);
  };

  const openEditItem = (item: ApbdesItem) => {
    setEditingItem(item);
    setItemForm({
      kategori: item.kategori,
      nama: item.nama,
      anggaran: String(item.anggaran),
      realization: String(item.realization),
      rkpdesId: item.Rkpdes?.id || '',
    });
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apbdes) return;

    const body = {
      kategori: itemForm.kategori as 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN',
      nama: itemForm.nama,
      anggaran: parseFloat(itemForm.anggaran) || 0,
      realization: parseFloat(itemForm.realization) || 0,
      ...(itemForm.rkpdesId ? { rkpdesId: itemForm.rkpdesId } : {}),
    };

    try {
      await saveMutation.mutateAsync({
        apbdesId: apbdes.id,
        itemId: editingItem?.id,
        data: body,
        token: token || '',
      });
      setShowItemModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const handleDeleteItem = async (item: ApbdesItem) => {
    if (!await confirm({ message: 'Hapus rincian ini?', title: 'Konfirmasi' })) return;
    if (!apbdes) return;

    try {
      await deleteMutation.mutateAsync({ apbdesId: apbdes.id, itemId: item.id, token: token || '' });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const getItemsByKategori = (kat: string) =>
    (apbdes?.items || []).filter(i => i.kategori === kat);

  const calcTotal = (kat: string) =>
    getItemsByKategori(kat).reduce((s, i) => s + i.realization, 0);

  const calcAnggaran = (kat: string) =>
    getItemsByKategori(kat).reduce((s, i) => s + i.anggaran, 0);

  if (listLoading || detailLoading || rkpdesLoading) return <AdminLayout><LoadingState message="Memuat..." fullPage /></AdminLayout>;
  const error = listError || detailError;
  if (error) return <AdminLayout><ErrorState title="Gagal" message={error instanceof Error ? error.message : 'Terjadi kesalahan'} onRetry={() => refetch()} /></AdminLayout>;

  const categories = [
    { key: 'PENDAPATAN', label: 'Pendapatan', color: '#3b82f6' },
    { key: 'BELANJA', label: 'Belanja', color: '#f59e0b' },
    { key: 'PEMBIAYAAN', label: 'Pembiayaan', color: '#10b981' },
  ];

  return (
    <AdminLayout>
      {ConfirmElement}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>APBDes Entry</h1>
            <p className={styles.subtitle}>Rincian anggaran dan realisasi APBDes</p>
          </div>
          <div className={styles.headerActions}>
            <select
              className={styles.tahunSelect}
              value={tahun}
              onChange={e => setTahun(e.target.value)}
            >
              {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {!apbdes ? (
          <div className={styles.emptyState}>
            <p>Tidak ada data APBDes untuk tahun {tahun}.</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Buat data APBDes melalui menu Transparansi APBDes terlebih dahulu.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              {categories.map(cat => {
                const items = getItemsByKategori(cat.key);
                const total = calcTotal(cat.key);
                const anggar = calcAnggaran(cat.key);
                const percent = anggar > 0 ? Math.min(100, (total / anggar) * 100) : 0;
                return (
                  <div key={cat.key} className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <span className={styles.summaryLabel}>{cat.label}</span>
                      <Button size="sm" onClick={openAddItem}>+ Rincian</Button>
                    </div>
                    <div className={styles.summaryRow}>
                      <div>
                        <span className={styles.summarySub}>Anggaran</span>
                        <span className={styles.summaryValue}>{formatRupiah(anggar)}</span>
                      </div>
                      <div>
                        <span className={styles.summarySub}>Realisasi</span>
                        <span className={styles.summaryValue} style={{ color: cat.color }}>{formatRupiah(total)}</span>
                      </div>
                    </div>
                    <div className={styles.progressBg}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${percent}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <div className={styles.itemList}>
                      {items.length === 0 ? (
                        <p className={styles.noItems}>Belum ada rincian</p>
                      ) : items.map(item => (
                        <div key={item.id} className={styles.itemRow}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemNama}>{item.nama}</span>
                            <span className={styles.itemMeta}>
                              Anggaran: {formatRupiah(item.anggaran)} 
                              {item.Rkpdes && <span> | RKPDes: {item.Rkpdes.namaKegiatan}</span>}
                            </span>
                          </div>
                          <div className={styles.itemValues}>
                            <span className={styles.itemRealisasi}>{formatRupiah(item.realization)}</span>
                            <div className={styles.itemActions}>
                              <Button size="sm" variant="outline" onClick={() => openEditItem(item)}>Edit</Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteItem(item)} className={styles.btnDelete}>Hapus</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Item Modal */}
        <Modal
          isOpen={showItemModal}
          onClose={() => !saveMutation.isPending && setShowItemModal(false)}
          title={editingItem ? 'Edit Rincian' : 'Tambah Rincian APBDes'}
        >
          <form onSubmit={handleItemSubmit} className={styles.itemForm}>
            {saveMutation.error && <div className={styles.formError}>{saveMutation.error.message}</div>}
            <Select
              label="Kategori"
              value={itemForm.kategori}
              onChange={e => setItemForm(f => ({ ...f, kategori: e.target.value }))}
              options={KATEGORI_OPTIONS}
              required
            />
            {itemForm.kategori === 'BELANJA' && (
              <Select
                label="Sambungkan ke Program RKPDes (Opsional)"
                value={itemForm.rkpdesId}
                onChange={e => {
                  const rkpdesId = e.target.value;
                  const selectedRkpdes = rkpdesList.find(r => r.id === rkpdesId);
                  setItemForm(f => ({ 
                    ...f, 
                    rkpdesId,
                    // Auto-fill nama rincian if empty
                    nama: f.nama || (selectedRkpdes ? selectedRkpdes.namaKegiatan : '')
                  }));
                }}
                options={[
                  { value: '', label: '-- Tidak Disambungkan --' },
                  ...rkpdesList.map(r => ({
                    value: r.id,
                    label: r.namaKegiatan
                  }))
                ]}
              />
            )}
            <Input
              label="Nama Rincian"
              value={itemForm.nama}
              onChange={e => setItemForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Contoh: Pajak Bumi dan Bangunan"
              required={!itemForm.rkpdesId}
            />
            <div className={styles.formGrid2}>
              <Input
                label="Anggaran (Rp)"
                type="number"
                value={itemForm.anggaran}
                onChange={e => setItemForm(f => ({ ...f, anggaran: e.target.value }))}
                placeholder="0"
                required
              />
              <Input
                label="Realisasi (Rp)"
                type="number"
                value={itemForm.realization}
                onChange={e => setItemForm(f => ({ ...f, realization: e.target.value }))}
                placeholder="0"
                required
              />
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={() => setShowItemModal(false)} disabled={saveMutation.isPending}>Batal</Button>
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
