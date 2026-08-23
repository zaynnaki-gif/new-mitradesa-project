import { useState } from 'react';
import { AdminLayout } from '@/layouts';
import { useLayananList, Layanan } from '@/hooks/useLayanan';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import shared from '@/styles/AdminShared.module.css';
import s from '@/pages/admin/layanan/LayananListPage.module.css';
import { Button, Input, Modal } from '@/components/ui';

export function PenomoranSuratPage() {
  const { token } = useAuthStore();
  const { data: layananData, loading, error } = useLayananList({ limit: 100 });
  const services = layananData?.filter(s => s.isActive) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Layanan | null>(null);
  
  const [formatTemplate, setFormatTemplate] = useState('{nomor}/{kode_surat}/{bulan}/{tahun}');
  const [startingNumber, setStartingNumber] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async (serviceId: string) => {
    try {
      const res = await fetch(`${API_URL}/services/${serviceId}/nomor-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) {
        setFormatTemplate(json.data.formatTemplate);
        setStartingNumber(json.data.startingNumber);
        setIsActive(json.data.isActive);
      } else {
        setFormatTemplate('{nomor}/{kode_surat}/{bulan}/{tahun}');
        setStartingNumber(1);
        setIsActive(true);
      }
    } catch (e) {
      console.error(e);
      setFormatTemplate('{nomor}/{kode_surat}/{bulan}/{tahun}');
      setStartingNumber(1);
      setIsActive(true);
    }
  };

  const handleEdit = (service: Layanan) => {
    setCurrentService(service);
    fetchConfig(service.id.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService) return;
    setSaving(true);
    try {
      const payload = {
        formatTemplate,
        startingNumber: Number(startingNumber),
        isActive
      };
      
      const res = await fetch(`${API_URL}/services/${currentService.id}/nomor-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save config');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Penomoran Surat</h1>
          <p className={shared.pageDescription}>
            Kelola format penomoran dokumen untuk setiap layanan surat desa.
          </p>
        </div>
      </div>

      <div className={shared.card}>
        <div className={shared.tableContainer}>
          {loading ? (
            <div className={shared.loading}>Memuat data...</div>
          ) : error ? (
            <div className={shared.error}>Gagal memuat layanan.</div>
          ) : (
            <table className={shared.table}>
              <thead>
                <tr>
                  <th>KODE</th>
                  <th>NAMA LAYANAN</th>
                  <th>KATEGORI</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={shared.emptyState}>Belum ada layanan aktif.</td>
                  </tr>
                ) : (
                  services.map((svc) => (
                    <tr key={svc.id}>
                      <td>{svc.kode}</td>
                      <td>{svc.nama}</td>
                      <td>{svc.kategori || '-'}</td>
                      <td>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(svc)}>
                          Atur Penomoran
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={`Konfigurasi Penomoran: ${currentService?.nama}`}
      >
        <form onSubmit={handleSave} className={s.form}>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '4px', fontSize: '14px' }}>
            <strong>Format Variabel yang Tersedia:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li><code>{'{nomor}'}</code> - Nomor urut surat (otomatis)</li>
              <li><code>{'{kode_surat}'}</code> - Kode klasifikasi surat</li>
              <li><code>{'{bulan}'}</code> - Bulan saat ini (angka Romawi)</li>
              <li><code>{'{tahun}'}</code> - Tahun saat ini (4 digit)</li>
            </ul>
          </div>
          
          <div className={s.formGroup}>
            <label>Format Template Penomoran *</label>
            <Input
              value={formatTemplate}
              onChange={(e) => setFormatTemplate(e.target.value)}
              placeholder="Contoh: {nomor}/{kode_surat}/{bulan}/{tahun}"
              required
            />
          </div>

          <div className={s.formGroup}>
            <label>Nomor Urut Awal *</label>
            <Input
              type="number"
              min="1"
              value={startingNumber}
              onChange={(e) => setStartingNumber(parseInt(e.target.value))}
              required
            />
          </div>

          <div className={s.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive" style={{ margin: 0 }}>Aktifkan Penomoran Otomatis</label>
          </div>

          <div className={s.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
