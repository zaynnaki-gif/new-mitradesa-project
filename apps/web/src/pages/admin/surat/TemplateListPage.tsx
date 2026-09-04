import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { Button, Input, Select, Modal, Badge } from '@/components/ui';
import styles from './TemplateListPage.module.css';
import { safeFetchJson } from '@/lib/fetch';

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

      const data = await safeFetchJson(`${API_URL}/template-designer/templates?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) {
        throw new Error(data.message || 'Gagal memuat template');
      }

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
      const data = await safeFetchJson(`${API_URL}/documents?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTemplates(); }, [page, search]);

  useEffect(() => {
    if (showCreateModal) loadDokumenOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateModal]);

  const handleCreate = async () => {
    if (!newTemplate.nama || !newTemplate.slug || !newTemplate.dokumenId) {
      setError('Nama, slug, dan jenis dokumen wajib diisi');
      return;
    }
    setCreateLoading(true);
    setError('');
    try {
      const data = await safeFetchJson(`${API_URL}/template-designer/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newTemplate, dokumenId: parseInt(newTemplate.dokumenId) }),
      });
      if (!data.success) {
        throw new Error(data.message || 'Gagal membuat template');
      }
      setShowCreateModal(false);
      setNewTemplate({ dokumenId: '', nama: '', slug: '', deskripsi: '' });
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
      const data = await safeFetchJson(`${API_URL}/template-designer/templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nama: newNama, slug: newSlug }),
      });
      if (data.success) loadTemplates();
    } catch {
      console.error('Failed to duplicate template');
    }
  };

  const handleArchive = async (versionId: string) => {
    if (!confirm('Arsipkan versi ini?')) return;
    try {
      const data = await safeFetchJson(`${API_URL}/template-designer/versions/${versionId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) loadTemplates();
    } catch {
      console.error('Failed to archive version');
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const getStatusBadge = (status: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'muted'> = {
      DRAFT: 'secondary', PUBLISHED: 'success', ARCHIVED: 'muted',
    };
    const labels: Record<string, string> = {
      DRAFT: 'Draf', PUBLISHED: 'Dipublikasi', ARCHIVED: 'Diarsipkan',
    };
    return <Badge color={colors[status] || 'muted'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  if (authLoading) {
    return (
      <AdminLayout>
        <div className={styles.loadingCenter}>Memuat data pengguna...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className={styles.accessDenied}>Anda tidak memiliki akses ke halaman ini.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Template Surat</h1>
            <p className={styles.subtitle}>Kelola template surat untuk generate dokumen desa</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ Buat Template Baru</Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <Input
            placeholder="Cari template..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            className={styles.searchInput}
          />
        </div>

        {/* Error */}
        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nama Template</th>
                <th className={styles.th}>Jenis Dokumen</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Versi</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Status</th>
                <th className={styles.th}>Terakhir Diubah</th>
                <th className={`${styles.th} ${styles.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>Memuat...</td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Belum ada template surat. Klik "Buat Template Baru" untuk membuat.
                  </td>
                </tr>
              ) : templates.map((template) => (
                <tr key={template.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.tdPrimary}>{template.nama}</div>
                    <div className={styles.tdMuted}>{template.deskripsi || '-'}</div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.tdPrimary}>{template.dokumen.nama}</div>
                    <div className={styles.tdMuted}>{template.dokumen.layanan?.nama || '-'}</div>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    v{template.latestVersion?.version || 1}
                    <span className={styles.tdMuted}> ({template.versionCount} versi)</span>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    {getStatusBadge(template.latestVersion?.status || 'DRAFT')}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.tdMuted}>{formatDate(template.updatedAt)}</span>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.actionsRow}>
                      {template.latestVersion && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/surat/designer/${template.latestVersion?.id}`)}>
                          Edit
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/surat/templates/${template.id}/fields`)}>
                        Fields (DNA)
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                        Duplikat
                      </Button>
                      {template.latestVersion?.status === 'PUBLISHED' && (
                        <Button variant="outline" size="sm" onClick={() => handleArchive(template.latestVersion!.id)}>
                          Arsipkan
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className={styles.pageInfo}>Halaman {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setError(''); }}
          title="Buat Template Baru"
        >
          <div className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Jenis Dokumen *</label>
              <Select
                name="dokumenId"
                value={newTemplate.dokumenId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setNewTemplate({ ...newTemplate, dokumenId: e.target.value })}
                options={dokumenOptions.map(d => ({ value: d.id, label: `${d.nama} (${d.layananNama})` }))}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Nama Template *</label>
              <Input
                name="nama"
                value={newTemplate.nama}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTemplate({ ...newTemplate, nama: e.target.value, slug: generateSlug(e.target.value) })}
                placeholder="Contoh: Surat Keterangan Domisili"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Slug URL *</label>
              <Input
                name="slug"
                value={newTemplate.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTemplate({ ...newTemplate, slug: e.target.value })}
                placeholder="surat-keterangan-domisili"
              />
              <span className={styles.formHint}>Akan digunakan untuk URL template</span>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Deskripsi (opsional)</label>
              <Input
                name="deskripsi"
                value={newTemplate.deskripsi}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTemplate({ ...newTemplate, deskripsi: e.target.value })}
                placeholder="Deskripsi singkat template"
              />
            </div>
            {error && <div className={styles.errorAlert}>{error}</div>}
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => { setShowCreateModal(false); setError(''); }}>Batal</Button>
              <Button onClick={handleCreate} disabled={createLoading}>
                {createLoading ? 'Membuat...' : 'Buat Template'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
