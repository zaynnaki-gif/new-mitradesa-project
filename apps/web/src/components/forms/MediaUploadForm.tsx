import { useState, useRef } from 'react';
import { Button, Typography } from '../ui';
import { useAuthStore } from '../../stores/auth.store';

interface MediaFormData {
  nama: string;
  slug: string;
  deskripsi: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  alt: string;
  kategori: string;
}

interface MediaUploadFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<MediaFormData>;
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

function getFileType(mimeType: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENT';
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function MediaUploadForm({ mode: _mode, initialData, onSuccess, onCancel }: MediaUploadFormProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialData?.fileUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MediaFormData>({
    nama: initialData?.nama || '',
    slug: initialData?.slug || '',
    deskripsi: initialData?.deskripsi || '',
    fileUrl: initialData?.fileUrl || '',
    fileType: initialData?.fileType || 'IMAGE',
    fileSize: initialData?.fileSize || 0,
    mimeType: initialData?.mimeType || '',
    width: initialData?.width,
    height: initialData?.height,
    alt: initialData?.alt || '',
    kategori: initialData?.kategori || '',
  });

  const [slugManual] = useState(!!initialData?.slug);

  const handleChange = (field: keyof MediaFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File terlalu besar. Maksimal 10MB.');
      return;
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Tipe file tidak diizinkan.');
      return;
    }

    setSelectedFile(file);
    setForm(prev => ({
      ...prev,
      nama: file.name.replace(/\.[^/.]+$/, ''),
      fileSize: file.size,
      mimeType: file.type,
      fileType: getFileType(file.type),
    }));

    // Auto-generate slug from filename
    if (!slugManual) {
      setForm(prev => ({ ...prev, slug: generateSlug(file.name.replace(/\.[^/.]+$/, '')) }));
    }

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setForm(prev => ({
            ...prev,
            width: img.width,
            height: img.height,
            alt: prev.alt || prev.nama,
          }));
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // For URL-based input (when file is not directly uploaded)
      if (!selectedFile && form.fileUrl) {
        await submitWithUrl();
      } else if (selectedFile) {
        await submitWithFile();
      } else {
        setError('Pilih file atau masukkan URL file');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const submitWithUrl = async () => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/media', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nama: form.nama,
        slug: form.slug,
        deskripsi: form.deskripsi || undefined,
        fileUrl: form.fileUrl,
        fileType: form.fileType,
        fileSize: form.fileSize,
        mimeType: form.mimeType,
        width: form.width,
        height: form.height,
        alt: form.alt || undefined,
        kategori: form.kategori || undefined,
      }),
    });

    const result = await res.json();
    if (result.success) {
      onSuccess();
    } else {
      throw new Error(result.error?.message || 'Gagal menyimpan media');
    }
  };

  const submitWithFile = async () => {
    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      // For this implementation, we'll use the file URL from preview (base64)
      // In production, you would upload to a storage service and get the URL back
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/media', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nama: form.nama,
          slug: form.slug,
          deskripsi: form.deskripsi || undefined,
          fileUrl: preview || form.fileUrl, // Using base64 preview or provided URL
          fileType: form.fileType,
          fileSize: form.fileSize,
          mimeType: form.mimeType,
          width: form.width,
          height: form.height,
          alt: form.alt || undefined,
          kategori: form.kategori || undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setUploadProgress(100);
        onSuccess();
      } else {
        throw new Error(result.error?.message || 'Gagal menyimpan media');
      }
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* File Upload */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            File *
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={ALLOWED_MIME_TYPES.join(',')}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '2px dashed #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
          <Typography variant="body2" color="secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Maksimal 10MB. Format: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MP3, WAV, PDF, DOC, DOCX
          </Typography>
        </div>

        {/* Preview */}
        {preview && (
          <div>
            <Typography variant="body2" color="secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Preview
            </Typography>
            {form.fileType === 'IMAGE' ? (
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                }}
              />
            ) : (
              <div style={{
                padding: '2rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.375rem',
                textAlign: 'center',
              }}>
                {form.fileType === 'VIDEO' ? '🎬' : form.fileType === 'AUDIO' ? '🎵' : '📄'}
                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{selectedFile?.name}</div>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: '#3B82F6',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* URL Input (Alternative) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Atau Masukkan URL File
          </label>
          <input
            type="url"
            value={form.fileUrl}
            onChange={(e) => handleChange('fileUrl', e.target.value)}
            placeholder="https://example.com/file.jpg"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Nama */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Nama *
          </label>
          <input
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
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            required
            pattern="[a-z0-9-]+"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Deskripsi
          </label>
          <textarea
            value={form.deskripsi}
            onChange={(e) => handleChange('deskripsi', e.target.value)}
            rows={2}
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

        {/* Alt Text */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Alt Text
          </label>
          <input
            type="text"
            value={form.alt}
            onChange={(e) => handleChange('alt', e.target.value)}
            placeholder="Deskripsi alternatif untuk aksesibilitas"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Kategori */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Kategori
          </label>
          <input
            type="text"
            value={form.kategori}
            onChange={(e) => handleChange('kategori', e.target.value)}
            placeholder="Contoh: hero, gallery, dokumentasi"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* File Info */}
        {selectedFile && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            color: '#6b7280',
          }}>
            <div>Tipe: {form.mimeType}</div>
            <div>Ukuran: {(form.fileSize / 1024).toFixed(1)} KB</div>
            {form.width && form.height && (
              <div>Dimensi: {form.width} x {form.height} px</div>
            )}
          </div>
        )}

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
          <Button type="submit" variant="primary" disabled={loading || (!selectedFile && !form.fileUrl)}>
            {loading ? 'Mengupload...' : 'Simpan'}
          </Button>
        </div>
      </div>
    </form>
  );
}
