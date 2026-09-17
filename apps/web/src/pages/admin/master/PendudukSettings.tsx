import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Select } from '@/components/ui';
import { LoadingState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from '../sistem/ConfigPage.module.css';

interface ConfigItem {
  key: string;
  value: string;
}

export default function PendudukSettings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [autoSync, setAutoSync] = useState('true');
  const [alertInvalid, setAlertInvalid] = useState('true');

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(`${API_URL}/config?limit=50&groupName=DEMOGRAPHICS`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const items: ConfigItem[] = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        const cv = (key: string) => items.find(c => c.key === key)?.value ?? '';
        setAutoSync(cv('AUTO_SYNC_DATA') || 'true');
        setAlertInvalid(cv('ALERT_DATA_TIDAK_VALID') || 'true');
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
        <h1 className={styles.title}>Pengaturan Kependudukan</h1>
        <p className={styles.subtitle}>Konfigurasi modul kependudukan dan keluarga</p>
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <h3 className={styles.sectionCardTitle}>Pengaturan Modul Kependudukan</h3>
          <p className={styles.sectionCardSubtitle}>Atur sinkronisasi dan peringatan NIK/KK.</p>
        </div>
        <div className={styles.sectionCardBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Sinkronisasi Data Otomatis</label>
            <Select value={autoSync} onChange={e => setAutoSync(e.target.value)}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
            <small className={styles.formHelp}>Sinkronisasi dengan sistem dukcapil jika API tersedia</small>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Peringatan NIK/KK Tidak Valid</label>
            <Select value={alertInvalid} onChange={e => setAlertInvalid(e.target.value)}>
              <option value="true">Ya, tampilkan peringatan</option>
              <option value="false">Tidak</option>
            </Select>
          </div>
          <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
            { key: 'AUTO_SYNC_DATA', groupName: 'DEMOGRAPHICS', value: autoSync },
            { key: 'ALERT_DATA_TIDAK_VALID', groupName: 'DEMOGRAPHICS', value: alertInvalid },
          ])} style={{ marginTop: '1rem' }}>
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Kependudukan'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
