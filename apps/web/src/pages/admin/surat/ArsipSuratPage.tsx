import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Typography, Button, Input, Table, Badge, Modal } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { API_URL } from '@/lib/constants';
import styles from './ArsipSuratPage.module.css';

interface SuratMasuk {
  id: string;
  nomorSurat: string;
  tanggalSurat: string;
  tanggalDiterima: string;
  pengirim: string;
  perihal: string;
  status: 'DITERIMA' | 'DIPROSES' | 'SELESAI' | 'DIARSIPKAN';
  disposisi: any[];
}

interface SuratKeluar {
  id: string;
  nomorDokumen: string;
  judul: string;
  tujuan: string | null;
  status: string;
  createdAt: string;
  dokumen: { kode: string; nama: string };
}

interface ApiResponse<T> {
  success: boolean;
  data: {
    data: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

export default function ArsipSuratPage() {
  const [activeTab, setActiveTab] = useState<'masuk' | 'keluar'>('masuk');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const { data: suratMasukResponse, isLoading: loadingMasuk } = useQuery<ApiResponse<SuratMasuk>>({
    queryKey: ['surat-masuk', search],
    queryFn: async () => {
      const url = new URL(`${API_URL}/arsip-surat/masuk`);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    },
    enabled: activeTab === 'masuk'
  });

  const { data: suratKeluarResponse, isLoading: loadingKeluar } = useQuery<ApiResponse<SuratKeluar>>({
    queryKey: ['surat-keluar', search],
    queryFn: async () => {
      const url = new URL(`${API_URL}/arsip-surat/keluar`);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    },
    enabled: activeTab === 'keluar'
  });

  // Extract data arrays from response
  const suratMasukData = suratMasukResponse?.data?.data || [];
  const suratKeluarData = suratKeluarResponse?.data?.data || [];

  // State for Add Form
  const [formData, setFormData] = useState({
    nomorSurat: '',
    tanggalSurat: '',
    tanggalDiterima: '',
    pengirim: '',
    perihal: ''
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_URL}/arsip-surat/masuk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
      setIsAddModalOpen(false);
      setFormData({ nomorSurat: '', tanggalSurat: '', tanggalDiterima: '', pengirim: '', perihal: '' });
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DITERIMA': return <Badge color="primary">Diterima</Badge>;
      case 'DIPROSES': return <Badge color="secondary">Diproses</Badge>;
      case 'SELESAI': return <Badge color="success">Selesai</Badge>;
      case 'DIARSIPKAN': return <Badge color="muted">Diarsipkan</Badge>;
      case 'GENERATED': return <Badge color="primary">Dibuat</Badge>;
      case 'SIGNED': return <Badge color="success">Ditandatangani</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
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

        <div className={styles.filters}>
          <Input 
            placeholder="Cari nomor, perihal, pengirim/tujuan..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {activeTab === 'masuk' ? (
          <div className={styles.tableContainer}>
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
                  <tr><td colSpan={6} className={styles.emptyState}>Memuat data...</td></tr>
                ) : suratMasukData.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyState}>Tidak ada data surat masuk.</td></tr>
                ) : (
                  suratMasukData.map((surat) => (
                    <tr key={surat.id}>
                      <td className="font-medium">{surat.nomorSurat}</td>
                      <td>{format(new Date(surat.tanggalDiterima), 'dd MMM yyyy', { locale: id })}</td>
                      <td>{surat.pengirim}</td>
                      <td>{surat.perihal}</td>
                      <td>{getStatusBadge(surat.status)}</td>
                      <td>
                        <Button variant="outline" size="sm">Disposisi</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <Table>
              <thead>
                <tr>
                  <th>No. Surat</th>
                  <th>Tanggal Dibuat</th>
                  <th>Tujuan</th>
                  <th>Jenis Dokumen</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingKeluar ? (
                  <tr><td colSpan={6} className={styles.emptyState}>Memuat data...</td></tr>
                ) : suratKeluarData.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyState}>Tidak ada data surat keluar.</td></tr>
                ) : (
                  suratKeluarData.map((surat) => (
                    <tr key={surat.id}>
                      <td className="font-medium">{surat.nomorDokumen}</td>
                      <td>{format(new Date(surat.createdAt), 'dd MMM yyyy', { locale: id })}</td>
                      <td>{surat.tujuan || '-'}</td>
                      <td>{surat.dokumen?.nama || 'Dokumen'}</td>
                      <td>{getStatusBadge(surat.status)}</td>
                      <td>
                        <Button variant="outline" size="sm">Lihat</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Surat Masuk"
      >
        <form onSubmit={handleAddSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Nomor Surat</label>
            <Input 
              required
              value={formData.nomorSurat}
              onChange={(e) => setFormData({...formData, nomorSurat: e.target.value})}
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Tanggal Surat</label>
              <Input 
                type="date"
                required
                value={formData.tanggalSurat}
                onChange={(e) => setFormData({...formData, tanggalSurat: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tanggal Diterima</label>
              <Input 
                type="date"
                required
                value={formData.tanggalDiterima}
                onChange={(e) => setFormData({...formData, tanggalDiterima: e.target.value})}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Pengirim</label>
            <Input 
              required
              value={formData.pengirim}
              onChange={(e) => setFormData({...formData, pengirim: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Perihal</label>
            <Input 
              required
              value={formData.perihal}
              onChange={(e) => setFormData({...formData, perihal: e.target.value})}
            />
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
