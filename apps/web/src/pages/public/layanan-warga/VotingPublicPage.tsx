import { useState, useEffect, useCallback } from 'react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button, Modal, Input } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { votingService, Voting, VotingKandidat } from '@/services/voting.service';
import styles from './VotingPublicPage.module.css';

export default function VotingPublicPage() {
  const [data, setData] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voting Modal
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedVoting, setSelectedVoting] = useState<Voting | null>(null);
  const [selectedKandidat, setSelectedKandidat] = useState<VotingKandidat | null>(null);
  const [voteNik, setVoteNik] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await votingService.getPublicVotingList();
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data E-Voting');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoting || !selectedKandidat || !voteNik) return;

    try {
      setIsVoting(true);
      await votingService.castVote(selectedVoting.id, selectedKandidat.id, voteNik);
      
      setShowVoteModal(false);
      fetchData(); // Refresh data to get latest votes
      alert('Terima kasih! Suara Anda berhasil direkam.');
    } catch (err: any) {
      alert(err.message || 'Gagal memberikan suara. Pastikan NIK Anda valid dan belum pernah memilih pada sesi ini.');
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BERLANGSUNG': return <span className={`${styles.statusBadge} ${styles.statusAktif}`}>Berlangsung</span>;
      case 'SELESAI': return <span className={`${styles.statusBadge} ${styles.statusSelesai}`}>Selesai</span>;
      case 'MENDATANG': return <span className={`${styles.statusBadge} ${styles.statusDraft}`}>Akan Datang</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <PublicLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>E-Voting Warga</h1>
          <p>Berikan hak suara Anda secara digital, transparan, dan rahasia</p>
        </div>

        {loading ? (
          <LoadingState message="Memuat acara pemilihan..." />
        ) : error ? (
          <ErrorState title="Error" message={error} onRetry={fetchData} />
        ) : data.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Belum Ada Acara Pemilihan</h3>
            <p>Saat ini tidak ada sesi e-voting yang sedang berlangsung.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {data.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.title}>{item.judul}</h2>
                  {getStatusBadge(item.status)}
                </div>

                <div className={styles.metaInfo}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Mulai:</span>
                    <span>{new Date(item.waktuMulai).toLocaleString('id-ID')}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Berakhir:</span>
                    <span>{new Date(item.waktuSelesai).toLocaleString('id-ID')}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Kandidat:</span>
                    <span>{item.kandidat?.length || 0} Calon</span>
                  </div>
                </div>
                
                <p className={styles.description}>{item.deskripsi}</p>
                
                {item.status !== 'MENDATANG' && item.kandidat && item.kandidat.length > 0 && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Kandidat Program/Kegiatan</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {item.kandidat.map(k => (
                        <div key={k.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a8a', width: '32px', textAlign: 'center' }}>
                            {k.nomorUrut}
                          </div>
                          {k.fotoUrl ? (
                            <img src={k.fotoUrl} alt={k.nama} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                          ) : (
                            <div style={{ width: '80px', height: '80px', background: '#e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                              🗳️
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>{k.nama}</div>
                            {k.visiMisi && <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>{k.visiMisi}</div>}
                            {item.status === 'SELESAI' && (
                              <div style={{ marginTop: '8px', fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '12px' }}>
                                Perolehan: {k._count?.suara || 0} Suara
                              </div>
                            )}
                          </div>
                          {item.status === 'BERLANGSUNG' && (
                            <Button
                              onClick={() => {
                                setSelectedVoting(item);
                                setSelectedKandidat(k);
                                setVoteNik('');
                                setShowVoteModal(true);
                              }}
                            >
                              Pilih
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Vote */}
      <Modal
        isOpen={showVoteModal}
        onClose={() => !isVoting && setShowVoteModal(false)}
        title="Konfirmasi Pilihan"
      >
        <form onSubmit={handleSubmitVote} className={styles.votingModalContent}>
          <p style={{ fontSize: 14, color: '#4b5563' }}>
            Anda akan memberikan suara untuk kandidat berikut:
          </p>

          {selectedKandidat && (
            <div className={styles.selectedKandidatInfo}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1e3a8a', width: 40, textAlign: 'center' }}>
                {selectedKandidat.nomorUrut}
              </div>
              {selectedKandidat.fotoUrl ? (
                <img src={selectedKandidat.fotoUrl} alt={selectedKandidat.nama} />
              ) : (
                <div style={{ width: 60, height: 60, background: '#d1d5db', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  👤
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedKandidat.nama}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Kandidat No. {selectedKandidat.nomorUrut}</div>
              </div>
            </div>
          )}

          <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '14px', marginTop: '8px' }}>
            ⚠️ <strong>Perhatian:</strong> Pilihan Anda tidak dapat diubah setelah dikirim. Kerahasiaan suara Anda dijamin oleh sistem.
          </div>

          <Input
            label="NIK (Nomor Induk Kependudukan)"
            value={voteNik}
            onChange={(e) => setVoteNik(e.target.value)}
            placeholder="Masukkan 16 digit NIK Anda"
            required
            maxLength={16}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => setShowVoteModal(false)} disabled={isVoting}>
              Batal
            </Button>
            <Button type="submit" loading={isVoting}>
              Konfirmasi & Pilih
            </Button>
          </div>
        </form>
      </Modal>
    </PublicLayout>
  );
}
