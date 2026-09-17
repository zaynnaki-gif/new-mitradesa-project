import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Modal, Input, Select } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { perencanaanService, Rpjmdes } from '@/services/perencanaan.service';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './RpjmdesPage.module.css';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'SELESAI', label: 'Selesai' },
];

export default function RpjmdesPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  
  const [data, setData] = useState<Rpjmdes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    periodeMulai: new Date().getFullYear().toString(),
    periodeSelesai: (new Date().getFullYear() + 6).toString(),
    visi: '',
    misi: '',
    status: 'DRAFT',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await perencanaanService.getRpjmdesList(token!);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data RPJMDes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleOpenForm = (item?: Rpjmdes) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        periodeMulai: item.periodeMulai.toString(),
        periodeSelesai: item.periodeSelesai.toString(),
        visi: item.visi || '',
        misi: item.misi || '',
        status: item.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        periodeMulai: new Date().getFullYear().toString(),
        periodeSelesai: (new Date().getFullYear() + 6).toString(),
        visi: '',
        misi: '',
        status: 'DRAFT',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        periodeMulai: parseInt(formData.periodeMulai, 10),
        periodeSelesai: parseInt(formData.periodeSelesai, 10),
        visi: formData.visi,
        misi: formData.misi,
        status: formData.status as 'DRAFT' | 'AKTIF' | 'SELESAI',
      };

      if (editingId) {
        await perencanaanService.updateRpjmdes(token!, editingId, payload);
      } else {
        await perencanaanService.createRpjmdes(token!, payload);
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus RPJMDes',
      message: 'Apakah Anda yakin ingin menghapus data ini? Semua bidang dan RKPDes terkait juga akan terhapus.',
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
    });

    if (isConfirmed) {
      try {
        await perencanaanService.deleteRpjmdes(token!, id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className={`${styles.statusBadge} ${styles.statusDraft}`}>Draft</span>;
      case 'AKTIF': return <span className={`${styles.statusBadge} ${styles.statusAktif}`}>Aktif</span>;
      case 'SELESAI': return <span className={`${styles.statusBadge} ${styles.statusSelesai}`}>Selesai</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>RPJMDes</h1>
            <p>Rencana Pembangunan Jangka Menengah Desa (Periode 6 Tahun)</p>
          </div>
          <Button onClick={() => handleOpenForm()}>+ Buat RPJMDes Baru</Button>
        </div>

        <div className={styles.card}>
          {loading ? (
            <LoadingState message="Memuat RPJMDes..." />
          ) : error ? (
            <ErrorState title="Terjadi Kesalahan" message={error} onRetry={fetchData} />
          ) : data.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Belum ada data RPJMDes.</p>
              <Button variant="outline" onClick={() => handleOpenForm()} style={{ marginTop: '12px' }}>
                Buat Sekarang
              </Button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Periode</th>
                  <th>Visi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.periodeMulai} - {item.periodeSelesai}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.visi || '-'}
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className={styles.actions}>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/perencanaan/rpjmdes/${item.id}`)}>
                          Detail & RKPDes
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenForm(item)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !isSubmitting && setShowModal(false)}
        title={editingId ? 'Edit RPJMDes' : 'Buat RPJMDes Baru'}
      >
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Tahun Mulai"
              type="number"
              value={formData.periodeMulai}
              onChange={(e) => setFormData({ ...formData, periodeMulai: e.target.value })}
              required
            />
            <Input
              label="Tahun Selesai"
              type="number"
              value={formData.periodeSelesai}
              onChange={(e) => setFormData({ ...formData, periodeSelesai: e.target.value })}
              required
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Visi Desa</label>
            <textarea
              value={formData.visi}
              onChange={(e) => setFormData({ ...formData, visi: e.target.value })}
              placeholder="Masukkan visi desa..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '80px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Misi Desa</label>
            <textarea
              value={formData.misi}
              onChange={(e) => setFormData({ ...formData, misi: e.target.value })}
              placeholder="Masukkan misi desa..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '120px' }}
              required
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={STATUS_OPTIONS}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {ConfirmElement}
    </AdminLayout>
  );
}
