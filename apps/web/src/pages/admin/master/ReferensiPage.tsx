import { AdminLayout } from '@/layouts';
import { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { LoadingState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from './ReferensiPage.module.css';

type TabType = 'agama' | 'golongan_darah' | 'status_perkawinan' | 'hubungan_keluarga' | 'pendidikan' | 'pekerjaan' | 'status_kependudukan' | 'jabatan_perangkat' | 'status_perangkat';

interface RefItem {
  id: string;
  kode: string;
  nama: string;
  isAktif?: boolean;
  jenjang?: number;
  kategori?: string;
  urutan?: number;
}

interface RefFormData {
  kode: string;
  nama: string;
  isAktif?: boolean;
  jenjang?: number;
  kategori?: string;
  urutan?: number;
}

const TABS: { id: TabType; label: string; apiEndpoint: string }[] = [
  { id: 'agama', label: 'Agama', apiEndpoint: '/reference/agama' },
  { id: 'golongan_darah', label: 'Gol. Darah', apiEndpoint: '/reference/gol-darah' },
  { id: 'status_perkawinan', label: 'Status Perkawinan', apiEndpoint: '/reference/status-perkawinan' },
  { id: 'hubungan_keluarga', label: 'Hub. Keluarga', apiEndpoint: '/reference/hubungan-keluarga' },
  { id: 'pendidikan', label: 'Pendidikan', apiEndpoint: '/reference/pendidikan' },
  { id: 'pekerjaan', label: 'Pekerjaan', apiEndpoint: '/reference/pekerjaan' },
  { id: 'status_kependudukan', label: 'Status Kependudukan', apiEndpoint: '/reference/status-kependudukan' },
  { id: 'jabatan_perangkat', label: 'Jabatan Perangkat', apiEndpoint: '/reference/jabatan-perangkat' },
  { id: 'status_perangkat', label: 'Status Perangkat', apiEndpoint: '/reference/status-perangkat' },
];

export default function ReferensiPage() {
  const { token } = useAuthStore();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('agama');
  const [items, setItems] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RefItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<RefFormData>({ kode: '', nama: '', isAktif: true });

  const currentTab = TABS.find(t => t.id === activeTab)!;

  // Fetch data
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(`${API_URL}${currentTab.apiEndpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (data.success) {
        setItems(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      kode: '',
      nama: '',
      isAktif: true,
      ...(activeTab === 'pendidikan' && { jenjang: 0 }),
      ...(activeTab === 'jabatan_perangkat' && { urutan: 0 }),
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (item: RefItem) => {
    setEditingItem(item);
    setFormData({
      kode: item.kode,
      nama: item.nama,
      isAktif: item.isAktif ?? true,
      jenjang: item.jenjang,
      kategori: item.kategori,
      urutan: item.urutan,
    });
    setShowModal(true);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Reference API uses kode, not id
      const url = editingItem
        ? `${API_URL}${currentTab.apiEndpoint}/${encodeURIComponent(editingItem.kode)}`
        : `${API_URL}${currentTab.apiEndpoint}`;
      const method = editingItem ? 'PATCH' : 'POST';

      const data = await safeFetchJson(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (data.success) {
        setShowModal(false);
        fetchData();
      } else {
        alert(data.error?.message || 'Terjadi kesalahan');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete
  const handleDelete = async (item: RefItem) => {
    if (!confirm(`Yakin ingin menghapus "${item.nama}"?`)) return;

    try {
      const data = await safeFetchJson(`${API_URL}${currentTab.apiEndpoint}/${encodeURIComponent(item.kode)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (data.success) {
        fetchData();
      } else {
        alert(data.error?.message || 'Gagal menghapus');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  // Toggle active (PATCH with inverse isAktif)
  const handleToggle = async (item: RefItem) => {
    try {
      const data = await safeFetchJson(`${API_URL}${currentTab.apiEndpoint}/${encodeURIComponent(item.kode)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isAktif: !item.isAktif }),
      });
      if (data.success) {
        fetchData();
      }
    } catch {
      console.error('Failed to toggle');
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Data Referensi</h1>
          <p className={styles.subtitle}>Kelola data referensi master sistem</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <h3>{currentTab.label}</h3>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            + Tambah
          </Button>
        </div>

        {loading ? (
          <LoadingState message="Memuat data..." />
        ) : items.length === 0 ? (
          <div className={styles.empty}>Tidak ada data</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  {activeTab === 'pendidikan' && <th>Jenjang</th>}
                  {activeTab === 'jabatan_perangkat' && <th>Kategori</th>}
                  {activeTab === 'jabatan_perangkat' && <th>Urutan</th>}
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className={styles.kode}>{item.kode}</td>
                    <td>{item.nama}</td>
                    {activeTab === 'pendidikan' && <td>{item.jenjang}</td>}
                    {activeTab === 'jabatan_perangkat' && <td>{item.kategori}</td>}
                    {activeTab === 'jabatan_perangkat' && <td>{item.urutan}</td>}
                    <td>
                      <button
                        className={`${styles.toggle} ${item.isAktif ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => handleToggle(item)}
                      >
                        {item.isAktif ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className={styles.actions}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? `Edit ${currentTab.label}` : `Tambah ${currentTab.label}`}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Kode"
            value={formData.kode}
            onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
            required
            placeholder="Contoh: ISLAM"
          />
          <Input
            label="Nama"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            required
            placeholder="Contoh: Islam"
          />
          {activeTab === 'pendidikan' && (
            <Input
              label="Jenjang"
              type="number"
              value={formData.jenjang || ''}
              onChange={(e) => setFormData({ ...formData, jenjang: parseInt(e.target.value) || 0 })}
              required
            />
          )}
          {activeTab === 'jabatan_perangkat' && (
            <>
              <Input
                label="Kategori"
                value={formData.kategori || ''}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                required
                placeholder="Contoh: Struktural"
              />
              <Input
                label="Urutan"
                type="number"
                value={formData.urutan || ''}
                onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })}
                required
              />
            </>
          )}
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
