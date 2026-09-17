import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Modal, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { perencanaanService, Rpjmdes, RpjmdesBidang, Rkpdes } from '@/services/perencanaan.service';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './RpjmdesDetailPage.module.css';

const STATUS_RKPDES_OPTIONS = [
  { value: 'RENCANA', label: 'Rencana' },
  { value: 'BERJALAN', label: 'Berjalan' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'BATAL', label: 'Batal' },
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function RpjmdesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();

  const [data, setData] = useState<Rpjmdes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBidang, setExpandedBidang] = useState<string | null>(null);

  // Modal Bidang
  const [showBidangModal, setShowBidangModal] = useState(false);
  const [isSubmittingBidang, setIsSubmittingBidang] = useState(false);
  const [editingBidang, setEditingBidang] = useState<RpjmdesBidang | null>(null);
  const [bidangForm, setBidangForm] = useState({ nama: '', deskripsi: '' });

  // Modal RKPDes
  const [showRkpdesModal, setShowRkpdesModal] = useState(false);
  const [isSubmittingRkpdes, setIsSubmittingRkpdes] = useState(false);
  const [editingRkpdes, setEditingRkpdes] = useState<Rkpdes | null>(null);
  const [selectedBidangId, setSelectedBidangId] = useState<string | null>(null);
  const [rkpdesForm, setRkpdesForm] = useState({
    tahun: new Date().getFullYear().toString(),
    namaKegiatan: '',
    lokasi: '',
    perkiraanBiaya: '',
    sumberDana: '',
    sasaran: '',
    status: 'RENCANA'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await perencanaanService.getRpjmdesDetail(token!, id!);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail RPJMDes');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (token && id) fetchData();
  }, [token, id, fetchData]);

  // =====================
  // HANDLERS BIDANG
  // =====================
  const handleOpenBidangForm = (bidang?: RpjmdesBidang) => {
    if (bidang) {
      setEditingBidang(bidang);
      setBidangForm({ nama: bidang.nama, deskripsi: bidang.deskripsi || '' });
    } else {
      setEditingBidang(null);
      setBidangForm({ nama: '', deskripsi: '' });
    }
    setShowBidangModal(true);
  };

  const handleSubmitBidang = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingBidang(true);
      if (editingBidang) {
        await perencanaanService.updateBidang(token!, editingBidang.id, bidangForm);
      } else {
        await perencanaanService.createBidang(token!, id!, bidangForm);
      }
      setShowBidangModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan bidang');
    } finally {
      setIsSubmittingBidang(false);
    }
  };

  const handleDeleteBidang = async (bidangId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Hapus Bidang',
      message: 'Anda yakin menghapus bidang ini? RKPDes di dalamnya juga akan terhapus.',
      confirmLabel: 'Hapus',
      variant: 'danger'
    });
    if (isConfirmed) {
      try {
        await perencanaanService.deleteBidang(token!, bidangId);
        fetchData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // =====================
  // HANDLERS RKPDES
  // =====================
  const handleOpenRkpdesForm = (bidangId: string, rkpdes?: Rkpdes, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBidangId(bidangId);
    
    if (rkpdes) {
      setEditingRkpdes(rkpdes);
      setRkpdesForm({
        tahun: rkpdes.tahun.toString(),
        namaKegiatan: rkpdes.namaKegiatan,
        lokasi: rkpdes.lokasi || '',
        perkiraanBiaya: rkpdes.perkiraanBiaya.toString(),
        sumberDana: rkpdes.sumberDana || '',
        sasaran: rkpdes.sasaran || '',
        status: rkpdes.status
      });
    } else {
      setEditingRkpdes(null);
      setRkpdesForm({
        tahun: new Date().getFullYear().toString(),
        namaKegiatan: '',
        lokasi: '',
        perkiraanBiaya: '',
        sumberDana: '',
        sasaran: '',
        status: 'RENCANA'
      });
    }
    setShowRkpdesModal(true);
  };

  const handleSubmitRkpdes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingRkpdes(true);
      const payload = {
        ...rkpdesForm,
        tahun: parseInt(rkpdesForm.tahun, 10),
        perkiraanBiaya: parseInt(rkpdesForm.perkiraanBiaya || '0', 10),
        status: rkpdesForm.status as 'RENCANA'|'BERJALAN'|'SELESAI'|'BATAL'
      };

      if (editingRkpdes) {
        await perencanaanService.updateRkpdes(token!, editingRkpdes.id, payload);
      } else {
        await perencanaanService.createRkpdes(token!, selectedBidangId!, payload);
      }
      setShowRkpdesModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan RKPDes');
    } finally {
      setIsSubmittingRkpdes(false);
    }
  };

  const handleDeleteRkpdes = async (rkpdesId: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus RKPDes',
      message: 'Anda yakin menghapus RKPDes ini?',
      confirmLabel: 'Hapus',
      variant: 'danger'
    });
    if (isConfirmed) {
      try {
        await perencanaanService.deleteRkpdes(token!, rkpdesId);
        fetchData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (loading) return <AdminLayout><LoadingState message="Memuat detail RPJMDes..." /></AdminLayout>;
  if (error || !data) return <AdminLayout><div style={{ padding: 48 }}><ErrorState title="Error" message={error!} onRetry={fetchData} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/admin/perencanaan/rpjmdes')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <h1>Detail RPJMDes</h1>
            <p>Periode {data.periodeMulai} - {data.periodeSelesai}</p>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* LEFT: Info RPJMDes */}
          <div className={styles.card} style={{ height: 'fit-content' }}>
            <div className={styles.cardHeader}>
              <h2>Informasi Umum</h2>
            </div>
            
            <div className={styles.infoGroup}>
              <div className={styles.infoLabel}>Status</div>
              <Badge color={data.status === 'AKTIF' ? 'success' : data.status === 'SELESAI' ? 'primary' : 'neutral'}>
                {data.status}
              </Badge>
            </div>
            
            <div className={styles.infoGroup}>
              <div className={styles.infoLabel}>Visi</div>
              <div className={styles.infoValue}>{data.visi || '-'}</div>
            </div>
            
            <div className={styles.infoGroup}>
              <div className={styles.infoLabel}>Misi</div>
              <div className={styles.infoValue}>{data.misi || '-'}</div>
            </div>
          </div>

          {/* RIGHT: Bidang & RKPDes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Daftar Bidang & Program (RKPDes)</h2>
              <Button size="sm" onClick={() => handleOpenBidangForm()}>+ Tambah Bidang</Button>
            </div>

            <div className={styles.bidangList}>
              {(!data.bidang || data.bidang.length === 0) ? (
                <div className={styles.emptyRkpdes}>Belum ada bidang yang ditambahkan.</div>
              ) : (
                data.bidang.map((b) => (
                  <div key={b.id} className={styles.bidangCard}>
                    <div 
                      className={styles.bidangHeader}
                      onClick={() => setExpandedBidang(expandedBidang === b.id ? null : b.id)}
                    >
                      <div>
                        <div className={styles.bidangTitle}>{b.nama}</div>
                        {b.deskripsi && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{b.deskripsi}</div>}
                      </div>
                      <div className={styles.bidangActions}>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOpenBidangForm(b); }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={(e) => handleDeleteBidang(b.id, e)}>
                          Hapus
                        </Button>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedBidang === b.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 8, color: '#6b7280' }}>
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                    </div>

                    {expandedBidang === b.id && (
                      <div className={styles.bidangContent}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                          <Button size="sm" onClick={() => handleOpenRkpdesForm(b.id)}>+ Tambah RKPDes</Button>
                        </div>
                        
                        {(!b.rkpdes || b.rkpdes.length === 0) ? (
                          <div className={styles.emptyRkpdes}>Belum ada RKPDes di bidang ini.</div>
                        ) : (
                          <table className={styles.rkpdesTable}>
                            <thead>
                              <tr>
                                <th>Tahun</th>
                                <th>Kegiatan</th>
                                <th>Biaya</th>
                                <th>Status</th>
                                <th>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.rkpdes.map((r) => (
                                <tr key={r.id}>
                                  <td>{r.tahun}</td>
                                  <td>{r.namaKegiatan}</td>
                                  <td>{formatRupiah(r.perkiraanBiaya)}</td>
                                  <td>
                                    <Badge color={r.status === 'SELESAI' ? 'success' : r.status === 'BERJALAN' ? 'warning' : 'neutral'}>
                                      {r.status}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <Button size="sm" variant="outline" onClick={() => handleOpenRkpdesForm(b.id, r)}>Edit</Button>
                                      <Button size="sm" variant="danger" onClick={() => handleDeleteRkpdes(r.id)}>Hapus</Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL BIDANG */}
      <Modal isOpen={showBidangModal} onClose={() => !isSubmittingBidang && setShowBidangModal(false)} title={editingBidang ? 'Edit Bidang' : 'Tambah Bidang'}>
        <form onSubmit={handleSubmitBidang} className={styles.formGrid}>
          <Input label="Nama Bidang" value={bidangForm.nama} onChange={e => setBidangForm({...bidangForm, nama: e.target.value})} required />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Deskripsi (Opsional)</label>
            <textarea
              value={bidangForm.deskripsi}
              onChange={(e) => setBidangForm({ ...bidangForm, deskripsi: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '80px' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => setShowBidangModal(false)} disabled={isSubmittingBidang}>Batal</Button>
            <Button type="submit" loading={isSubmittingBidang}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL RKPDES */}
      <Modal isOpen={showRkpdesModal} onClose={() => !isSubmittingRkpdes && setShowRkpdesModal(false)} title={editingRkpdes ? 'Edit RKPDes' : 'Tambah RKPDes'}>
        <form onSubmit={handleSubmitRkpdes} className={styles.formGrid}>
          <Input label="Tahun" type="number" value={rkpdesForm.tahun} onChange={e => setRkpdesForm({...rkpdesForm, tahun: e.target.value})} required />
          <Input label="Nama Kegiatan" value={rkpdesForm.namaKegiatan} onChange={e => setRkpdesForm({...rkpdesForm, namaKegiatan: e.target.value})} required />
          <Input label="Lokasi (Opsional)" value={rkpdesForm.lokasi} onChange={e => setRkpdesForm({...rkpdesForm, lokasi: e.target.value})} />
          <Input label="Perkiraan Biaya (Rp)" type="number" value={rkpdesForm.perkiraanBiaya} onChange={e => setRkpdesForm({...rkpdesForm, perkiraanBiaya: e.target.value})} required />
          <Input label="Sumber Dana (Opsional)" value={rkpdesForm.sumberDana} onChange={e => setRkpdesForm({...rkpdesForm, sumberDana: e.target.value})} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Sasaran (Opsional)</label>
            <textarea
              value={rkpdesForm.sasaran}
              onChange={(e) => setRkpdesForm({ ...rkpdesForm, sasaran: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '60px' }}
            />
          </div>
          <Select label="Status" value={rkpdesForm.status} onChange={e => setRkpdesForm({...rkpdesForm, status: e.target.value})} options={STATUS_RKPDES_OPTIONS} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => setShowRkpdesModal(false)} disabled={isSubmittingRkpdes}>Batal</Button>
            <Button type="submit" loading={isSubmittingRkpdes}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {ConfirmElement}
    </AdminLayout>
  );
}
