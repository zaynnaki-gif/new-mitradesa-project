import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { DynamicForm } from '@/components/forms/DynamicForm';
import type { FieldDefinition, FieldOption, FieldType } from '@/components/forms/DynamicForm';
import shared from '../../../styles/AdminShared.module.css';
import s from './LayananListPage.module.css';

interface ILayanan {
  id: string;
  kode: string;
  nama: string;
  slug: string;
  kategori?: string;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'TEXT', label: 'Teks Singkat' },
  { value: 'TEXTAREA', label: 'Teks Panjang' },
  { value: 'NUMBER', label: 'Angka' },
  { value: 'DATE', label: 'Tanggal' },
  { value: 'DATETIME', label: 'Tanggal & Waktu' },
  { value: 'SELECT', label: 'Pilihan Tunggal' },
  { value: 'MULTISELECT', label: 'Pilihan Ganda' },
  { value: 'RADIO', label: 'Radio Button' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'NIK', label: 'NIK' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Telepon' },
  { value: 'ADDRESS', label: 'Alamat' },
  { value: 'FILE', label: 'File Upload' },
];

export default function LayananFieldsPage() {
  const { token } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [layanan, setLayanan] = useState<ILayanan | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<Partial<FieldDefinition>>({
    key: '',
    label: '',
    type: 'TEXT',
    required: false,
    description: '',
    placeholder: '',
    defaultValue: '',
    validation: undefined,
    options: [],
  });

  const [optionsText, setOptionsText] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [layananRes, fieldsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services/${id}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services/${id}/fields`, { headers }),
      ]);

      if (!layananRes.ok) throw new Error('Layanan tidak ditemukan');
      if (!fieldsRes.ok) throw new Error('Gagal memuat fields');

      const layananData = await layananRes.json();
      const fieldsData = await fieldsRes.json();

      setLayanan(layananData.data || layananData);
      setFields(fieldsData.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseOptionsFromText = (text: string): FieldOption[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [value, ...labelParts] = line.split('|');
        return {
          value: value.trim(),
          label: labelParts.join('|').trim() || value.trim(),
        };
      });
  };

  const formatOptionsForEdit = (options: FieldOption[] | undefined): string => {
    if (!options?.length) return '';
    return options.map((o) => `${o.value}|${o.label}`).join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        key: formData.key || formData.label?.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        options: ['SELECT', 'MULTISELECT', 'RADIO'].includes(formData.type || '')
          ? parseOptionsFromText(optionsText)
          : [],
      };

      const url = editingId
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services/${id}/fields/${editingId}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services/${id}/fields`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menyimpan');
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      label: '',
      type: 'TEXT',
      required: false,
      description: '',
      placeholder: '',
      defaultValue: '',
      validation: undefined,
      options: [],
    });
    setOptionsText('');
  };

  const handleEdit = (field: FieldDefinition) => {
    setEditingId(String(field.id));
    setFormData({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      description: field.description || '',
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue || '',
      validation: field.validation,
      options: field.options,
    });
    setOptionsText(formatOptionsForEdit(field.options));
    setShowForm(true);
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Yakin ingin menghapus field ini?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services/${id}/fields/${fieldId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleReorder = async (newOrder: FieldDefinition[]) => {
    setFields(newOrder);
    try {
      const orderData = newOrder.map((f, index) => ({ id: f.id, orderIndex: index }));
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services/${id}/fields/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fields: orderData }),
      });
    } catch (e) {
      console.error('Reorder failed:', e);
      fetchData();
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    handleReorder(newFields);
  };

  if (loading) return <AdminLayout><div style={{ padding: '1.5rem' }}>Memuat...</div></AdminLayout>;
  if (error) return <AdminLayout><div style={{ padding: '1.5rem', color: 'var(--color-error)' }}>{error}</div></AdminLayout>;
  if (!layanan) return <AdminLayout><div style={{ padding: '1.5rem' }}>Layanan tidak ditemukan</div></AdminLayout>;

  return (
    <AdminLayout>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', padding: '1.5rem', alignItems: 'start' }}>
      {/* Builder Side */}
      <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/admin/layanan')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginBottom: '0.5rem',
            padding: 0,
          }}
        >
          ← Kembali ke Daftar Layanan
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Field: {layanan.nama}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Kelola form field untuk layanan {layanan.nama} ({layanan.kode})
        </p>
      </div>

      {/* Toolbar */}
      <div className={shared.pageHeader} style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {fields.length} field(s)
        </span>
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
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Field
        </button>
      </div>

      {/* Fields List */}
      <div className={shared.tableContainer}>
        {fields.length === 0 ? (
          <div className={shared.emptyState}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
            <p style={{ margin: '0 0 0.25rem' }}>Belum ada field</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Tambahkan field untuk membuat form
            </p>
          </div>
        ) : (
          <table className={shared.table}>
            <thead>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`} style={{ width: '4rem' }}>Urutan</th>
                <th className={shared.th}>Label</th>
                <th className={shared.th}>Key</th>
                <th className={shared.th}>Type</th>
                <th className={`${shared.th} ${shared.thCenter}`}>Wajib</th>
                <th className={`${shared.th} ${shared.thRight}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        style={{
                          background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer',
                          color: 'var(--color-text-secondary)', opacity: index === 0 ? 0.3 : 1, lineHeight: 1,
                        }}
                      >▲</button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{index + 1}</span>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === fields.length - 1}
                        style={{
                          background: 'none', border: 'none', cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer',
                          color: 'var(--color-text-secondary)', opacity: index === fields.length - 1 ? 0.3 : 1, lineHeight: 1,
                        }}
                      >▼</button>
                    </div>
                  </td>
                  <td className={shared.td}>
                    <div style={{ fontWeight: 500 }}>{field.label}</div>
                    {field.description && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{field.description}</div>
                    )}
                  </td>
                  <td className={shared.td}>
                    <code className={s.codeBadge}>{field.key}</code>
                  </td>
                  <td className={shared.td} style={{ fontSize: '0.875rem' }}>
                    {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    {field.required ? (
                      <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>Ya</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)' }}>Tidak</span>
                    )}
                  </td>
                  <td className={`${shared.td} ${shared.tdRight}`}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      <button onClick={() => handleEdit(field)} className={`${s.actionLink} ${s.actionLinkBlue}`}>Edit</button>
                      <button onClick={() => handleDelete(String(field.id))} className={`${s.actionLink} ${s.actionLinkRed}`}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className={s.modalOverlay}>
          <div className={s.modalBox}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>{editingId ? 'Edit Field' : 'Tambah Field Baru'}</h2>
            </div>
            <form onSubmit={handleSubmit} className={s.modalForm}>
              {formError && <div className={s.formError}>{formError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Label <span className={s.required}>*</span></label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className={s.input}
                    placeholder="Nama Field"
                    required
                  />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Key</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                    className={s.input}
                    placeholder="auto-generated"
                  />
                  <span className={s.hint}>Identifier untuk binding</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Tipe Field</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FieldType })}
                    className={s.input}
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Placeholder</label>
                  <input
                    type="text"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    className={s.input}
                    placeholder="Placeholder text"
                  />
                </div>
              </div>

              {['SELECT', 'MULTISELECT', 'RADIO'].includes(formData.type || '') && (
                <div className={s.fieldGroup}>
                  <label className={s.label}>Opsi (satu per baris)</label>
                  <span className={s.hint}>Format: value|Label</span>
                  <textarea
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    className={`${s.input} ${s.textarea}`}
                    style={{ fontFamily: 'monospace' }}
                    rows={4}
                    placeholder={"AKTIF|Aktif\nTIDAK|Nonaktif"}
                  />
                </div>
              )}

              <div className={s.fieldGroup}>
                <label className={s.label}>Deskripsi</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={s.input}
                  placeholder="Deskripsi/help text"
                />
              </div>

              <label className={s.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className={s.checkbox}
                />
                Field wajib diisi
              </label>

              <div className={s.formActions}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                  className={s.btnCancel}
                >
                  Batal
                </button>
                <button type="submit" disabled={formLoading} className={s.btnSubmit}>
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Live Preview Side */}
      <div style={{ 
        position: 'sticky', 
        top: '1.5rem', 
        background: 'var(--color-surface, #fff)', 
        padding: '1.5rem', 
        borderRadius: 'var(--radius-lg, 8px)', 
        border: '1px solid var(--color-border)', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
          Live Preview
        </h2>
        <div style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {fields.length > 0 ? (
            <DynamicForm 
              fields={fields} 
              onSubmit={(vals) => alert('Simulasi Submit Form:\n' + JSON.stringify(vals, null, 2))} 
            />
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
              Tambahkan field untuk melihat pratinjau form.
            </p>
          )}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
