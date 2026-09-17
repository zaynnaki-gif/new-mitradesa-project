import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Modal, Input, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { votingService, Voting, VotingKandidat } from '@/services/voting.service';
import { perencanaanService } from '@/services/perencanaan.service';
import { useConfirm } from '@/hooks/useConfirm';
import { Select } from '@/components/ui';
import styles from './VotingDetailPage.module.css';

export default function VotingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();

  const [data, setData] = useState<Voting | null>(null);
  const [rkpdesOptions, setRkpdesOptions] = useState<{value: string, label: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Kandidat
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomorUrut: '1',
    nama: '',
    visiMisi: '',
    fotoUrl: '',
    rkpdesId: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [resVoting, resRpjmdes] = await Promise.all([
        votingService.getAdminVotingDetail(token!, id!),
        perencanaanService.getRpjmdesList(token!)
      ]);
      
      if (resVoting.success) {
        setData(resVoting.data);
      }
      
      if (resRpjmdes.success) {
        const aktif = resRpjmdes.data.find((r: any) => r.status === 'AKTIF');
        const options: {value: string, label: string}[] = [];
        if (aktif && aktif.bidang) {
          aktif.bidang.forEach((b: any) => {
            if (b.rkpdes) {
              b.rkpdes.forEach((r: any) => {
                options.push({ value: r.id, label: `[${b.nama}] ${r.namaKegiatan}` });
              });
            }
          });
        }
        setRkpdesOptions(options);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail Voting');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (token && id) fetchData();
  }, [token, id, fetchData]);

  const handleOpenForm = (kandidat?: VotingKandidat) => {
    if (kandidat) {
      setEditingId(kandidat.id);
      setFormData({
        nomorUrut: kandidat.nomorUrut.toString(),
        nama: kandidat.nama,
        visiMisi: kandidat.visiMisi || '',
        fotoUrl: kandidat.fotoUrl || '',
        rkpdesId: kandidat.rkpdesId || ''
      });
    } else {
      setEditingId(null);
      // Auto-increment nomor urut
      const nextNum = (data?.kandidat?.length || 0) + 1;
      setFormData({
        nomorUrut: nextNum.toString(),
        nama: '',
        visiMisi: '',
        fotoUrl: '',
        rkpdesId: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        nomorUrut: parseInt(formData.nomorUrut, 10),
        nama: formData.nama,
        visiMisi: formData.visiMisi,
        fotoUrl: formData.fotoUrl,
        rkpdesId: formData.rkpdesId || undefined
      };

      if (editingId) {
        await votingService.updateKandidat(token!, editingId, payload);
      } else {
        await votingService.addKandidat(token!, id!, payload);
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data kandidat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (kandidatId: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Kandidat',
      message: 'Apakah Anda yakin ingin menghapus kandidat ini? Semua suara untuk kandidat ini akan terhapus.',
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
    });

    if (isConfirmed) {
      try {
        await votingService.deleteKandidat(token!, id!, kandidatId);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus kandidat');
      }
    }
  };

  const handleJadikanApbdes = async (kandidatId: string, kandidatNama: string) => {
    const isConfirmed = await confirm({
      title: 'Jadikan APBDes',
      message: `Apakah Anda yakin ingin memasukkan program "${kandidatNama}" ke dalam APBDes tahun terkait?`,
      confirmLabel: 'Ya, Jadikan APBDes',
    });

    if (isConfirmed) {
      try {
        await votingService.jadikanApbdes(token!, id!, kandidatId);
        alert('Berhasil dimasukkan ke dalam APBDes');
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal mengubah ke APBDes');
      }
    }
  };

  if (loading) return <AdminLayout><LoadingState message="Memuat data voting..." /></AdminLayout>;
  if (error || !data) return <AdminLayout><div style={{ padding: 48 }}><ErrorState title="Error" message={error!} onRetry={fetchData} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/admin/perencanaan/voting')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <h1>{data.judul}</h1>
            <p>{data.deskripsi || 'Pemilihan Digital'}</p>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* INFO CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Informasi Pelaksanaan</h2>
              <Badge color={data.status === 'BERLANGSUNG' ? 'success' : data.status === 'SELESAI' ? 'muted' : 'primary'}>
                {data.status}
              </Badge>
            </div>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Waktu Mulai</span>
                <span className={styles.infoValue}>{new Date(data.waktuMulai).toLocaleString('id-ID')}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Waktu Selesai</span>
                <span className={styles.infoValue}>{new Date(data.waktuSelesai).toLocaleString('id-ID')}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Total Suara Masuk</span>
                <span className={styles.infoValue}>{data._count?.suara || 0} Suara</span>
              </div>
            </div>
          </div>

          {/* KANDIDAT CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Kandidat ({data.kandidat?.length || 0})</h2>
              <Button onClick={() => handleOpenForm()}>+ Tambah Kandidat</Button>
            </div>

            <div className={styles.kandidatGrid}>
              {(!data.kandidat || data.kandidat.length === 0) ? (
                <div className={styles.emptyState}>Belum ada kandidat untuk voting ini.</div>
              ) : (
                data.kandidat.sort((a, b) => a.nomorUrut - b.nomorUrut).map((k) => (
                  <div key={k.id} className={styles.kandidatCard}>
                    <div className={styles.kandidatPhoto}>
                      <div className={styles.kandidatNumber}>{k.nomorUrut}</div>
                      {k.fotoUrl ? (
                        <img src={k.fotoUrl} alt={k.nama} />
                      ) : (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      )}
                    </div>
                    
                    <div className={styles.kandidatInfo}>
                      <div className={styles.kandidatName}>{k.nama}</div>
                      
                      {k.rkpdesId && (
                        <div style={{ fontSize: 12, color: '#059669', background: '#ecfdf5', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', marginBottom: '8px' }}>
                          Terhubung dengan Program (RKPDes)
                        </div>
                      )}
                      
                      <div className={styles.kandidatVisi}>
                        {k.visiMisi ? (
                          k.visiMisi.length > 100 ? `${k.visiMisi.substring(0, 100)}...` : k.visiMisi
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>Belum ada visi & misi</span>
                        )}
                      </div>

                      <div className={styles.kandidatSuara}>
                        <span className={styles.suaraLabel}>Perolehan Suara</span>
                        <span className={styles.suaraCount}>{k._count?.suara || 0}</span>
                      </div>

                      <div className={styles.kandidatActions}>
                        {data.status === 'SELESAI' && k.rkpdesId && k.rkpdes && !k.rkpdes.apbdesItemId && (
                          <Button variant="primary" size="sm" onClick={() => handleJadikanApbdes(k.id, k.nama)}>
                            Jadikan APBDes
                          </Button>
                        )}
                        {data.status === 'SELESAI' && k.rkpdesId && k.rkpdes && k.rkpdes.apbdesItemId && (
                          <Badge color="success">Sudah APBDes</Badge>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleOpenForm(k)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(k.id)}>Hapus</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !isSubmitting && setShowModal(false)}
        title={editingId ? 'Edit Kandidat' : 'Tambah Kandidat'}
      >
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px' }}>
            <Input
              label="Nomor Urut"
              type="number"
              value={formData.nomorUrut}
              onChange={(e) => setFormData({ ...formData, nomorUrut: e.target.value })}
              required
            />
            <Input
              label="Nama Kandidat"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              required
            />
          </div>
          
          <Select
            label="Program (RKPDes)"
            value={formData.rkpdesId}
            onChange={(e) => setFormData({ ...formData, rkpdesId: e.target.value })}
            options={[
              { value: '', label: 'Pilih Program RKPDes (Opsional)' },
              ...rkpdesOptions
            ]}
          />
          
          <Input
            label="URL Foto (Opsional)"
            placeholder="https://..."
            value={formData.fotoUrl}
            onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Visi & Misi (Opsional)</label>
            <textarea
              value={formData.visiMisi}
              onChange={(e) => setFormData({ ...formData, visiMisi: e.target.value })}
              placeholder="Visi dan Misi kandidat..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '100px' }}
            />
          </div>

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
