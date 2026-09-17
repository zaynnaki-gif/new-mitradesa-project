import React, { useState } from 'react';
import { Button } from '../ui';
import { useAuthStore } from '../../stores/auth.store';
import { useCreateApbdes, useUpdateApbdes } from '../../hooks/useTransparansi';

interface TransparansiFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransparansiForm({ initialData, onSuccess, onCancel }: TransparansiFormProps) {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    tahun: initialData?.tahun || new Date().getFullYear(),
    totalPendapatan: initialData?.totalPendapatan || 0,
    totalBelanja: initialData?.totalBelanja || 0,
    totalPembiayaan: initialData?.totalPembiayaan || 0,
    dokumenUrl: initialData?.dokumenUrl || '',
    isAktif: initialData?.isAktif ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateApbdes();
  const updateMutation = useUpdateApbdes();

  const loading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...formData,
        tahun: Number(formData.tahun),
        totalPendapatan: Number(formData.totalPendapatan),
        totalBelanja: Number(formData.totalBelanja),
        totalPembiayaan: Number(formData.totalPembiayaan),
        dokumenUrl: formData.dokumenUrl || null,
      };

      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          payload,
          token: token || ''
        });
      } else {
        await createMutation.mutateAsync({
          payload,
          token: token || ''
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div style={{ color: 'red', padding: '0.5rem', background: '#fee' }}>{error}</div>}
      
      <div>
        <label>Tahun APBDes</label>
        <input required type="number" name="tahun" value={formData.tahun} onChange={handleChange} min="2000" max="2100" style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Total Pendapatan (Rp)</label>
        <input required type="number" name="totalPendapatan" value={formData.totalPendapatan} onChange={handleChange} min="0" style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Total Belanja (Rp)</label>
        <input required type="number" name="totalBelanja" value={formData.totalBelanja} onChange={handleChange} min="0" style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Total Pembiayaan (Rp)</label>
        <input required type="number" name="totalPembiayaan" value={formData.totalPembiayaan} onChange={handleChange} min="0" style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>URL Dokumen (Opsional - PDF)</label>
        <input type="url" name="dokumenUrl" value={formData.dokumenUrl} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>
          <input type="checkbox" name="isAktif" checked={formData.isAktif} onChange={handleChange} />
          {' '}Tampilkan ke Publik (Aktif)
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
      </div>
    </form>
  );
}
