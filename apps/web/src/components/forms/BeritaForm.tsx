import { useState, useEffect } from 'react';
import { Button } from '../ui';
import { useAuthStore } from '../../stores/auth.store';
import { RichTextEditor } from './RichTextEditor';

interface KategoriOption {
  id: string;
  nama: string;
  slug: string;
  warna: string | null;
}

interface BeritaFormData {
  id?: string;
  judul: string;
  slug: string;
  excerpt: string;
  konten: string;
  gambarUrl: string;
  kategoriId: string;
  metaTitle: string;
  metaDeskripsi: string;
  metaKeywords: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

interface BeritaFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<BeritaFormData>;
  onSuccess: () => void;
  onCancel: () => void;
}

function generateSlug(judul: string): string {
  return judul
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function BeritaForm({ mode, initialData, onSuccess, onCancel }: BeritaFormProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kategoris, setKategoris] = useState<KategoriOption[]>([]);
  const [slugManual] = useState(!!initialData?.slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [form, setForm] = useState<BeritaFormData>({
    judul: initialData?.judul || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    konten: initialData?.konten || '',
    gambarUrl: initialData?.gambarUrl || '',
    kategoriId: initialData?.kategoriId || '',
    metaTitle: initialData?.metaTitle || '',
    metaDeskripsi: initialData?.metaDeskripsi || '',
    metaKeywords: initialData?.metaKeywords || '',
    status: initialData?.status || 'DRAFT',
  });

  // Check slug availability
  const checkSlugAvailability = async (slug: string, excludeSlug?: string): Promise<boolean> => {
    if (!slug || slug === excludeSlug) {
      setSlugError(null);
      return true;
    }

    setSlugChecking(true);
    try {
      const res = await fetch(`/api/berita/slug/${slug}`);
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

  useEffect(() => {
    const fetchKategoris = async () => {
      try {
        const res = await fetch('/api/kategori/active');
        const result = await res.json();
        if (result.success) {
          setKategoris(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching kategoris:', err);
      }
    };
    fetchKategoris();

    if (!slugManual && form.judul && mode === 'create') {
      setForm(prev => ({ ...prev, slug: generateSlug(prev.judul) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!slugManual && form.judul) {
      const timer = setTimeout(() => {
        if (mode === 'create') {
          setForm(prev => ({ ...prev, slug: generateSlug(prev.judul) }));
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [form.judul, slugManual, mode]);

  const handleChange = (field: keyof BeritaFormData, value: string) => {
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
    if (!form.judul.trim()) {
      setError('Judul wajib diisi');
      return;
    }
    if (!form.konten.trim()) {
      setError('Konten wajib diisi');
      return;
    }

    // Sync slug generation to handle race conditions with E2E test runner
    let finalSlug = form.slug;
    if (!slugManual && form.judul) {
      finalSlug = generateSlug(form.judul);
      setForm(prev => ({ ...prev, slug: finalSlug }));
    }

    // Validate slug
    if (slugError) {
      setError('Slug sudah digunakan. Silakan gunakan slug lain.');
      return;
    }

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
        ? `/api/berita/${initialData.id}`
        : '/api/berita';

      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          judul: form.judul,
          slug: finalSlug,
          excerpt: form.excerpt || undefined,
          konten: form.konten,
          gambarUrl: form.gambarUrl || undefined,
          kategoriId: form.kategoriId || undefined,
          status: form.status,
          metaTitle: form.metaTitle || undefined,
          metaDeskripsi: form.metaDeskripsi || undefined,
          metaKeywords: form.metaKeywords || undefined,
        }),
      });

      const result = await res.json();

      if (result.success) {
        onSuccess();
      } else {
        throw new Error(result.error?.message || 'Gagal menyimpan berita');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Judul */}
        <div>
          <label htmlFor="judul" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Judul *
          </label>
          <input
            id="judul"
            type="text"
            value={form.judul}
            onChange={(e) => handleChange('judul', e.target.value)}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
              {slugError}
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Ringkasan
          </label>
          <textarea
            value={form.excerpt}
            onChange={(e) => handleChange('excerpt', e.target.value)}
            rows={2}
            placeholder="Ringkasan singkat berita..."
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

        {/* Konten */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Konten *
          </label>
          <RichTextEditor
            value={form.konten}
            onChange={(value) => handleChange('konten', value)}
            placeholder="Tulis konten berita di sini..."
            height={300}
          />
        </div>

        {/* Kategori */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Kategori
          </label>
          <select
            value={form.kategoriId}
            onChange={(e) => handleChange('kategoriId', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
            }}
          >
            <option value="">Pilih Kategori</option>
            {kategoris.map(k => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Gambar URL */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            URL Gambar
          </label>
          <input
            type="url"
            value={form.gambarUrl}
            onChange={(e) => handleChange('gambarUrl', e.target.value)}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Status */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
            }}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* SEO Section */}
        <details style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            SEO Settings
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Meta Title
              </label>
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                maxLength={255}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Meta Description
              </label>
              <textarea
                value={form.metaDeskripsi}
                onChange={(e) => handleChange('metaDeskripsi', e.target.value)}
                rows={2}
                maxLength={500}
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
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Meta Keywords
              </label>
              <input
                type="text"
                value={form.metaKeywords}
                onChange={(e) => handleChange('metaKeywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>
        </details>

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
