import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { Button, Input, Select, Modal, Badge } from '@/components/ui';
import { safeFetchJson } from '@/lib/fetch';
import styles from './BlankoListPage.module.css';

interface Blanko {
  id: string;
  nama: string;
  paperSize: string;
  isDefault: boolean;
  createdAt: string;
}

export default function BlankoListPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [blankoList, setBlankoList] = useState<Blanko[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newBlanko, setNewBlanko] = useState({
    nama: '',
    paperSize: 'F4',
  });

  const loadBlanko = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await safeFetchJson(`${API_URL}/blanko`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!data.data) {
        throw new Error(data.message || 'Gagal memuat blanko');
      }

      setBlankoList(data.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBlanko();
  }, [loadBlanko]);

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      const res = await safeFetchJson(`${API_URL}/blanko`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newBlanko,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
          layout: []
        }),
      });

      if (!res.data) throw new Error(res.message || 'Gagal membuat blanko');
      
      setShowCreateModal(false);
      navigate(`/admin/surat/blanko/${res.data.id}/builder`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Terjadi kesalahan saat membuat blanko');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!window.confirm('Jadikan blanko ini sebagai default?')) return;
    try {
      await safeFetchJson(`${API_URL}/blanko/${id}/set-default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadBlanko();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Gagal set default');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus blanko ini?')) return;
    try {
      await safeFetchJson(`${API_URL}/blanko/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadBlanko();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus');
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Blanko Surat</h1>
            <p className={styles.description}>Kelola master blanko dan kop surat desa</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ Buat Blanko</Button>
        </div>

        {error && <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>}

        <div className={styles.card}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-3">Nama Blanko</th>
                <th className="p-3">Ukuran Kertas</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center">Memuat data...</td>
                </tr>
              ) : blankoList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center">Belum ada blanko.</td>
                </tr>
              ) : (
                blankoList.map((blanko) => (
                  <tr key={blanko.id} className="border-b">
                    <td className="p-3">{blanko.nama}</td>
                    <td className="p-3">{blanko.paperSize}</td>
                    <td className="p-3">
                      {blanko.isDefault ? (
                        <Badge color="success">Default</Badge>
                      ) : (
                        <Badge color="secondary">Opsional</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className={styles.actionButtons}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/admin/surat/blanko/${blanko.id}/builder`)}
                        >
                          Desain
                        </Button>
                        {!blanko.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(blanko.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDelete(blanko.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Buat Blanko Baru"
      >
        <div className={styles.formGroup}>
          <label>Nama Blanko</label>
          <Input
            value={newBlanko.nama}
            onChange={(e) => setNewBlanko({ ...newBlanko, nama: e.target.value })}
            placeholder="Contoh: Kop Garuda Resmi"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Ukuran Kertas</label>
          <Select
            value={newBlanko.paperSize}
            onChange={(e) => setNewBlanko({ ...newBlanko, paperSize: e.target.value })}
            options={[
              { label: 'F4 (Folio)', value: 'F4' },
              { label: 'A4', value: 'A4' },
            ]}
          />
        </div>
        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Batal
          </Button>
          <Button onClick={handleCreate} disabled={!newBlanko.nama || createLoading}>
            {createLoading ? 'Menyimpan...' : 'Buat & Lanjut ke Desainer'}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
