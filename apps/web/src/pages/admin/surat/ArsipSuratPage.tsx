import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Input, Table, Badge, Modal } from '@/components/ui';
import { LoadingState } from '@/components/states';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import styles from './ArsipSuratPage.module.css';

interface SuratMasuk {
  id: string;
  nomorSurat: string;
  tanggalSurat: string;
  tanggalDiterima: string;
  pengirim: string;
  perihal: string;
  status: 'DITERIMA' | 'DIPROSES' | 'SELESAI' | 'DIARSIPKAN';
  disposisi: Disposisi[];
}

interface Disposisi {
  id: string;
  tujuan: string;
  instruksi: string;
  tanggalSelesai: string | null;
  status: 'PENDING' | 'DIPROSES' | 'SELESAI';
  createdAt: string;
}

interface SuratKeluar {
  id: string;
  nomorDokumen: string;
  judul: string;
  tujuan: string | null;
  status: string;
  createdAt: string;
  dokumen: { kode: string; nama: string };
  fileUrl?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };
  message: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DITERIMA': return <Badge color="primary">Diterima</Badge>;
    case 'DIPROSES': return <Badge color="secondary">Diproses</Badge>;
    case 'SELESAI': return <Badge color="success">Selesai</Badge>;
    case 'DIARSIPKAN': return <Badge color="muted">Diarsipkan</Badge>;
    case 'GENERATED': return <Badge color="primary">Dibuat</Badge>;
    case 'SIGNED': return <Badge color="success">Ditandatangani</Badge>;
    case 'PENDING': return <Badge color="secondary">Pending</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

