import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { useDokumen, DokumenDefinition } from '@/hooks/useDokumen';
import { useLayananList } from '@/hooks/useLayanan';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import shared from '@/styles/AdminShared.module.css';
import s from '@/pages/admin/layanan/LayananListPage.module.css';
import { Button, Input, Modal, Select } from '@/components/ui';

export default function JenisSuratPage() {
  const { token } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, loading, error, meta, refetch } = useDokumen({ page, limit: 15, search });
  const { data: layananData } = useLayananList({ limit: 100 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<DokumenDefinition> | null>(null);
  
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    slug: '',
    deskripsi: '',
    layananId: '',
    isActive: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleOpenModal = (item?: DokumenDefinition) => {
    if (item) {
      setEditingData(item);
      setFormData({
        kode: item.kode || '',
        nama: item.nama || '',
        slug: item.slug || '',
        deskripsi: item.deskripsi || '',
        layananId: item.layananId?.toString() || '',
        isActive: item.isActive ?? true
      });
    } else {
      setEditingData(null);
      setFormData({
        kode: '',
        nama: '',
        slug: '',
        deskripsi: '',
        layananId: '',
        isActive: true
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSlugify = (text: string) => {
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.kode || !formData.nama || !formData.slug || !formData.layananId) {
      setFormError('Semua field wajib diisi');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const url = editingData?.id 
        ? `${API_URL}/documents/definitions/${editingData.id}` 
        : `${API_URL}/documents/definitions`;
        
      const response = await fetch(url, {
        method: editingData?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          layananId: parseInt(formData.layananId, 10)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Terjadi kesalahan saat menyimpan data');
      }

      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Apakah Anda yakin ingin menghapus jenis surat ini?')) return;

    try {
      const response = await fetch(`${API_URL}/documents/definitions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Terjadi kesalahan saat menghapus data');
      }

      refetch();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  return (
    <AdminLayout>
      <div className={shared.container}>
        <div className={shared.header}>
          <div className={shared.searchBox}>
            <Input
              type="search"
              placeholder="Cari jenis surat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={shared.searchInput}
            />
          </div>
          <Button onClick={() => handleOpenModal()} className={shared.btnPrimary}>
            + Tambah Jenis Surat
          </Button>
        </div>

        {error && <div className={shared.errorMessage}>{error}</div>}

        <div className={shared.tableWrapper}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Surat</th>
                <th>Layanan</th>
                <th>Status</th>
                <th>Templat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={shared.textCenter}>Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className={shared.textCenter}>Tidak ada data jenis surat</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id}>
                    <td><span className={s.codeBadge}>{item.kode}</span></td>
                    <td className={shared.fwMedium}>{item.nama}</td>
                    <td>{item.layanan?.nama || '-'}</td>
                    <td>
                      <span className={item.isActive ? s.statusActive : s.statusInactive}>
                        {item.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td>{item._count?.templates || 0}</td>
                    <td className={shared.actionCell}>
                      <button 
                        className={s.actionLinkBlue} 
                        title="Edit"
                        onClick={() => handleOpenModal(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className={s.actionLinkRed} 
                        title="Hapus"
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

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className={shared.pagination}>
            <button 
              className={shared.pageBtn} 
              disabled={meta.page <= 1}
              onClick={() => handlePageChange(meta.page - 1)}
            >
              Sebelumnya
            </button>
            <span className={shared.pageInfo}>Halaman {meta.page} dari {meta.totalPages}</span>
            <button 
              className={shared.pageBtn}
              disabled={meta.page >= meta.totalPages}
              onClick={() => handlePageChange(meta.page + 1)}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingData ? 'Edit Jenis Surat' : 'Tambah Jenis Surat'}>
         <form onSubmit={handleSubmit} className={s.modalForm}>
          {formError && <div className={s.formError}>{formError}</div>}
          
          <div className={s.fieldGroup}>
            <label className={s.label}>Layanan <span className={s.required}>*</span></label>
            <Select 
              value={formData.layananId}
              onChange={(e) => setFormData({...formData, layananId: e.target.value})}
              options={layananData?.map(l => ({ value: l.id, label: l.nama })) || []}
              placeholder="-- Pilih Layanan --"
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Kode Surat <span className={s.required}>*</span></label>
            <Input 
              value={formData.kode}
              onChange={(e) => setFormData({...formData, kode: e.target.value})}
              placeholder="Contoh: SKU, SKTM, dll"
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Nama Surat <span className={s.required}>*</span></label>
            <Input 
              value={formData.nama}
              onChange={(e) => {
                setFormData({...formData, nama: e.target.value});
                if (!editingData) handleSlugify(e.target.value);
              }}
              placeholder="Contoh: Surat Keterangan Usaha"
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Slug <span className={s.required}>*</span></label>
            <Input 
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              placeholder="surat-keterangan-usaha"
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Deskripsi</label>
            <textarea 
              className={s.input + ' ' + s.textarea}
              value={formData.deskripsi}
              onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
              placeholder="Keterangan mengenai jenis surat ini"
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
