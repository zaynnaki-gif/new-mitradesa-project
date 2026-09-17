import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input } from '@/components/ui';
import { LoadingState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from '../sistem/ConfigPage.module.css';

interface ConfigItem {
  key: string;
  value: string;
}

export default function LayananSettings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [jamBuka, setJamBuka] = useState('08:00');
  const [jamTutup, setJamTutup] = useState('15:00');
  const [pesanTutup, setPesanTutup] = useState('');

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(`${API_URL}/config?limit=50&groupName=SERVICES`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const items: ConfigItem[] = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        const cv = (key: string) => items.find(c => c.key === key)?.value ?? '';
        setJamBuka(cv('JAM_BUKA_LAYANAN') || '08:00');
        setJamTutup(cv('JAM_TUTUP_LAYANAN') || '15:00');
        setPesanTutup(cv('PESAN_LAYANAN_TUTUP'));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const bulkSave = async (updates: Array<{ key: string; groupName: string; value: string }>) => {
    setIsSaving(true);
    try {
      const res = await safeFetchJson(`${API_URL}/config/bulk`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (res.success) {
        alert('Pengaturan berhasil disimpan');
      } else {
        alert('Gagal menyimpan: ' + (res.message || 'Unknown error'));
      }
    } catch {
      alert('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <AdminLayout><LoadingState message="Memuat pengaturan..." /></AdminLayout>;

  return (
    <AdminLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Pengaturan Pelayanan Online</h1>
        <p className={styles.subtitle}>Konfigurasi waktu operasional layanan warga</p>
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <h3 className={styles.sectionCardTitle}>Jam Operasional Layanan</h3>
          <p className={styles.sectionCardSubtitle}>Di luar jam ini, permohonan online akan ditolak secara otomatis oleh sistem.</p>
        </div>
        <div className={styles.sectionCardBody}>
          <div className={styles.formGrid}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Jam Buka Layanan</label>
              <Input type="time" value={jamBuka} onChange={e => setJamBuka(e.target.value)} style={{ maxWidth: 160 }} />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Jam Tutup Layanan</label>
              <Input type="time" value={jamTutup} onChange={e => setJamTutup(e.target.value)} style={{ maxWidth: 160 }} />
            </div>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Pesan saat Layanan Tutup</label>
            <textarea className={styles.textarea} value={pesanTutup} onChange={e => setPesanTutup(e.target.value)} rows={3} placeholder="Maaf, layanan sedang tutup..." />
          </div>
          <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
            { key: 'JAM_BUKA_LAYANAN', groupName: 'SERVICES', value: jamBuka },
            { key: 'JAM_TUTUP_LAYANAN', groupName: 'SERVICES', value: jamTutup },
            { key: 'PESAN_LAYANAN_TUTUP', groupName: 'SERVICES', value: pesanTutup },
          ])} style={{ marginTop: '1rem' }}>
            {isSaving ? 'Menyimpan...' : 'Simpan Jam Operasional'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
