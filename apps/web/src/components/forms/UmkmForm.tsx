import React, { useState } from 'react';
import { Button } from '../ui';
import { useAuthStore } from '../../stores/auth.store';

interface UmkmFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UmkmForm({ initialData, onSuccess, onCancel }: UmkmFormProps) {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    nama: initialData?.nama || '',
    slug: initialData?.slug || '',
    deskripsi: initialData?.deskripsi || '',
    kategori: initialData?.kategori || '',
    gambarUrl: initialData?.gambarUrl || '',
    harga: initialData?.harga || '',
    kontak: initialData?.kontak || '',
    pemilik: initialData?.pemilik || '',
    isAktif: initialData?.isAktif ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = initialData ? `/api/umkm/${initialData.id}` : '/api/umkm';
      const method = initialData ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        gambarUrl: formData.gambarUrl || null,
        harga: formData.harga || null,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-generate slug from nama
      if (name === 'nama' && !initialData) {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div style={{ color: 'red', padding: '0.5rem', background: '#fee' }}>{error}</div>}
      
      <div>
        <label>Nama Produk / UMKM</label>
        <input required type="text" name="nama" value={formData.nama} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Slug</label>
        <input required type="text" name="slug" value={formData.slug} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Kategori</label>
        <input required type="text" name="kategori" value={formData.kategori} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Nama Pemilik</label>
        <input required type="text" name="pemilik" value={formData.pemilik} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Kontak (WA/Telp)</label>
        <input required type="text" name="kontak" value={formData.kontak} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>Harga (Opsional)</label>
        <input type="text" name="harga" value={formData.harga} onChange={handleChange} placeholder="Contoh: Rp 15.000 - Rp 50.000" style={{ width: '100%', padding: '0.5rem' }} />
      </div>

      <div>
        <label>URL Gambar (Opsional)</label>
        <input type="url" name="gambarUrl" value={formData.gambarUrl} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
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
