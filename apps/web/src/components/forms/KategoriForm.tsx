import { useState, useEffect } from 'react';
import { Button, Typography } from '../ui';
import { useAuthStore } from '../../stores/auth.store';

interface KategoriFormData {
  id?: string;
  nama: string;
  slug: string;
  deskripsi: string;
  ikon: string;
  warna: string;
  urutan: number;
  isAktif: boolean;
}

interface KategoriFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<KategoriFormData>;
  onSuccess: () => void;
  onCancel: () => void;
}

function generateSlug(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function KategoriForm({ mode, initialData, onSuccess, onCancel }: KategoriFormProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugManual, _setSlugManual] = useState(!!initialData?.slug);
  const [form, setForm] = useState<KategoriFormData>({
    nama: initialData?.nama || '',
    slug: initialData?.slug || '',
    deskripsi: initialData?.deskripsi || '',
    ikon: initialData?.ikon || '',
    warna: initialData?.warna || '#3B82F6',
    urutan: initialData?.urutan || 0,
    isAktif: initialData?.isAktif ?? true,
  });

  // Check slug availability
  const checkSlugAvailability = async (slug: string, excludeSlug?: string): Promise<boolean> => {
    if (!slug || slug === excludeSlug) {
      setSlugError(null);
      return true;
    }

    setSlugChecking(true);
    try {
      const res = await fetch(`/api/kategori/slug/${slug}`);
      const result = await res.json();
      if (result.success && result.data) {
        setSlugError('Slug sudah digunakan');
        return false;
      }
      setSlugError(null);
      return true;
    } catch {
      setSlugError(null);
      return true;
    } finally {
      setSlugChecking(false);
    }
  };

  // Debounced auto-generate slug
  useEffect(() => {
    if (!slugManual && form.nama) {
      const timer = setTimeout(() => {
        setForm(prev => ({ ...prev, slug: generateSlug(prev.nama) }));
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [form.nama, slugManual]);

  // Auto-generate slug on mount for create mode
  useEffect(() => {
    if (!slugManual && form.nama && mode === 'create') {
      setForm(prev => ({ ...prev, slug: generateSlug(prev.nama) }));
    }
  }, []);

  const handleChange = (field: keyof KategoriFormData, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'slug') {
      setSlugError(null);
    }
  };

  const handleSlugBlur = () => {
    checkSlugAvailability(form.slug, initialData?.slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Manual validation for required fields to satisfy tests that bypass HTML5 validation
    if (!form.nama.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    // Sync slug generation to handle race conditions with E2E test runner
    let finalSlug = form.slug;
    if (!slugManual && form.nama) {
      finalSlug = generateSlug(form.nama);
      setForm(prev => ({ ...prev, slug: finalSlug }));
    }

    // Validate slug
    if (slugError) {
      setError('Slug sudah digunakan. Silakan gunakan slug lain.');
      return;
    }

    // Check slug one more time
    const isSlugAvailable = await checkSlugAvailability(finalSlug, initialData?.slug);
    if (!isSlugAvailable) {
      setError('Slug sudah digunakan. Silakan gunakan slug lain.');
      return;
    }

    setLoading(true);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = mode === 'edit' && initialData?.id
        ? `/api/kategori/${initialData.id}`
        : '/api/kategori';

      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          nama: form.nama,
          slug: finalSlug,
          deskripsi: form.deskripsi || undefined,
          ikon: form.ikon || undefined,
          warna: form.warna || undefined,
          urutan: form.urutan,
          isAktif: form.isAktif,
        }),
      });

      const result = await res.json();

      if (result.success) {
        onSuccess();
      } else {
        throw new Error(result.error?.message || 'Gagal menyimpan kategori');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const predefinedColors = [
    '#3B82F6', '#ef4444', '#22c55e', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#64748b',
  ];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Nama */}
        <div>
          <label htmlFor="nama" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Nama Kategori *
          </label>
          <input
            id="nama"
            type="text"
            value={form.nama}
            onChange={(e) => handleChange('nama', e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Slug */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Slug *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              onBlur={handleSlugBlur}
              required
              pattern="[a-z0-9-]+"
              style={{
                width: '100%',
                padding: '0.5rem',
                paddingRight: slugChecking || slugError ? '2rem' : '0.5rem',
                border: `1px solid ${slugError ? '#ef4444' : form.slug && !slugError && !slugChecking ? '#22c55e' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            />
            {slugChecking && (
              <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              </span>
            )}
            {!slugChecking && form.slug && !slugError && (
              <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }}>✓</span>
            )}
            {slugError && (
              <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }}>✗</span>
            )}
          </div>
          {slugError && (
            <Typography variant="body2" style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
              {slugError}
            </Typography>
          )}
          <Typography variant="body2" color="secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            URL-friendly identifier (lowercase dengan hyphen)
          </Typography>
        </div>

        {/* Deskripsi */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Deskripsi
          </label>
          <textarea
            value={form.deskripsi}
            onChange={(e) => handleChange('deskripsi', e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Warna */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Warna
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange('warna', color)}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: form.warna === color ? '3px solid #1f2937' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
            <input
              type="color"
              value={form.warna}
              onChange={(e) => handleChange('warna', e.target.value)}
              style={{
                width: '2rem',
                height: '2rem',
                border: 'none',
                cursor: 'pointer',
              }}
            />
            <input
              type="text"
              value={form.warna}
              onChange={(e) => handleChange('warna', e.target.value)}
              placeholder="#3B82F6"
              style={{
                width: '100px',
                padding: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* Urutan */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Urutan Tampilan
          </label>
          <input
            type="number"
            value={form.urutan}
            onChange={(e) => handleChange('urutan', parseInt(e.target.value) || 0)}
            min={0}
            style={{
              width: '100px',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="isAktif"
            checked={form.isAktif}
            onChange={(e) => handleChange('isAktif', e.target.checked)}
            style={{ width: '1rem', height: '1rem' }}
          />
          <label htmlFor="isAktif" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
            Kategori aktif
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#dc2626',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Menyimpan...' : mode === 'create' ? 'Simpan' : 'Perbarui'}
          </Button>
        </div>
      </div>
    </form>
  );
}
