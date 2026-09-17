import { useState, useEffect } from 'react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Container, Button, Input, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { usulanService, UsulanOnline } from '@/services/usulan.service';
import styles from './UsulanPublicPage.module.css';

export default function UsulanPublicPage() {
  const [data, setData] = useState<UsulanOnline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Buat Usulan
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    judul: '',
    deskripsi: '',
    nik: ''
  });

  // Dukungan Modal
  const [showDukungModal, setShowDukungModal] = useState(false);
  const [dukungUsulanId, setDukungUsulanId] = useState<string | null>(null);
  const [dukungNik, setDukungNik] = useState('');
  const [isDukungSubmitting, setIsDukungSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await usulanService.getPublicUsulanList();
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat usulan warga');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await usulanService.submitPublicUsulan(addForm);
      setShowAddModal(false);
      setAddForm({ judul: '', deskripsi: '', nik: '' });
      fetchData();
      alert('Usulan berhasil dikirim! Silakan tunggu peninjauan dari perangkat desa.');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim usulan. Pastikan NIK Anda valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDukung = (id: string) => {
    setDukungUsulanId(id);
    setDukungNik('');
    setShowDukungModal(true);
  };

  const handleSubmitDukung = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dukungUsulanId || !dukungNik) return;

    try {
      setIsDukungSubmitting(true);
      await usulanService.addDukungan(dukungUsulanId, dukungNik);
      setShowDukungModal(false);
      fetchData();
      alert('Terima kasih atas dukungan Anda!');
    } catch (err: any) {
      alert(err.message || 'Gagal memberikan dukungan. Pastikan NIK valid dan belum pernah mendukung usulan ini.');
    } finally {
      setIsDukungSubmitting(false);
    }
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
    <PublicLayout>
      <Container className={styles.container}>
        <div className={styles.header}>
          <h1>Usulan Pembangunan Desa</h1>
          <p>Sampaikan aspirasi dan ide Anda untuk kemajuan desa kita bersama</p>
        </div>

        <div className={styles.actionSection}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Daftar Usulan Warga</div>
          <Button onClick={() => setShowAddModal(true)}>+ Buat Usulan Baru</Button>
        </div>

        {loading ? (
          <LoadingState message="Memuat usulan warga..." />
        ) : error ? (
          <ErrorState title="Error" message={error} onRetry={fetchData} />
        ) : data.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Belum Ada Usulan</h3>
            <p>Jadilah yang pertama menyampaikan ide pembangunan untuk desa kita.</p>
            <Button onClick={() => setShowAddModal(true)}>Buat Usulan Sekarang</Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {data.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.title}>{item.judul}</h3>
                    <div className={styles.author}>Oleh: {item.penduduk?.nama || 'Warga'}</div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                
                <p className={styles.description}>{item.deskripsi}</p>

                {item.status === 'DITOLAK' && item.alasanDitolak && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>Alasan Penolakan:</div>
                    <div style={{ fontSize: '14px', color: '#7f1d1d' }}>{item.alasanDitolak}</div>
                  </div>
                )}
                
                <div className={styles.cardFooter}>
                  <div className={styles.voteCount}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={item.dukungan > 0 ? "#3b82f6" : "none"} stroke={item.dukungan > 0 ? "#3b82f6" : "currentColor"} strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {item.dukungan} Dukungan
                  </div>
                  
                  {item.status !== 'DITOLAK' && item.status !== 'DITERIMA' && (
                    <Button variant="outline" size="sm" onClick={() => handleOpenDukung(item.id)}>
                      Dukung Usulan
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Modal Tambah Usulan */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isSubmitting && setShowAddModal(false)}
        title="Sampaikan Usulan Pembangunan"
      >
        <form onSubmit={handleSubmitAdd} className={styles.modalContent}>
          <div style={{ padding: '12px', background: '#eff6ff', color: '#1e3a8a', borderRadius: '8px', fontSize: '14px', marginBottom: '8px' }}>
            ℹ️ Untuk menghindari spam, pastikan Anda memasukkan <strong>NIK</strong> Anda yang terdaftar sebagai warga desa.
          </div>

          <Input
            label="NIK (Nomor Induk Kependudukan)"
            value={addForm.nik}
            onChange={(e) => setAddForm({ ...addForm, nik: e.target.value })}
            placeholder="Masukkan 16 digit NIK Anda"
            required
            maxLength={16}
          />
          <Input
            label="Judul Usulan"
            value={addForm.judul}
            onChange={(e) => setAddForm({ ...addForm, judul: e.target.value })}
            placeholder="Contoh: Perbaikan Jalan Lingkungan RW 02"
            required
          />
          <div className={styles.inputGroup}>
            <label>Deskripsi Detail</label>
            <textarea
              value={addForm.deskripsi}
              onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })}
              placeholder="Ceritakan mengapa usulan ini penting dan lokasi pastinya..."
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '120px' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Kirim Usulan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Dukung */}
      <Modal
        isOpen={showDukungModal}
        onClose={() => !isDukungSubmitting && setShowDukungModal(false)}
        title="Dukung Usulan Ini"
      >
        <form onSubmit={handleSubmitDukung} className={styles.modalContent}>
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 16 }}>
            Silakan masukkan NIK Anda untuk memverifikasi dukungan. Satu warga hanya dapat mendukung satu usulan sebanyak satu kali.
          </p>

          <Input
            label="NIK (Nomor Induk Kependudukan)"
            value={dukungNik}
            onChange={(e) => setDukungNik(e.target.value)}
            placeholder="Masukkan 16 digit NIK Anda"
            required
            maxLength={16}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => setShowDukungModal(false)} disabled={isDukungSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isDukungSubmitting}>
              Kirim Dukungan
            </Button>
          </div>
        </form>
      </Modal>
    </PublicLayout>
  );
}
