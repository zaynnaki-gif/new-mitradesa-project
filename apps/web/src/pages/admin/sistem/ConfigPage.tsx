import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './ConfigPage.module.css';
import { safeFetchJson } from '@/lib/fetch';

// ============================================
// Types
// ============================================

interface ConfigItem {
  id: string;
  groupname: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfigGroup {
  name: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  count: number;
}

const VALUE_TYPE_OPTIONS = [
  { value: 'STRING', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean (true/false)' },
  { value: 'JSON', label: 'JSON' },
];

const DEFAULT_GROUPS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'APPEARANCE', label: 'Appearance' },
  { value: 'NOTIFICATION', label: 'Notification' },
  { value: 'INTEGRATION', label: 'Integration' },
  { value: 'FEATURE', label: 'Feature Flags' },
  { value: 'OTHER', label: 'Other' },
];

export default function ConfigPage() {
  const { token } = useAuthStore();

  // ============================================
  // State
  // ============================================
  const [grouped, setGrouped] = useState<Record<string, ConfigItem[]>>({});
  const [groups, setGroups] = useState<ConfigGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    groupname: '',
    key: '',
    value: '',
    valueType: 'STRING' as ConfigItem['valueType'],
    description: '',
  });

  // ============================================
  // Fetch Data
  // ============================================
  const fetchConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedGroup) params.append('groupname', selectedGroup);

      const data = await safeFetchJson(`${API_URL}/config?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (data.success) {
        setGrouped(data.grouped || {});
        // Get unique groups from data
        const uniqueGroups = [...new Set((data.data || []).map((item: ConfigItem) => item.groupname))];
        setGroups(uniqueGroups.map((name: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          name,
          count: (data.data || []).filter((item: ConfigItem) => item.groupname === name).length,
        })));
      } else {
        throw new Error(data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedGroup]);

  // ============================================
  // Modal Handlers
  // ============================================
  const openEditModal = (item: ConfigItem) => {
    setEditingItem(item);
    setFormData({
      groupname: item.groupname,
      key: item.key,
      value: item.value || '',
      valueType: item.valueType,
      description: item.description || '',
    });
    setShowEditModal(true);
  };

  const openAddModal = (groupname: any = '') => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setEditingItem(null);
    setFormData({
      groupname: groupname || 'GENERAL',
      key: '',
      value: '',
      valueType: 'STRING',
      description: '',
    });
    setShowAddModal(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setFormLoading(true);
    try {
      const data = await safeFetchJson(`${API_URL}/config/${editingItem.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: formData.value,
          valueType: formData.valueType,
          description: formData.description,
        }),
      });

      if (data.success) {
        setShowEditModal(false);
        fetchConfig();
      } else {
        alert(data.message || 'Gagal menyimpan');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const data = await safeFetchJson(`${API_URL}/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (data.success) {
        setShowAddModal(false);
        fetchConfig();
      } else {
        alert(data.message || 'Gagal menyimpan');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (item: ConfigItem) => {
    if (!confirm(`Hapus konfigurasi "${item.key}"?`)) return;

    try {
      await safeFetchJson(`${API_URL}/config/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchConfig();
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const formatValue = (item: ConfigItem) => {
    if (!item.value) return <span className={styles.emptyValue}>-</span>;
    if (item.valueType === 'BOOLEAN') {
      return (
        <Badge color={item.value === 'true' ? 'success' : 'error'}>
          {item.value === 'true' ? 'true' : 'false'}
        </Badge>
      );
    }
    if (item.valueType === 'JSON') {
      try {
        return <code className={styles.jsonValue}>{JSON.stringify(JSON.parse(item.value), null, 2)}</code>;
      } catch {
        return <span>{item.value}</span>;
      }
    }
    return <span className={styles.stringValue}>{item.value}</span>;
  };

  const totalItems = Object.values(grouped).flat().length;

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Konfigurasi Aplikasi</h1>
            <p className={styles.subtitle}>
              {totalItems} konfigurasi
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button color="primary" onClick={() => openAddModal(selectedGroup)}>
              + Tambah Konfigurasi
            </Button>
          </div>
        </div>

        {/* Group Filter */}
        <div className={styles.groupFilter}>
          <Button
            color={selectedGroup === '' ? 'primary' : 'secondary'}
            
            onClick={() => setSelectedGroup('')}
          >
            Semua
          </Button>
          {groups.map(g => (
            <Button
              key={g.name}
              color={selectedGroup === g.name ? 'primary' : 'secondary'}
              
              onClick={() => setSelectedGroup(g.name)}
            >
              {g.name} ({g.count})
            </Button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat konfigurasi..." fullPage />
        ) : error ? (
          <ErrorState title="Gagal" message={error} onRetry={fetchConfig} />
        ) : (
          <div className={styles.groupsContainer}>
            {Object.keys(grouped).length === 0 ? (
              <div className={styles.empty}>
                <p>Belum ada konfigurasi.</p>
                <Button onClick={() => openAddModal()}>+ Tambah Konfigurasi</Button>
              </div>
            ) : (
              Object.entries(grouped).map(([groupname, items]) => (
                <div key={groupname} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <h3 className={styles.groupTitle}>{groupname}</h3>
                    <span className={styles.groupCount}>{items.length} item</span>
                  </div>
                  <div className={styles.configTable}>
                    <div className={styles.configHeader}>
                      <span>Key</span>
                      <span>Value</span>
                      <span>Type</span>
                      <span>Aksi</span>
                    </div>
                    {items.map(item => (
                      <div key={item.id} className={styles.configRow}>
                        <div className={styles.configKey}>
                          <code>{item.key}</code>
                          {item.isSystem && <Badge  color="secondary">System</Badge>}
                          {item.description && <small>{item.description}</small>}
                        </div>
                        <div className={styles.configValue}>{formatValue(item)}</div>
                        <div className={styles.configType}>
                          <Badge color="secondary" >{item.valueType}</Badge>
                        </div>
                        <div className={styles.configActions}>
                          {!item.isSystem && (
                            <>
                              <Button color="outline"  onClick={() => openEditModal(item)}>
                                Edit
                              </Button>
                              <Button
                                color="outline"
                                
                                onClick={() => handleDelete(item)}
                                style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                              >
                                Hapus
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingItem && (
          <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Edit Konfigurasi</h2>
                <button onClick={() => setShowEditModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmitEdit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Group</label>
                  <Input value={editingItem.groupname} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Key</label>
                  <Input value={editingItem.key} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Value *</label>
                  {editingItem.valueType === 'BOOLEAN' ? (
                    <Select
                      value={formData.value}
                      onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </Select>
                  ) : editingItem.valueType === 'JSON' ? (
                    <textarea
                      className={styles.textarea}
                      value={formData.value}
                      onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                      rows={5}
                    />
                  ) : (
                    <Input
                      type={editingItem.valueType === 'NUMBER' ? 'number' : 'text'}
                      value={formData.value}
                      onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                    />
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <Input
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button type="button" color="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Tambah Konfigurasi</h2>
                <button onClick={() => setShowAddModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmitAdd} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Group *</label>
                    <Select
                      value={formData.groupname}
                      onChange={e => setFormData(f => ({ ...f, groupname: e.target.value }))}
                    >
                      {DEFAULT_GROUPS.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Key *</label>
                    <Input
                      value={formData.key}
                      onChange={e => setFormData(f => ({ ...f, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
                      placeholder="EXAMPLE_KEY"
                      required
                    />
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Type *</label>
                    <Select
                      value={formData.valueType}
                      onChange={e => setFormData(f => ({ ...f, valueType: e.target.value as ConfigItem['valueType'] }))}
                    >
                      {VALUE_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Value *</label>
                  {formData.valueType === 'BOOLEAN' ? (
                    <Select
                      value={formData.value}
                      onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </Select>
                  ) : formData.valueType === 'JSON' ? (
                    <textarea
                      className={styles.textarea}
                      value={formData.value}
                      onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                      placeholder='{"key": "value"}'
                      rows={5}
                    />
                  ) : (
                    <Input
                      type={formData.valueType === 'NUMBER' ? 'number' : 'text'}
                      value={formData.value}
                      onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                    />
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <Input
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Deskripsi singkat..."
                  />
                </div>
                <div className={styles.formActions}>
                  <Button type="button" color="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
