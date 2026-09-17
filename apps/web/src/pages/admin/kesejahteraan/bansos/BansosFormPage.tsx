import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select } from '@/components/ui';
import { useBansosDetail, useCreateBansos, useUpdateBansos } from '@/hooks/useBansos';
import styles from './BansosFormPage.module.css';

const defaultForm = {
  nama: '',
  deskripsi: '',
  penyelenggara: '',
  jenisBantuan: '',
  targetPenerima: 'KELUARGA',
  kuota: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  status: 'AKTIF'
};

export default function BansosFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: detail, isLoading } = useBansosDetail(id || '');
  const createMutation = useCreateBansos();
  const updateMutation = useUpdateBansos();

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (isEdit && detail) {
      setFormData({
        nama: detail.nama,
        deskripsi: detail.deskripsi || '',
        penyelenggara: detail.penyelenggara,
        jenisBantuan: detail.jenisBantuan,
        targetPenerima: detail.targetPenerima,
        kuota: detail.kuota ? detail.kuota.toString() : '',
        tanggalMulai: detail.tanggalMulai ? detail.tanggalMulai.split('T')[0] : '',
        tanggalSelesai: detail.tanggalSelesai ? detail.tanggalSelesai.split('T')[0] : '',
        status: detail.status
      });
    }
  }, [isEdit, detail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nama: formData.nama,
      deskripsi: formData.deskripsi || null,
      penyelenggara: formData.penyelenggara,
      jenisBantuan: formData.jenisBantuan,
      targetPenerima: formData.targetPenerima as 'INDIVIDU' | 'KELUARGA',
      kuota: formData.kuota ? parseInt(formData.kuota) : null,
      tanggalMulai: formData.tanggalMulai ? new Date(formData.tanggalMulai).toISOString() : null,
      tanggalSelesai: formData.tanggalSelesai ? new Date(formData.tanggalSelesai).toISOString() : null,
      status: formData.status
    };

    if (isEdit) {
      updateMutation.mutate({ id: id!, data: payload }, {
        onSuccess: () => navigate('/admin/kesejahteraan/bansos'),
        onError: (err) => alert(err.message || 'Gagal menyimpan data')
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/admin/kesejahteraan/bansos'),
        onError: (err) => alert(err.message || 'Gagal menyimpan data')
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading && isEdit) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{isEdit ? 'Edit Program Bansos' : 'Tambah Program Bansos'}</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.formCard}>
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <Input
                label="Nama Program *"
                value={formData.nama}
                onChange={e => setFormData(f => ({ ...f, nama: e.target.value }))}
                required
                placeholder="Misal: BLT Dana Desa 2024"
              />
            </div>
            
            <Input
              label="Penyelenggara *"
              value={formData.penyelenggara}
              onChange={e => setFormData(f => ({ ...f, penyelenggara: e.target.value }))}
              required
              placeholder="Misal: Kemensos, Pemdes, dll"
            />
            
            <Input
              label="Jenis Bantuan *"
              value={formData.jenisBantuan}
              onChange={e => setFormData(f => ({ ...f, jenisBantuan: e.target.value }))}
              required
              placeholder="Misal: Uang Tunai, Sembako"
            />

            <Select
              label="Target Penerima *"
              value={formData.targetPenerima}
              onChange={e => setFormData(f => ({ ...f, targetPenerima: e.target.value }))}
              required
            >
              <option value="KELUARGA">Keluarga / KK</option>
              <option value="INDIVIDU">Individu / Perorangan</option>
            </Select>

            <Input
              label="Kuota Penerima"
              type="number"
              value={formData.kuota}
              onChange={e => setFormData(f => ({ ...f, kuota: e.target.value }))}
              placeholder="Kosongkan jika tidak ada batasan"
            />

            <Input
              label="Tanggal Mulai"
              type="date"
              value={formData.tanggalMulai}
              onChange={e => setFormData(f => ({ ...f, tanggalMulai: e.target.value }))}
            />

            <Input
              label="Tanggal Selesai"
              type="date"
              value={formData.tanggalSelesai}
              onChange={e => setFormData(f => ({ ...f, tanggalSelesai: e.target.value }))}
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
            >
              <option value="AKTIF">Aktif (Sedang Berjalan)</option>
              <option value="SELESAI">Selesai</option>
              <option value="DRAFT">Draft / Rencana</option>
            </Select>

            <div className={styles.fullWidth}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Deskripsi</label>
              <textarea
                value={formData.deskripsi}
                onChange={e => setFormData(f => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Deskripsi singkat program..."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '100px' }}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Link to="/admin/kesejahteraan/bansos">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Program'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
