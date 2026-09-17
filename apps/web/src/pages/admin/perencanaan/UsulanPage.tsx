import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Modal, Select } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { usulanService, UsulanOnline } from '@/services/usulan.service';
import { perencanaanService, Rpjmdes } from '@/services/perencanaan.service';
import { Input } from '@/components/ui';
import styles from './UsulanPage.module.css';

const STATUS_OPTIONS = [
  { value: 'DIAJUKAN', label: 'Diajukan' },
  { value: 'DITINJAU', label: 'Ditinjau' },
  { value: 'DITERIMA', label: 'Diterima' },
  { value: 'DITOLAK', label: 'Ditolak' },
];

export default function UsulanPage() {
  const { token } = useAuthStore();
  
  const [data, setData] = useState<UsulanOnline[]>([]);
  const [rpjmdesList, setRpjmdesList] = useState<Rpjmdes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Update Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsulan, setSelectedUsulan] = useState<UsulanOnline | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: 'DIAJUKAN',
    rkpdesId: '',
    rpjmdesBidangId: '',
    alasanDitolak: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resUsulan, resRpjmdes] = await Promise.all([
        usulanService.getAdminUsulanList(token!),
        perencanaanService.getRpjmdesList(token!)
      ]);
      if (resUsulan.success) setData(resUsulan.data);
      if (resRpjmdes.success) setRpjmdesList(resRpjmdes.data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleOpenStatus = (item: UsulanOnline) => {
    setSelectedUsulan(item);
    setStatusForm({
      status: item.status,
      rkpdesId: item.rkpdesId || '',
      rpjmdesBidangId: item.rpjmdesBidangId || '',
      alasanDitolak: item.alasanDitolak || ''
    });
    setShowStatusModal(true);
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsulan) return;
    
    if (statusForm.status === 'DITERIMA' && !statusForm.rkpdesId && !statusForm.rpjmdesBidangId) {
      alert('Pilih Bidang RPJMDes untuk usulan ini agar masuk ke RKPDes secara otomatis');
      return;
    }
    
    if (statusForm.status === 'DITOLAK' && !statusForm.alasanDitolak) {
      alert('Alasan ditolak wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await usulanService.updateUsulanStatus(token!, selectedUsulan.id, {
        status: statusForm.status as 'DITINJAU' | 'DITERIMA' | 'DITOLAK',
        rkpdesId: statusForm.rkpdesId || undefined,
        rpjmdesBidangId: statusForm.rpjmdesBidangId || undefined,
        alasanDitolak: statusForm.status === 'DITOLAK' ? statusForm.alasanDitolak : undefined
      });
      
      setShowStatusModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status usulan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAktifBidangOptions = () => {
    const aktifRpjmdes = rpjmdesList.find(r => r.status === 'AKTIF');
    if (!aktifRpjmdes || !aktifRpjmdes.bidang) return [];
    return aktifRpjmdes.bidang.map(b => ({ value: b.id, label: b.nama }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DIAJUKAN': return <span className={`${styles.statusBadge} ${styles.statusDiajukan}`}>Diajukan</span>;
      case 'DITINJAU': return <span className={`${styles.statusBadge} ${styles.statusDitinjau}`}>Ditinjau</span>;
      case 'DITERIMA': return <span className={`${styles.statusBadge} ${styles.statusDiterima}`}>Diterima</span>;
      case 'DITOLAK': return <span className={`${styles.statusBadge} ${styles.statusDitolak}`}>Ditolak</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Usulan Warga</h1>
            <p>Daftar aspirasi dan usulan pembangunan dari warga desa</p>
          </div>
        </div>

        <div className={styles.card}>
          {loading ? (
            <LoadingState message="Memuat data usulan..." />
          ) : error ? (
            <ErrorState title="Terjadi Kesalahan" message={error} onRetry={fetchData} />
          ) : data.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Belum ada usulan dari warga.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Warga</th>
                  <th>Usulan</th>
                  <th>Dukungan</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.penduduk?.nama || 'Anonim'}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>NIK: {item.penduduk?.nik || '-'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.judul}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.deskripsi}
                      </div>
                    </td>
                    <td>
                      <div className={styles.dukunganBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {item.dukungan}
                      </div>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td style={{ fontSize: 13 }}>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>
                      <Button variant="outline" size="sm" onClick={() => handleOpenStatus(item)}>
                        Ubah Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={showStatusModal}
        onClose={() => !isSubmitting && setShowStatusModal(false)}
        title="Ubah Status Usulan"
      >
        <form onSubmit={handleSubmitStatus} className={styles.formGrid}>
          {selectedUsulan && (
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedUsulan.judul}</div>
              <div style={{ fontSize: 13, color: '#4b5563' }}>{selectedUsulan.deskripsi}</div>
            </div>
          )}

          <Select
            label="Status"
            value={statusForm.status}
            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            options={STATUS_OPTIONS}
          />
          
          {statusForm.status === 'DITERIMA' && !statusForm.rkpdesId && (
            <div style={{ marginTop: '12px' }}>
              <Select
                label="Bidang RPJMDes"
                value={statusForm.rpjmdesBidangId}
                onChange={(e) => setStatusForm({ ...statusForm, rpjmdesBidangId: e.target.value })}
                options={[
                  { value: '', label: 'Pilih Bidang (Wajib)' },
                  ...getAktifBidangOptions()
                ]}
              />
              <div style={{ fontSize: 13, color: '#059669', padding: '8px 12px', background: '#ecfdf5', borderRadius: '6px', marginTop: '4px' }}>
                💡 Memilih bidang akan otomatis mendaftarkan usulan ini sebagai kandidat RKPDes tahun depan.
              </div>
            </div>
          )}

          {statusForm.status === 'DITOLAK' && (
            <div style={{ marginTop: '12px' }}>
              <Input
                label="Alasan Ditolak"
                value={statusForm.alasanDitolak}
                onChange={(e) => setStatusForm({ ...statusForm, alasanDitolak: e.target.value })}
                required
                placeholder="Jelaskan alasan kenapa usulan ditolak..."
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => setShowStatusModal(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
