import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import shared from '../../../styles/AdminShared.module.css';
import s from './LayananListPage.module.css';
import { useConfirm } from '@/hooks/useConfirm';
import { 
  Layanan, 
  useAdminLayananList, 
  useCreateLayanan, 
  useUpdateLayanan, 
  useDeleteLayanan 
} from '@/hooks/useLayanan';

const KATEGORI_OPTIONS = [
  { value: 'SURAT', label: 'Surat Keterangan' },
  { value: 'PENGANTAR', label: 'Surat Pengantar' },
  { value: 'IZIN', label: 'Izin' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export default function LayananListPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { confirm, ConfirmElement } = useConfirm();
  
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ search: '', kategori: '', isActive: '' });
  const [searchInput, setSearchInput] = useState('');

  const { data: listResponse, isLoading, error: queryError, refetch } = useAdminLayananList(
    page, 
    token || '', 
    { search: filter.search, kategori: filter.kategori, isActive: filter.isActive }
  );

  const createMutation = useCreateLayanan();
  const updateMutation = useUpdateLayanan();
  const deleteMutation = useDeleteLayanan();

  const data = listResponse?.data || [];
  const pagination = listResponse?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const error = queryError instanceof Error ? queryError.message : null;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Layanan>>({
    kode: '',
    nama: '',
    slug: '',
    kategori: '',
    deskripsi: '',
    requiresDocument: true,
    requiresApproval: true,
    isActive: true,
  });

  const handleSearch = () => {
    setFilter(prev => ({ ...prev, search: searchInput }));
    setPage(1);
  };

  const handleStatusChange = (isActive: string) => {
    setFilter(prev => ({ ...prev, isActive }));
    setPage(1);
  };
  
  const handleKategoriChange = (kategori: string) => {
    setFilter(prev => ({ ...prev, kategori }));
    setPage(1);
  };

  const generateSlug = (nama: string) => {
    return nama
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSubmit = {
        ...formData,
        slug: formData.slug || generateSlug(formData.nama || ''),
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: dataToSubmit, token: token || '' });
      } else {
        await createMutation.mutateAsync({ data: dataToSubmit, token: token || '' });
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setFormData({
      kode: '',
      nama: '',
      slug: '',
      kategori: '',
      deskripsi: '',
      requiresDocument: true,
      requiresApproval: true,
      isActive: true,
    });
  };

  const handleEdit = (item: Layanan) => {
    setEditingId(item.id);
    setFormData({
      kode: item.kode,
      nama: item.nama,
      slug: item.slug,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      requiresDocument: item.requiresDocument,
      requiresApproval: item.requiresApproval,
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const _ok = await confirm({ message: 'Yakin ingin menghapus layanan ini?', title: 'Konfirmasi' }); 
    if (!_ok) return;
    try {
      await deleteMutation.mutateAsync({ id, token: token || '' });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const handleToggleActive = async (item: Layanan) => {
    try {
      await updateMutation.mutateAsync({ id: item.id, data: { isActive: !item.isActive }, token: token || '' });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      {ConfirmElement}
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div className={shared.pageHeader}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Manajemen Layanan
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Kelola layanan surat dan dokumen desa
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Layanan
        </button>
      </div>

      {/* Filters */}
      <div className={shared.filters}>
        <input
          type="text"
          placeholder="Cari layanan..."
          className={shared.searchInput}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          className={shared.selectInput}
          value={filter.kategori}
          onChange={(e) => handleKategoriChange(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {KATEGORI_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className={shared.selectInput}
          value={filter.isActive}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className={shared.tableContainer}>
        {isLoading ? (
          <div className={shared.emptyState}>Memuat...</div>
        ) : error ? (
          <div className={shared.emptyState} style={{ color: 'var(--color-error)' }}>
            {error}
            <button onClick={() => refetch()} style={{marginLeft: '1rem'}}>Coba lagi</button>
          </div>
        ) : data.length === 0 ? (
          <div className={shared.emptyState}>
            <div className={s.emptyIcon}>📄</div>
            <p>Belum ada layanan</p>
            <button className={s.emptyLink} onClick={() => setShowForm(true)}>
              Tambah layanan pertama
            </button>
          </div>
        ) : (
          <table className={shared.table}>
            <thead>
              <tr>
                <th className={shared.th}>Kode</th>
                <th className={shared.th}>Nama</th>
                <th className={shared.th}>Kategori</th>
                <th className={`${shared.th} ${shared.thCenter}`}>Field</th>
                <th className={`${shared.th} ${shared.thCenter}`}>Status</th>
                <th className={shared.th}>Dibuat</th>
                <th className={`${shared.th} ${shared.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className={shared.tr}>
                  <td className={shared.td}>
                    <span className={s.codeBadge}>{item.kode}</span>
                  </td>
                  <td className={shared.td}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.nama}</div>
                    {item.deskripsi && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                        {item.deskripsi}
                      </div>
                    )}
                  </td>
                  <td className={shared.td} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {KATEGORI_OPTIONS.find((k) => k.value === item.kategori)?.label || item.kategori || '-'}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {/* @ts-expect-error ignore */}
                    {item._count?.fields || 0} field
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={updateMutation.isPending}
                      className={`${s.statusBadge} ${item.isActive ? s.statusActive : s.statusInactive}`}
                    >
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className={shared.td} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {/* @ts-expect-error ignore */}
                    {formatDate(item.createdAt)}
                  </td>
                  <td className={`${shared.td} ${shared.tdRight}`}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      <button
                        onClick={() => navigate(`/admin/layanan/${item.id}/fields`)}
                        className={`${s.actionLink} ${s.actionLinkGreen}`}
                        title="Kelola Field"
                      >
                        Fields
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className={`${s.actionLink} ${s.actionLinkBlue}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                        className={`${s.actionLink} ${s.actionLinkRed}`}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={shared.pagination}>
          <span className={shared.pageInfo}>
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <div className={shared.paginationControls}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage(pagination.page - 1)}
              style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-base)',
                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.page <= 1 ? 0.5 : 1,
                fontSize: '0.875rem',
              }}
            >
              ← Sebelumnya
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(pagination.page + 1)}
              style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-base)',
                cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                fontSize: '0.875rem',
              }}
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className={s.modalOverlay}>
          <div className={s.modalBox}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>
                {editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className={s.modalForm}>
              {createMutation.error && (
                <div className={s.formError}>{createMutation.error.message}</div>
              )}
              {updateMutation.error && (
                <div className={s.formError}>{updateMutation.error.message}</div>
              )}

              <div className={s.fieldGroup}>
                <label className={s.label}>
                  Kode <span className={s.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                  className={s.input}
                  placeholder="Contoh: SKD"
                  required
                />
                <span className={s.hint}>Kode unik untuk layanan (huruf besar)</span>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>
                  Nama Layanan <span className={s.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className={s.input}
                  placeholder="Contoh: Surat Keterangan Domisili"
                  required
                />
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className={s.input}
                  placeholder="auto-generated-from-name"
                />
                <span className={s.hint}>URL-friendly identifier (auto-generated jika kosong)</span>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className={s.input}
                >
                  <option value="">Pilih Kategori</option>
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className={`${s.input} ${s.textarea}`}
                  rows={3}
                  placeholder="Deskripsi layanan..."
                />
              </div>

              <div className={s.checkboxGroup}>
                <label className={s.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.requiresDocument}
                    onChange={(e) => setFormData({ ...formData, requiresDocument: e.target.checked })}
                    className={s.checkbox}
                  />
                  Membutuhkan dokumen output
                </label>
                <label className={s.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    className={s.checkbox}
                  />
                  Membutuhkan persetujuan operator
                </label>
                {editingId && (
                  <label className={s.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className={s.checkbox}
                    />
                    Layanan aktif
                  </label>
                )}
              </div>

              <div className={s.formActions}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                  className={s.btnCancel}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className={s.btnSubmit}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
