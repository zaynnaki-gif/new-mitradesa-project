import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { Button, Input, Modal } from '@/components/ui';
import shared from '@/styles/AdminShared.module.css';
import s from '@/pages/admin/layanan/LayananListPage.module.css';

interface Penandatangan {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  tandaTanganUrl?: string;
  isActive: boolean;
}

export default function PenandatanganPage() {
  const { token, loading: authLoading } = useAuthStore();
  const [data, setData] = useState<Penandatangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<Penandatangan> | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    jabatan: '',
    nip: '',
    tandaTanganUrl: '',
    isActive: true
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) params.append('search', search);

      const res = await fetch(`${API_URL}/documents/penanda-tangan?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat data penandatangan');
      const responseData = await res.json();
      setData(responseData.data || []);
      setTotalPages(responseData.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, page, search]);

  const handleOpenModal = (item?: Penandatangan) => {
    if (item) {
      setEditingData(item);
      setFormData({
        nama: item.nama,
        jabatan: item.jabatan,
        nip: item.nip || '',
        tandaTanganUrl: item.tandaTanganUrl || '',
        isActive: item.isActive
      });
    } else {
      setEditingData(null);
      setFormData({
        nama: '',
        jabatan: '',
        nip: '',
        tandaTanganUrl: '',
        isActive: true
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.nama || !formData.jabatan) {
      setFormError('Nama dan jabatan wajib diisi');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const url = editingData?.id 
        ? `${API_URL}/documents/penanda-tangan/${editingData.id}` 
        : `${API_URL}/documents/penanda-tangan`;
        
      const payload: any = {
        nama: formData.nama,
        jabatan: formData.jabatan,
        isActive: formData.isActive
      };
      
      if (formData.nip) payload.nip = formData.nip;
      if (formData.tandaTanganUrl) payload.tandaTanganUrl = formData.tandaTanganUrl;

      const response = await fetch(url, {
        method: editingData?.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Terjadi kesalahan saat menyimpan data');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      const response = await fetch(`${API_URL}/documents/penanda-tangan/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Terjadi kesalahan saat menghapus data');
      }

      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  if (authLoading) return <AdminLayout><div className={shared.textCenter}>Memuat...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className={shared.container}>
        <div className={shared.header}>
          <div className={shared.searchBox}>
            <Input
              type="search"
              placeholder="Cari penandatangan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={shared.searchInput}
            />
          </div>
          <Button onClick={() => handleOpenModal()} className={shared.btnPrimary}>
            + Tambah Penandatangan
          </Button>
        </div>

        {error && <div className={shared.errorMessage}>{error}</div>}

        <div className={shared.tableWrapper}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Jabatan</th>
                <th>NIP / No Identitas</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={shared.textCenter}>Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className={shared.textCenter}>Belum ada data penandatangan.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id}>
                    <td className={shared.fwMedium}>{item.nama}</td>
                    <td>{item.jabatan}</td>
                    <td>{item.nip || '-'}</td>
                    <td>
                      <span className={item.isActive ? s.statusActive : s.statusInactive}>
                        {item.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className={shared.actionCell}>
                      <button 
                        className={s.actionLinkBlue} 
                        onClick={() => handleOpenModal(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className={s.actionLinkRed} 
                        onClick={() => handleDelete(item.id)}
                        style={{ marginLeft: 8 }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className={shared.pagination}>
            <button 
              className={shared.pageBtn} 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Sebelumnya
            </button>
            <span className={shared.pageInfo}>Halaman {page} dari {totalPages}</span>
            <button 
              className={shared.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingData ? 'Edit Penandatangan' : 'Tambah Penandatangan'}>
         <form onSubmit={handleSubmit} className={s.modalForm}>
          {formError && <div className={s.formError}>{formError}</div>}
          
          <div className={s.fieldGroup}>
            <label className={s.label}>Nama Lengkap <span className={s.required}>*</span></label>
            <Input 
              value={formData.nama}
              onChange={(e) => setFormData({...formData, nama: e.target.value})}
              placeholder="Contoh: H. M. Yasin"
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Jabatan <span className={s.required}>*</span></label>
            <Input 
              value={formData.jabatan}
              onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
              placeholder="Contoh: Kepala Desa"
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>NIP / Nomor Identitas</label>
            <Input 
              value={formData.nip}
              onChange={(e) => setFormData({...formData, nip: e.target.value})}
              placeholder="Opsional, jika ASN"
            />
          </div>

          <div className={s.checkboxGroup}>
            <label className={s.checkboxLabel}>
              <input 
                type="checkbox" 
                className={s.checkbox}
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              Aktif
            </label>
          </div>

          <div className={s.formActions}>
            <button type="button" className={s.btnCancel} onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className={s.btnSubmit} disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
         </form>
      </Modal>
    </AdminLayout>
  );
}
