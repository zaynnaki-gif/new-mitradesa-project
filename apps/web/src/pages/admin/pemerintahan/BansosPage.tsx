import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './BansosPage.module.css';

// ============================================
// Types
// ============================================

interface Bansos {
  id: string;
  nama: string;
  jenis: string;
  tahun: number;
  periode?: string;
  jumlahPenerima: number;
  jumlahDana: number;
  createdAt: string;
  updatedAt: string;
}

interface BansosStats {
  tahunBerjalan: number;
  summary: {
    totalProgram: number;
    totalPenerima: number;
    totalDana: number;
  };
  yearly: Array<{
    tahun: number;
    programCount: number;
    totalPenerima: number;
    totalDana: number;
  }>;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const JENIS_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'BLT', label: 'BLT' },
  { value: 'PKH', label: 'PKH' },
  { value: 'BPNT', label: 'BPNT' },
  { value: 'BST', label: 'BST' },
  { value: 'PKTD', label: 'PKTD' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const formatRupiah = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
};

export default function BansosPage() {
  const { token } = useAuthStore();

  // ============================================
  // State
  // ============================================
  const [items, setItems] = useState<Bansos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<BansosStats | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Bansos | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    jenis: '',
    tahun: new Date().getFullYear(),
    periode: '',
    jumlahPenerima: 0,
    jumlahDana: 0,
  });

  // ============================================
  // Fetch Data
  // ============================================
  const fetchData = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (jenis) params.append('jenis', jenis);
      if (tahun) params.append('tahun', tahun);

      const res = await fetch(`${API_URL}/bansos?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Gagal mengambil data');

      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
        setPagination(data.meta || null);
      } else {
        throw new Error(data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/bansos/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchStats();
    }
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1);
  };

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  // ============================================
  // Modal Handlers
  // ============================================
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      nama: '',
      jenis: '',
      tahun: new Date().getFullYear(),
      periode: '',
      jumlahPenerima: 0,
      jumlahDana: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (item: Bansos) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      jenis: item.jenis,
      tahun: item.tahun,
      periode: item.periode || '',
      jumlahPenerima: item.jumlahPenerima,
      jumlahDana: item.jumlahDana,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingItem
        ? `${API_URL}/bansos/${editingItem.id}`
        : `${API_URL}/bansos`;

      const method = editingItem ? 'PATCH' : 'POST';

      const payload = {
        nama: formData.nama,
        jenis: formData.jenis,
        tahun: formData.tahun,
        periode: formData.periode || undefined,
        jumlahPenerima: formData.jumlahPenerima,
        jumlahDana: formData.jumlahDana,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchData(pagination?.page || 1);
        fetchStats();
      } else {
        alert(data.message || 'Gagal menyimpan data');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;

    try {
      const res = await fetch(`${API_URL}/bansos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchData(pagination?.page || 1);
        fetchStats();
      } else {
        alert('Gagal menghapus data');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Bantuan Sosial</h1>
            <p className={styles.subtitle}>
              {pagination?.total || 0} program bansos | Tahun {tahun}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="primary" onClick={openCreateModal}>
              + Tambah Program
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Program Tahun {stats.tahunBerjalan}</span>
              <span className={styles.statValue}>{stats.summary.totalProgram}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Penerima</span>
              <span className={styles.statValue}>{stats.summary.totalPenerima.toLocaleString('id-ID')} Orang</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Dana</span>
              <span className={`${styles.statValue} ${styles.money}`}>
                {formatRupiah(stats.summary.totalDana)}
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Cari nama program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              style={{ width: 180 }}
            >
              {JENIS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="Tahun"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              style={{ width: 120 }}
            />
            <Button type="submit">Cari</Button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data bansos..." fullPage />
        ) : error ? (
          <ErrorState
            title="Gagal Memuat Data"
            message={error}
            onRetry={() => fetchData()}
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama Program</th>
                    <th>Jenis</th>
                    <th>Tahun</th>
                    <th>Periode</th>
                    <th>Penerima</th>
                    <th>Jumlah Dana</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        Tidak ada data bantuan sosial
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className={styles.nama}>{item.nama}</td>
                        <td><Badge>{item.jenis}</Badge></td>
                        <td>{item.tahun}</td>
                        <td>{item.periode || '-'}</td>
                        <td>{item.jumlahPenerima.toLocaleString('id-ID')} orang</td>
                        <td className={styles.rupiah}>{formatRupiah(item.jumlahDana)}</td>
                        <td className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
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

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                disabled={loading}
              />
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editingItem ? 'Edit Program Bansos' : 'Tambah Program Bansos'}</h2>
                <button onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <Input
                    label="Nama Program *"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                    placeholder="Contoh: BLT Dana Desa 2024"
                  />
                  <Select
                    label="Jenis Bansos *"
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    required
                  >
                    <option value="">Pilih Jenis</option>
                    <option value="BLT">BLT</option>
                    <option value="PKH">PKH</option>
                    <option value="BPNT">BPNT</option>
                    <option value="BST">BST</option>
                    <option value="PKTD">PKTD</option>
                    <option value="LAINNYA">Lainnya</option>
                  </Select>
                  <Input
                    label="Tahun *"
                    type="number"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) || new Date().getFullYear() })}
                    required
                  />
                  <Input
                    label="Periode"
                    value={formData.periode}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    placeholder="Contoh: Triwulan 1"
                  />
                  <Input
                    label="Jumlah Penerima (Orang)"
                    type="number"
                    value={formData.jumlahPenerima}
                    onChange={(e) => setFormData({ ...formData, jumlahPenerima: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Jumlah Dana (Rp)"
                    type="number"
                    value={formData.jumlahDana}
                    onChange={(e) => setFormData({ ...formData, jumlahDana: parseFloat(e.target.value) || 0 })}
                  />
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
