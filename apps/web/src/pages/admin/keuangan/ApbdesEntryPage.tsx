import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Modal, Input, Select } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './ApbdesEntryPage.module.css';

interface ApbdesItem {
  id: string;
  apbdesId: string;
  kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN';
  nama: string;
  anggaran: number;
  realization: number;
  createdAt: string;
}

interface Apbdes {
  id: string;
  tahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  totalPembiayaan: number;
  isAktif: boolean;
  items: ApbdesItem[];
}


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
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [apbdes, setApbdes] = useState<Apbdes | null>(null);
  const [apbdesList, setApbdesList] = useState<Apbdes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ApbdesItem | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    kategori: 'PENDAPATAN',
    nama: '',
    anggaran: '',
    realization: '',
  });

  // Load list of APBDes years
  const fetchApbdesList = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transparansi?tahun=${tahun}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setApbdesList(data.data || []);
    } catch { /* ignore */ }
  }, [token, tahun]);

  // Load detail + items
  const fetchDetail = useCallback(async (apbdesId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/transparansi/${apbdesId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setApbdes(data.data);
      else setError(data.error?.message || 'Gagal memuat');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchApbdesList(); }, [fetchApbdesList]);

  useEffect(() => {
    if (apbdesList.length > 0 && !apbdes) {
      fetchDetail(apbdesList[0].id);
    }
  }, [apbdesList, apbdes, fetchDetail]);

  // Select APBDes by tahun
  const handleTahunChange = (newTahun: string) => {
    setTahun(newTahun);
    setApbdes(null);
    setLoading(true);
    // Trigger fetch
    fetch(`${API_URL}/transparansi?tahun=${newTahun}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          fetchDetail(data.data[0].id);
        } else {
          setApbdes(null);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm({ kategori: 'PENDAPATAN', nama: '', anggaran: '', realization: '' });
    setItemError(null);
    setShowItemModal(true);
  };

  const openEditItem = (item: ApbdesItem) => {
    setEditingItem(item);
    setItemForm({
      kategori: item.kategori,
      nama: item.nama,
      anggaran: String(item.anggaran),
      realization: String(item.realization),
    });
    setItemError(null);
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apbdes) return;
    setItemLoading(true);
    setItemError(null);

    const body = {
      kategori: itemForm.kategori,
      nama: itemForm.nama,
      anggaran: parseFloat(itemForm.anggaran) || 0,
      realization: parseFloat(itemForm.realization) || 0,
    };

    try {
      const url = editingItem
        ? `${API_URL}/transparansi/${apbdes.id}/items/${editingItem.id}`
        : `${API_URL}/transparansi/${apbdes.id}/items`;
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowItemModal(false);
        fetchDetail(apbdes.id);
      } else {
        setItemError(data.error?.message || 'Gagal menyimpan');
      }
    } catch { setItemError('Terjadi kesalahan'); }
    finally { setItemLoading(false); }
  };

  const handleDeleteItem = async (item: ApbdesItem) => {
    if (!confirm('Hapus rincian ini?')) return;
    if (!apbdes) return;
    try {
      const res = await fetch(
        `${API_URL}/transparansi/${apbdes.id}/items/${item.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) fetchDetail(apbdes.id);
      else alert(data.error?.message || 'Gagal hapus');
    } catch { alert('Terjadi kesalahan'); }
  };

  const getItemsByKategori = (kat: string) =>
    (apbdes?.items || []).filter(i => i.kategori === kat);

  const calcTotal = (kat: string) =>
    getItemsByKategori(kat).reduce((s, i) => s + i.realization, 0);

  const calcAnggaran = (kat: string) =>
    getItemsByKategori(kat).reduce((s, i) => s + i.anggaran, 0);

  if (loading) return <AdminLayout><LoadingState message="Memuat..." fullPage /></AdminLayout>;
  if (error) return <AdminLayout><ErrorState title="Gagal" message={error} onRetry={() => apbdes ? fetchDetail(apbdes.id) : fetchApbdesList()} /></AdminLayout>;

  const categories = [
    { key: 'PENDAPATAN', label: 'Pendapatan', color: '#3b82f6' },
    { key: 'BELANJA', label: 'Belanja', color: '#f59e0b' },
    { key: 'PEMBIAYAAN', label: 'Pembiayaan', color: '#10b981' },
  ];

  return (
    <AdminLayout>
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
              onChange={e => handleTahunChange(e.target.value)}
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
          onClose={() => setShowItemModal(false)}
          title={editingItem ? 'Edit Rincian' : 'Tambah Rincian APBDes'}
        >
          <form onSubmit={handleItemSubmit} className={styles.itemForm}>
            {itemError && <div className={styles.formError}>{itemError}</div>}
            <Select
              label="Kategori"
              value={itemForm.kategori}
              onChange={e => setItemForm(f => ({ ...f, kategori: e.target.value as typeof f.kategori }))}
              options={KATEGORI_OPTIONS}
              required
            />
            <Input
              label="Nama Rincian"
              value={itemForm.nama}
              onChange={e => setItemForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Contoh: Pajak Bumi dan Bangunan"
              required
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
              <Button type="button" variant="outline" onClick={() => setShowItemModal(false)}>Batal</Button>
              <Button type="submit" disabled={itemLoading}>
                {itemLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
