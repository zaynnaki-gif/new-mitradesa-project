import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Modal, Input, Select } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { votingService, Voting } from '@/services/voting.service';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './VotingPage.module.css';

const STATUS_OPTIONS = [
  { value: 'MENDATANG', label: 'Akan Datang' },
  { value: 'BERLANGSUNG', label: 'Berlangsung' },
  { value: 'SELESAI', label: 'Selesai' },
];

export default function VotingPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  
  const [data, setData] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Format current datetime for input type="datetime-local"
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultStartTime = now.toISOString().slice(0, 16);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultEndTime = tomorrow.toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    waktuMulai: defaultStartTime,
    waktuSelesai: defaultEndTime,
    status: 'MENDATANG',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await votingService.getAdminVotingList(token!);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Voting');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleOpenForm = (item?: Voting) => {
    if (item) {
      setEditingId(item.id);
      
      const start = new Date(item.waktuMulai);
      start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
      
      const end = new Date(item.waktuSelesai);
      end.setMinutes(end.getMinutes() - end.getTimezoneOffset());

      setFormData({
        judul: item.judul,
        deskripsi: item.deskripsi || '',
        waktuMulai: start.toISOString().slice(0, 16),
        waktuSelesai: end.toISOString().slice(0, 16),
        status: item.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        judul: '',
        deskripsi: '',
        waktuMulai: defaultStartTime,
        waktuSelesai: defaultEndTime,
        status: 'MENDATANG',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        judul: formData.judul,
        deskripsi: formData.deskripsi,
        waktuMulai: new Date(formData.waktuMulai).toISOString(),
        waktuSelesai: new Date(formData.waktuSelesai).toISOString(),
        status: formData.status as 'MENDATANG' | 'BERLANGSUNG' | 'SELESAI',
      };

      if (editingId) {
        await votingService.updateVoting(token!, editingId, payload);
      } else {
        await votingService.createVoting(token!, payload);
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
      title: 'Hapus Voting',
      message: 'Apakah Anda yakin ingin menghapus data ini? Semua kandidat dan suara yang masuk akan terhapus secara permanen.',
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
    });

    if (isConfirmed) {
      try {
        await votingService.deleteVoting(token!, id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MENDATANG': return <span className={`${styles.statusBadge} ${styles.statusDraft}`}>Akan Datang</span>;
      case 'BERLANGSUNG': return <span className={`${styles.statusBadge} ${styles.statusAktif}`}>Berlangsung</span>;
      case 'SELESAI': return <span className={`${styles.statusBadge} ${styles.statusSelesai}`}>Selesai</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>E-Voting</h1>
            <p>Kelola pemilihan digital dan pemungutan suara warga</p>
          </div>
          <Button onClick={() => handleOpenForm()}>+ Buat Voting Baru</Button>
        </div>

        <div className={styles.card}>
          {loading ? (
            <LoadingState message="Memuat data voting..." />
          ) : error ? (
            <ErrorState title="Terjadi Kesalahan" message={error} onRetry={fetchData} />
          ) : data.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Belum ada acara voting.</p>
              <Button variant="outline" onClick={() => handleOpenForm()} style={{ marginTop: '12px' }}>
                Buat Sekarang
              </Button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Judul</th>
                  <th>Jadwal Pelaksanaan</th>
                  <th>Total Suara</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.judul}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        {item.kandidat?.length || 0} Kandidat
                      </div>
                    </td>
                    <td style={{ fontSize: 14 }}>
                      <div>Mulai: {new Date(item.waktuMulai).toLocaleString('id-ID')}</div>
                      <div>Akhir: {new Date(item.waktuSelesai).toLocaleString('id-ID')}</div>
                    </td>
                    <td>{item._count?.suara || 0}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className={styles.actions}>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/perencanaan/voting/${item.id}`)}>
                          Detail & Kandidat
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
        title={editingId ? 'Edit Voting' : 'Buat Voting Baru'}
      >
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <Input
            label="Judul Voting"
            value={formData.judul}
            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
            placeholder="Contoh: Pemilihan Ketua RT 01"
            required
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Deskripsi (Opsional)</label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Penjelasan singkat tentang voting ini..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Waktu Mulai"
              type="datetime-local"
              value={formData.waktuMulai}
              onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
              required
            />
            <Input
              label="Waktu Selesai"
              type="datetime-local"
              value={formData.waktuSelesai}
              onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
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
