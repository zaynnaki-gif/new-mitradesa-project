import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Input, Select, Modal, Badge } from '@/components/ui';

interface TemplateVersion {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  publishedAt?: string;
  creator?: { username: string };
}

interface Template {
  id: string;
  nama: string;
  slug: string;
  deskripsi?: string;
  dokumen: {
    kode: string;
    nama: string;
    layanan: {
      kode: string;
      nama: string;
    };
  };
  latestVersion?: TemplateVersion;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DokumenOption {
  id: string;
  kode: string;
  nama: string;
  layananNama: string;
}

export default function TemplateListPage() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dokumenOptions, setDokumenOptions] = useState<DokumenOption[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    dokumenId: '',
    nama: '',
    slug: '',
    deskripsi: '',
  });

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('DEVELOPER');

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);

      const res = await fetch(`/api/template-designer/templates?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Gagal memuat template');
      }

      const data = await res.json();
      setTemplates(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const loadDokumenOptions = async () => {
    try {
      const res = await fetch('/api/documents?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDokumenOptions(
          (data.data || []).map((d: { id: string; kode: string; nama: string; layanan?: { nama: string } }) => ({
            id: d.id,
            kode: d.kode,
            nama: d.nama,
            layananNama: d.layanan?.nama || '',
          }))
        );
      }
    } catch {
      console.error('Failed to load dokumen options');
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [page, search]);

  useEffect(() => {
    if (showCreateModal) {
      loadDokumenOptions();
    }
  }, [showCreateModal]);

  const handleCreate = async () => {
    if (!newTemplate.nama || !newTemplate.slug || !newTemplate.dokumenId) {
      setError('Nama, slug, dan jenis dokumen wajib diisi');
      return;
    }

    setCreateLoading(true);
    setError('');

    try {
      const res = await fetch('/api/template-designer/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...newTemplate,
          dokumenId: parseInt(newTemplate.dokumenId),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Gagal membuat template');
      }

      const data = await res.json();
      setShowCreateModal(false);
      setNewTemplate({ dokumenId: '', nama: '', slug: '', deskripsi: '' });
      // Navigate to designer
      if (data.data?.latestVersion?.id) {
        navigate(`/admin/surat/designer/${data.data.latestVersion.id}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDuplicate = async (template: Template) => {
    const newNama = `${template.nama} (Copy)`;
    const newSlug = `${template.slug}-copy-${Date.now()}`;

    try {
      const res = await fetch(`/api/template-designer/templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ nama: newNama, slug: newSlug }),
      });

      if (res.ok) {
        loadTemplates();
      }
    } catch {
      console.error('Failed to duplicate template');
    }
  };

  const handleArchive = async (versionId: string) => {
    if (!confirm('Arsipkan versi ini?')) return;

    try {
      const res = await fetch(`/api/template-designer/versions/${versionId}/archive`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.ok) {
        loadTemplates();
      }
    } catch {
      console.error('Failed to archive version');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'muted'> = {
      DRAFT: 'secondary',
      PUBLISHED: 'success',
      ARCHIVED: 'muted',
    };
    const labels: Record<string, string> = {
      DRAFT: 'Draf',
      PUBLISHED: 'Dipublikasi',
      ARCHIVED: 'Diarsipkan',
    };
    return <Badge color={colors[status] || 'muted'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        Memuat data pengguna...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Anda tidak memiliki akses ke halaman ini.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>Template Surat</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Kelola template surat untuk generate dokumen desa
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>+ Buat Template Baru</Button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '1rem' }}>
        <Input
          placeholder="Cari template..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: '320px' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: 'var(--color-error-light, #fef2f2)', border: '1px solid var(--color-error, #fecaca)', color: 'var(--color-error, #b91c1c)', padding: '0.75rem', borderRadius: '0.25rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-muted)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Nama Template</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Jenis Dokumen</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Versi</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Terakhir Diubah</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Memuat...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Belum ada template surat. Klik "Buat Template Baru" untuk membuat.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{template.nama}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{template.deskripsi || '-'}</div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ color: 'var(--color-text-primary)' }}>{template.dokumen.nama}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{template.dokumen.layanan?.nama || '-'}</div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>
                    v{template.latestVersion?.version || 1}
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                      ({template.versionCount} versi)
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {getStatusBadge(template.latestVersion?.status || 'DRAFT')}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(template.updatedAt)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {template.latestVersion && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/admin/surat/designer/${template.latestVersion?.id}`)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleDuplicate(template)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        Duplikat
                      </Button>
                      {template.latestVersion?.status === 'PUBLISHED' && (
                        <Button
                          variant="outline"
                          onClick={() => handleArchive(template.latestVersion!.id)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          Arsipkan
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            Prev
          </Button>
          <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Halaman {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError('');
        }}
        title="Buat Template Baru"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '320px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Jenis Dokumen *
            </label>
            <Select
              name="dokumenId"
              value={newTemplate.dokumenId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setNewTemplate({ ...newTemplate, dokumenId: e.target.value })}
              options={dokumenOptions.map(d => ({
                value: d.id,
                label: `${d.nama} (${d.layananNama})`
              }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Nama Template *
            </label>
            <Input
              name="nama"
              value={newTemplate.nama}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTemplate({
                  ...newTemplate,
                  nama: e.target.value,
                  slug: generateSlug(e.target.value),
                })}
              placeholder="Contoh: Surat Keterangan Domisili"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Slug URL *
            </label>
            <Input
              name="slug"
              value={newTemplate.slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTemplate({ ...newTemplate, slug: e.target.value })}
              placeholder="surat-keterangan-domisili"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Akan digunakan untuk URL template
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Deskripsi (opsional)
            </label>
            <Input
              name="deskripsi"
              value={newTemplate.deskripsi}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTemplate({ ...newTemplate, deskripsi: e.target.value })}
              placeholder="Deskripsi singkat template"
            />
          </div>

          {error && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-error)' }}>{error}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setError('');
              }}
            >
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? 'Membuat...' : 'Buat Template'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
