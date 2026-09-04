import React, { useState } from 'react';
import { Button } from '../ui';
import { useAuthStore } from '../../stores/auth.store';

interface AgendaFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AgendaForm({ initialData, onSuccess, onCancel }: AgendaFormProps) {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    judul: initialData?.judul || '',
    slug: initialData?.slug || '',
    deskripsi: initialData?.deskripsi || '',
    lokasi: initialData?.lokasi || '',
    penyelenggara: initialData?.penyelenggara || '',
    tanggalMulai: initialData?.tanggalMulai ? initialData.tanggalMulai.split('T')[0] + 'T' + new Date(initialData.tanggalMulai).toLocaleTimeString('en-GB').slice(0,5) : '',
    tanggalSelesai: initialData?.tanggalSelesai ? initialData.tanggalSelesai.split('T')[0] + 'T' + new Date(initialData.tanggalSelesai).toLocaleTimeString('en-GB').slice(0,5) : '',
    status: initialData?.status || 'MENDATANG',
    isAktif: initialData?.isAktif ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = initialData ? `/api/agenda/${initialData.id}` : '/api/agenda';
      const method = initialData ? 'PATCH' : 'POST';

      // Ensure proper ISO string for dates if needed, or append :00.000Z
      const payload = {
        ...formData,
        tanggalMulai: new Date(formData.tanggalMulai).toISOString(),
        tanggalSelesai: new Date(formData.tanggalSelesai).toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        onSuccess();
      } else {
        throw new Error(result.error?.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-generate slug from judul
      if (name === 'judul' && !initialData) {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div style={{ color: 'red', padding: '0.5rem', background: '#fee' }}>{error}</div>}
      
      <div>
        <label>Judul</label>
        <input required type="text" name="judul" value={formData.judul} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Slug</label>
        <input required type="text" name="slug" value={formData.slug} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Lokasi</label>
        <input required type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Penyelenggara</label>
        <input required type="text" name="penyelenggara" value={formData.penyelenggara} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>Tanggal Mulai</label>
          <input required type="datetime-local" name="tanggalMulai" value={formData.tanggalMulai} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Tanggal Selesai</label>
          <input required type="datetime-local" name="tanggalSelesai" value={formData.tanggalSelesai} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
        </div>
      </div>

      <div>
        <label>Status</label>
        <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
          <option value="MENDATANG">Mendatang</option>
          <option value="BERLANGSUNG">Berlangsung</option>
          <option value="SELESAI">Selesai</option>
          <option value="BATAL">Batal</option>
        </select>
      </div>

      <div>
        <label>Deskripsi</label>
        <textarea required name="deskripsi" value={formData.deskripsi} onChange={handleChange} rows={5} style={{ width: '100%', padding: '0.5rem' }} />
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
