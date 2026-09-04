import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { Button, Input, Modal, Select } from '@/components/ui';
import shared from '@/styles/AdminShared.module.css';
import s from '@/pages/admin/layanan/LayananListPage.module.css';
import { safeFetchJson } from '@/lib/fetch';

interface FieldDefinition {
  id: string;
  templateId?: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  orderIndex: number;
}

export default function TemplateFieldsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuthStore();
  
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<FieldDefinition> | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    type: 'TEXT',
    required: false,
    orderIndex: 0
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchFields = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(`${API_URL}/template-designer/templates/${id}/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!data.success) throw new Error('Gagal memuat fields');
      setFields(data.data || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchFields();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const handleOpenModal = (item?: FieldDefinition) => {
    if (item) {
      setEditingData(item);
      setFormData({
        key: item.key,
        label: item.label,
        type: item.type,
        required: item.required,
        orderIndex: item.orderIndex
      });
    } else {
      setEditingData(null);
      setFormData({
        key: '',
        label: '',
        type: 'TEXT',
        required: false,
        orderIndex: fields.length
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.key || !formData.label) {
      setFormError('Key dan label wajib diisi');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const url = editingData?.id 
        ? `${API_URL}/template-designer/templates/${id}/fields/${editingData.id}` 
        : `${API_URL}/template-designer/templates/${id}/fields`;
        
      const result = await safeFetchJson(url, {
        method: editingData?.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          orderIndex: Number(formData.orderIndex)
        })
      });

      if (!result.success) {
        throw new Error(result.message || 'Terjadi kesalahan saat menyimpan data');
      }

      setIsModalOpen(false);
      fetchFields();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!token || !window.confirm('Apakah Anda yakin ingin menghapus field ini?')) return;

    try {
      const result = await safeFetchJson(`${API_URL}/template-designer/templates/${id}/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!result.success) {
        throw new Error(result.message || 'Terjadi kesalahan saat menghapus data');
      }

      fetchFields();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  if (authLoading) return <AdminLayout><div className={shared.textCenter}>Memuat...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className={shared.container}>
        <div className={shared.header}>
          <div>
            <Button variant="outline" onClick={() => navigate('/admin/surat/templates')} style={{ marginBottom: 16 }}>
              &larr; Kembali ke Daftar Template
            </Button>
          </div>
          <Button onClick={() => handleOpenModal()} className={shared.btnPrimary}>
            + Tambah Field
          </Button>
        </div>

        {error && <div className={shared.errorMessage}>{error}</div>}

        <div className={shared.tableWrapper}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Key (Variabel)</th>
                <th>Label Form</th>
                <th>Tipe</th>
                <th>Wajib</th>
                <th>Urutan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={shared.textCenter}>Memuat data...</td>
                </tr>
              ) : fields.length === 0 ? (
                <tr>
                  <td colSpan={6} className={shared.textCenter}>Belum ada field, silakan tambah baru.</td>
                </tr>
              ) : (
                fields.map((item) => (
                  <tr key={item.id}>
                    <td><span className={s.codeBadge}>{item.key}</span></td>
                    <td className={shared.fwMedium}>{item.label}</td>
                    <td>{item.type}</td>
                    <td>
                      <span className={item.required ? s.statusActive : s.statusInactive}>
                        {item.required ? 'Ya' : 'Tidak'}
                      </span>
                    </td>
                    <td>{item.orderIndex}</td>
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingData ? 'Edit Field' : 'Tambah Field'}>
         <form onSubmit={handleSubmit} className={s.modalForm}>
          {formError && <div className={s.formError}>{formError}</div>}
          
          <div className={s.fieldGroup}>
            <label className={s.label}>Key / Variabel <span className={s.required}>*</span></label>
            <Input 
              value={formData.key}
              onChange={(e) => setFormData({...formData, key: e.target.value})}
              placeholder="Contoh: nama_pemohon"
              required
            />
            <span style={{ fontSize: 12, color: '#666' }}>Digunakan dalam template seperti {'{{'}nama_pemohon{'}}'}</span>
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Label Form <span className={s.required}>*</span></label>
            <Input 
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              placeholder="Contoh: Nama Lengkap Pemohon"
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Tipe Input <span className={s.required}>*</span></label>
            <Select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              options={[
                { value: 'TEXT', label: 'Teks Pendek' },
                { value: 'NUMBER', label: 'Angka' },
                { value: 'DATE', label: 'Tanggal' },
                { value: 'TEXTAREA', label: 'Teks Panjang' },
                { value: 'SELECT', label: 'Pilihan (Select)' }
              ]}
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.label}>Urutan</label>
            <Input 
              type="number"
              value={formData.orderIndex.toString()}
              onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className={s.checkboxGroup}>
            <label className={s.checkboxLabel}>
              <input 
                type="checkbox" 
                className={s.checkbox}
                checked={formData.required}
                onChange={(e) => setFormData({...formData, required: e.target.checked})}
              />
              Wajib Diisi (Required)
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
