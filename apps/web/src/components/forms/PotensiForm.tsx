import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { Button, Typography } from '../ui';

interface PotensiFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PotensiForm({ initialData, onSuccess, onCancel }: PotensiFormProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    kategori: '',
    gambarUrl: '',
    lokasi: '',
    kontak: '',
    isAktif: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama: initialData.nama || '',
        deskripsi: initialData.deskripsi || '',
        kategori: initialData.kategori || '',
        gambarUrl: initialData.gambarUrl || '',
        lokasi: initialData.lokasi || '',
        kontak: initialData.kontak || '',
        isAktif: initialData.isAktif ?? true,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/cms/potensi/${initialData.id}` : '/api/cms/potensi';
      const method = isEdit ? 'PATCH' : 'POST';

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Gagal menyimpan potensi desa');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {error && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--error-50)', color: 'var(--error-600)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="nama"><Typography variant="body2" style={{ fontWeight: 500 }}>Nama Potensi *</Typography></label>
        <input
          id="nama"
          name="nama"
          value={formData.nama}
          onChange={handleChange}
          required
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="kategori"><Typography variant="body2" style={{ fontWeight: 500 }}>Kategori *</Typography></label>
        <input
          id="kategori"
          name="kategori"
          value={formData.kategori}
          onChange={handleChange}
          required
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="deskripsi"><Typography variant="body2" style={{ fontWeight: 500 }}>Deskripsi *</Typography></label>
        <textarea
          id="deskripsi"
          name="deskripsi"
          value={formData.deskripsi}
          onChange={handleChange}
          required
          rows={4}
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="gambarUrl"><Typography variant="body2" style={{ fontWeight: 500 }}>URL Gambar</Typography></label>
        <input
          id="gambarUrl"
          name="gambarUrl"
          value={formData.gambarUrl}
          onChange={handleChange}
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="lokasi"><Typography variant="body2" style={{ fontWeight: 500 }}>Lokasi</Typography></label>
        <input
          id="lokasi"
          name="lokasi"
          value={formData.lokasi}
          onChange={handleChange}
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="kontak"><Typography variant="body2" style={{ fontWeight: 500 }}>Kontak</Typography></label>
        <input
          id="kontak"
          name="kontak"
          value={formData.kontak}
          onChange={handleChange}
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <input
          type="checkbox"
          id="isAktif"
          name="isAktif"
          checked={formData.isAktif}
          onChange={handleChange}
        />
        <label htmlFor="isAktif"><Typography variant="body2">Aktif (Tampilkan ke Publik)</Typography></label>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