export default function ArsipSuratPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'masuk' | 'keluar'>('masuk');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null);
  const [isDisposisiModalOpen, setIsDisposisiModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedKeluar, setSelectedKeluar] = useState<SuratKeluar | null>(null);

  // Disposisi form
  const [disposisiForm, setDisposisiForm] = useState({ tujuan: '', instruksi: '', tanggalSelesai: '' });

  const headers = { Authorization: `Bearer ${token}` };

  // Queries
  const { data: suratMasukResponse, isLoading: loadingMasuk } = useQuery<ApiResponse<SuratMasuk>>({
    queryKey: ['surat-masuk', search],
    queryFn: async () => {
      const url = new URL(`${API_URL}/arsip-surat/masuk`);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url.toString(), { headers });
      return res.json();
    },
    enabled: activeTab === 'masuk',
  });

  const { data: suratKeluarResponse, isLoading: loadingKeluar } = useQuery<ApiResponse<SuratKeluar>>({
    queryKey: ['surat-keluar', search],
    queryFn: async () => {
      const url = new URL(`${API_URL}/arsip-surat/keluar`);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url.toString(), { headers });
      return res.json();
    },
    enabled: activeTab === 'keluar',
  });

  const suratMasukData = suratMasukResponse?.data?.data || [];
  const suratKeluarData = suratKeluarResponse?.data?.data || [];

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_URL}/arsip-surat/masuk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
      setIsAddModalOpen(false);
      setFormData({ nomorSurat: '', tanggalSurat: '', tanggalDiterima: '', pengirim: '', perihal: '' });
    },
  });

  // Disposisi mutation
  const disposisiMutation = useMutation({
    mutationFn: async ({ suratId, data }: { suratId: string; data: any }) => {
      const res = await fetch(`${API_URL}/arsip-surat/masuk/${suratId}/disposisi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
      setIsDisposisiModalOpen(false);
      setSelectedSurat(null);
      setDisposisiForm({ tujuan: '', instruksi: '', tanggalSelesai: '' });
    },
  });

  const [formData, setFormData] = useState({
    nomorSurat: '', tanggalSurat: '', tanggalDiterima: '', pengirim: '', perihal: '',
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const openDisposisi = (surat: SuratMasuk) => {
    setSelectedSurat(surat);
    setDisposisiForm({ tujuan: '', instruksi: '', tanggalSelesai: '' });
    setIsDisposisiModalOpen(true);
  };

  const handleDisposisiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurat) return;
    disposisiMutation.mutate({
      suratId: selectedSurat.id,
      data: disposisiForm,
    });
  };

  const openSuratKeluarDetail = (surat: SuratKeluar) => {
    setSelectedKeluar(surat);
    setIsDetailModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Typography variant="h3">Arsip Surat</Typography>
            <Typography variant="body2" color="secondary">
              Kelola arsip surat masuk dan surat keluar desa
            </Typography>
          </div>
          {activeTab === 'masuk' && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              Tambah Surat Masuk
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'masuk' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('masuk')}
          >
            Surat Masuk
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'keluar' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('keluar')}
          >
            Surat Keluar
          </button>
        </div>

        {/* Search */}
        <div className={styles.filters}>
          <Input
            placeholder="Cari nomor, perihal, pengirim/tujuan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
        </div>

        {/* SURAT MASUK */}
        {activeTab === 'masuk' && (
          <div className={styles.tableWrapper}>
            <Table>
              <thead>
                <tr>
                  <th>No. Surat</th>
                  <th>Tanggal Terima</th>
                  <th>Pengirim</th>
                  <th>Perihal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingMasuk ? (
                  <tr><td colSpan={6} className={styles.emptyState}><LoadingState message="Memuat..." /></td></tr>
                ) : suratMasukData.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyState}>Tidak ada data surat masuk.</td></tr>
                ) : (
                  suratMasukData.map(surat => (
                    <tr key={surat.id}>
                      <td className={styles.fontMedium}>{surat.nomorSurat}</td>
                      <td>{format(new Date(surat.tanggalDiterima), 'dd MMM yyyy', { locale: id })}</td>
                      <td>{surat.pengirim}</td>
                      <td>{surat.perihal}</td>
                      <td>{getStatusBadge(surat.status)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <Button variant="outline" size="sm" onClick={() => openDisposisi(surat)}>
                            Disposisi
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* SURAT KELUAR */}
        {activeTab === 'keluar' && (
          <div className={styles.tableWrapper}>
            <Table>
              <thead>
                <tr>
                  <th>No. Dokumen</th>
                  <th>Tanggal</th>
                  <th>Tujuan</th>
                  <th>Jenis</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingKeluar ? (
                  <tr><td colSpan={6} className={styles.emptyState}><LoadingState message="Memuat..." /></td></tr>
                ) : suratKeluarData.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyState}>Tidak ada data surat keluar.</td></tr>
                ) : (
                  suratKeluarData.map(surat => (
                    <tr key={surat.id}>
                      <td className={styles.fontMedium}>{surat.nomorDokumen}</td>
                      <td>{format(new Date(surat.createdAt), 'dd MMM yyyy', { locale: id })}</td>
                      <td>{surat.tujuan || '-'}</td>
                      <td>{surat.dokumen?.nama || 'Dokumen'}</td>
                      <td>{getStatusBadge(surat.status)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <Button variant="outline" size="sm" onClick={() => openSuratKeluarDetail(surat)}>
                            Lihat
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal: Tambah Surat Masuk */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Surat Masuk">
        <form onSubmit={handleAddSubmit} className={styles.form}>
          <Input
            label="Nomor Surat"
            value={formData.nomorSurat}
            onChange={e => setFormData(f => ({ ...f, nomorSurat: e.target.value }))}
            required
            placeholder="001/SM/VIII/2024"
          />
          <div className={styles.formRow}>
            <Input
              label="Tanggal Surat"
              type="date"
              value={formData.tanggalSurat}
              onChange={e => setFormData(f => ({ ...f, tanggalSurat: e.target.value }))}
              required
            />
            <Input
              label="Tanggal Diterima"
              type="date"
              value={formData.tanggalDiterima}
              onChange={e => setFormData(f => ({ ...f, tanggalDiterima: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Pengirim"
            value={formData.pengirim}
            onChange={e => setFormData(f => ({ ...f, pengirim: e.target.value }))}
            required
            placeholder="Nama pengirim surat"
          />
          <Input
            label="Perihal"
            value={formData.perihal}
            onChange={e => setFormData(f => ({ ...f, pertains: e.target.value }))}
            required
            placeholder="Perihal/isi surat"
          />
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Disposisi */}
      <Modal
        isOpen={isDisposisiModalOpen}
        onClose={() => { setIsDisposisiModalOpen(false); setSelectedSurat(null); }}
        title={`Disposisi: ${selectedSurat?.nomorSurat || ''}`}
      >
        {selectedSurat && (
          <form onSubmit={handleDisposisiSubmit} className={styles.form}>
            <div className={styles.disposisiInfo}>
              <p><strong>Pengirim:</strong> {selectedSurat.pengirim}</p>
              <p><strong>Perihal:</strong> {selectedSurat.perihal}</p>
            </div>

            {selectedSurat.disposisi && selectedSurat.disposisi.length > 0 && (
              <div className={styles.disposisiList}>
                <Typography variant="h4" style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Riwayat Disposisi
                </Typography>
                {selectedSurat.disposisi.map(d => (
                  <div key={d.id} className={styles.disposisiItem}>
                    <p><strong>Tujuan:</strong> {d.tujuan}</p>
                    <p><strong>Instruksi:</strong> {d.instruksi}</p>
                    <p><strong>Status:</strong> {getStatusBadge(d.status)}</p>
                    <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
                  </div>
                ))}
              </div>
            )}

            <Input
              label="Tujuan *"
              value={disposisiForm.tujuan}
              onChange={e => setDisposisiForm(f => ({ ...f, tujuan: e.target.value }))}
              required
              placeholder="Nama/person yang dituju"
            />
            <div className={styles.formGroup}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>Instruksi</label>
              <textarea
                value={disposisiForm.instruksi}
                onChange={e => setDisposisiForm(f => ({ ...f, instruksi: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.875rem', resize: 'vertical' }}
                placeholder="Instruksi atau catatan disposisi..."
              />
            </div>
            <Input
              label="Batas Selesai"
              type="date"
              value={disposisiForm.tanggalSelesai}
              onChange={e => setDisposisiForm(f => ({ ...f, tanggalSelesai: e.target.value }))}
            />

            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={() => { setIsDisposisiModalOpen(false); setSelectedSurat(null); }}>Batal</Button>
              <Button type="submit" disabled={disposisiMutation.isPending}>
                {disposisiMutation.isPending ? 'Menyimpan...' : 'Kirim Disposisi'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Detail Surat Keluar */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedKeluar(null); }}
        title="Detail Surat Keluar"
      >
        {selectedKeluar && (
          <div className={styles.detailContent}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>No. Dokumen</span>
              <span className={styles.detailValue}>{selectedKeluar.nomorDokumen}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Judul</span>
              <span className={styles.detailValue}>{selectedKeluar.judul}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Jenis</span>
              <span className={styles.detailValue}>{selectedKeluar.dokumen?.nama || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tujuan</span>
              <span className={styles.detailValue}>{selectedKeluar.tujuan || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tanggal</span>
              <span className={styles.detailValue}>
                {format(new Date(selectedKeluar.createdAt), 'dd MMMM yyyy', { locale: id })}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status</span>
              <span className={styles.detailValue}>{getStatusBadge(selectedKeluar.status)}</span>
            </div>
            {selectedKeluar.fileUrl && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>File</span>
                <span className={styles.detailValue}>
                  <a href={selectedKeluar.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadLink}>
                    Download Dokumen
                  </a>
                </span>
              </div>
            )}
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => { setIsDetailModalOpen(false); setSelectedKeluar(null); }}>Tutup</Button>
              <Button onClick={() => navigate(`/admin/dokumen/${selectedKeluar.id}`)}>
                Lihat Detail
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
