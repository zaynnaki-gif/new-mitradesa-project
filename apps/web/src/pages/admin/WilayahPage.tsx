import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { useWilayahStore } from '@/stores/wilayah.store';
import { API_URL } from '@/lib/constants';
import { WilayahSelector } from '@/components/WilayahSelector';
import styles from './WilayahPage.module.css';

// Types
interface Gubug {
  id: string;
  kode: string;
  nama: string;
}

interface Rw {
  id: string;
  gubugId: string;
  kode: string;
  nama: string;
}

interface Rt {
  id: string;
  rwId: string;
  kode: string;
}

interface TreeNode {
  id: string;
  kode: string;
  nama: string;
  level: 'gubug' | 'rw' | 'rt';
}

type FormType = 'gubug' | 'rw' | 'rt' | null;

export function WilayahPage() {
  const { token } = useAuthStore();
  const { activeWilayah, activeDesaId: storedDesaId } = useWilayahStore();

  // State - use stored desa ID if available
  const [selectedDesaId, setSelectedDesaId] = useState<string>(storedDesaId || '');
  const [gubugs, setGubugs] = useState<Gubug[]>([]);
  const [rws, setRws] = useState<Rw[]>([]);
  const [rts, setRts] = useState<Rt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<FormType>(null);
  const [editingItem, setEditingItem] = useState<TreeNode | null>(null);
  const [parentContext, setParentContext] = useState<{ level: string; id: string } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form data
  const [gubugForm, setGubugForm] = useState({ kode: '', nama: '' });
  const [rwForm, setRwForm] = useState({ kode: '', nama: '' });
  const [rtForm, setRtForm] = useState({ kode: '' });

  // Handle wilayah selection - sync with store's active wilayah
  const handleWilayahChange = useCallback((desaId: number) => {
    setSelectedDesaId(desaId.toString());
  }, []);

  // Sync selectedDesaId with stored value when store changes
  useEffect(() => {
    if (storedDesaId && !selectedDesaId) {
      setSelectedDesaId(storedDesaId);
    }
  }, [storedDesaId, selectedDesaId]);

  // Fetch all wilayah data
  const fetchWilayah = useCallback(async () => {
    if (!selectedDesaId) {
      setGubugs([]);
      setRws([]);
      setRts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/wilayah/dropdown?desaId=${selectedDesaId}`);
      const data = await res.json();

      if (data.success) {
        setGubugs(data.data.gubug.map((g: any) => ({
          id: g.id.toString(),
          kode: g.kode,
          nama: g.nama,
        })));
        setRws(data.data.rw.map((r: any) => ({
          id: r.id.toString(),
          gubugId: r.gubugId.toString(),
          kode: r.kode,
          nama: r.nama,
        })));
        setRts(data.data.rt.map((rt: any) => ({
          id: rt.id.toString(),
          rwId: rt.rwId.toString(),
          kode: rt.kode,
        })));
      } else {
        throw new Error(data.error?.message || 'Failed to fetch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedDesaId, API_URL]);

  useEffect(() => {
    fetchWilayah();
  }, [fetchWilayah]);

  // Open add modal
  const openAddModal = (type: FormType, context?: { level: string; id: string }) => {
    setFormType(type);
    setEditingItem(null);
    setParentContext(context || null);
    setGubugForm({ kode: '', nama: '' });
    setRwForm({ kode: '', nama: '' });
    setRtForm({ kode: '' });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (item: TreeNode) => {
    setFormType(item.level);
    setEditingItem(item);
    setParentContext(null);
    if (item.level === 'gubug') {
      setGubugForm({ kode: item.kode, nama: item.nama });
    } else if (item.level === 'rw') {
      setRwForm({ kode: item.kode, nama: item.nama });
    } else {
      setRtForm({ kode: item.kode });
    }
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      let url = '';
      let method = 'POST';
      let body: any = {};

      // Use activeWilayah.desaId if available, otherwise use selectedDesaId
      const currentDesaId = activeWilayah?.desaId || selectedDesaId;

      if (formType === 'gubug') {
        url = `${API_URL}/wilayah/gubug`;
        body = { ...gubugForm, desaId: parseInt(currentDesaId) };
      } else if (formType === 'rw') {
        if (editingItem) {
          url = `${API_URL}/wilayah/rw/${editingItem.id}`;
          method = 'PUT';
          body = rwForm;
        } else {
          url = `${API_URL}/wilayah/rw`;
          body = { ...rwForm, gubugId: parseInt(parentContext?.id || '0') };
        }
      } else if (formType === 'rt') {
        if (editingItem) {
          url = `${API_URL}/wilayah/rt/${editingItem.id}`;
          method = 'PUT';
          body = rtForm;
        } else {
          url = `${API_URL}/wilayah/rt`;
          body = { ...rtForm, rwId: parseInt(parentContext?.id || '0') };
        }
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchWilayah();
      } else {
        alert(data.error?.message || 'Terjadi kesalahan');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete item
  const handleDelete = async (item: TreeNode) => {
    const typeName = item.level === 'gubug' ? 'Gubug' : item.level === 'rw' ? 'RW' : 'RT';
    const itemName = item.level === 'rt' ? item.kode : `${item.kode} - ${item.nama}`;

    if (!confirm(`Yakin ingin menghapus ${typeName} "${itemName}"?`)) {
      return;
    }

    try {
      const url = `${API_URL}/wilayah/${item.level}/${item.id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        fetchWilayah();
      } else {
        alert(data.error?.message || 'Gagal menghapus');
      }
    } catch {
      alert('Gagal menghapus');
    }
  };

  // Get RW for a gubug
  const getRwForGubug = (gubugId: string) => rws.filter(r => r.gubugId === gubugId);

  // Get RT for a RW
  const getRtForRw = (rwId: string) => rts.filter(rt => rt.rwId === rwId);

  // Get initial values from stored wilayah for WilayahSelector
  const initialValues = activeWilayah ? {
    provinsiId: parseInt(activeWilayah.provinsiId),
    kabupatenId: parseInt(activeWilayah.kabupatenId),
    kecamatanId: parseInt(activeWilayah.kecamatanId),
    desaId: parseInt(activeWilayah.desaId),
  } : undefined;

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Master Wilayah</h1>
          <p className={styles.subtitle}>
            Gubug (Dusun), RW, dan RT
            {activeWilayah && (
              <span className={styles.activeDesa}>
                {' '}• {activeWilayah.desaNama}
              </span>
            )}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => openAddModal('gubug')} disabled={!selectedDesaId && !activeWilayah}>
            + Tambah Gubug
          </Button>
        </div>
      </div>

      {/* Wilayah Selector - always visible to show selection is saved */}
      <div className={styles.desaSelector}>
        <WilayahSelector
          selectedDesaId={selectedDesaId ? parseInt(selectedDesaId) : undefined}
          onChange={handleWilayahChange}
          label="Wilayah Aktif"
          initialValues={initialValues}
          persistToStore={true}
        />
        {activeWilayah && (
          <p className={styles.wilayahHint}>
            ✓ Pemilihan wilayah tersimpan dan akan diingat di sesi berikutnya
          </p>
        )}
      </div>

      {/* Content */}
      {!selectedDesaId && !activeWilayah ? (
        <div className={styles.emptyState}>
          <p>Pilih desa terlebih dahulu untuk melihat data wilayah</p>
        </div>
      ) : loading ? (
        <LoadingState message="Memuat data wilayah..." fullPage />
      ) : error ? (
        <ErrorState title="Gagal Memuat Data" message={error} onRetry={fetchWilayah} />
      ) : (
        <div className={styles.treeContainer}>
          {gubugs.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Belum ada data wilayah untuk desa ini</p>
              <Button variant="primary" onClick={() => openAddModal('gubug')}>
                + Tambah Gubug
              </Button>
            </div>
          ) : (
            gubugs.map(gubug => {
              const gubugRws = getRwForGubug(gubug.id);
              return (
                <div key={gubug.id} className={styles.gubugBlock}>
                  {/* Gubug Header */}
                  <div className={styles.gubugHeader}>
                    <span className={styles.gubugIcon}>🏘️</span>
                    <span className={styles.gubugLabel}>
                      <strong>{gubug.kode}</strong> - {gubug.nama}
                    </span>
                    <span className={styles.gubugBadge}>Gubug</span>
                    <div className={styles.gubugActions}>
                      <Button variant="outline" size="sm" onClick={() => openAddModal('rw', { level: 'gubug', id: gubug.id })}>
                        + RW
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditModal({ ...gubug, level: 'gubug' })}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete({ ...gubug, level: 'gubug' })}
                        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>

                  {/* RW List */}
                  {gubugRws.length > 0 && (
                    <div className={styles.rwList}>
                      {gubugRws.map(rw => {
                        const rwRts = getRtForRw(rw.id);
                        return (
                          <div key={rw.id} className={styles.rwBlock}>
                            <div className={styles.rwHeader}>
                              <span className={styles.rwIcon}>📍</span>
                              <span className={styles.rwLabel}>
                                <strong>RW {rw.kode}</strong> - {rw.nama}
                              </span>
                              <span className={styles.rwBadge}>RW</span>
                              <div className={styles.rwActions}>
                                <Button variant="outline" size="sm" onClick={() => openAddModal('rt', { level: 'rw', id: rw.id })}>
                                  + RT
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openEditModal({ ...rw, level: 'rw' })}>
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete({ ...rw, level: 'rw' })}
                                  style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                >
                                  Hapus
                                </Button>
                              </div>
                            </div>

                            {/* RT List */}
                            {rwRts.length > 0 && (
                              <div className={styles.rtList}>
                                {rwRts.map(rt => (
                                  <div key={rt.id} className={styles.rtRow}>
                                    <span className={styles.rtIcon}>🚪</span>
                                    <span className={styles.rtLabel}>
                                      <strong>RT {rt.kode}</strong>
                                    </span>
                                    <span className={styles.rtBadge}>RT</span>
                                    <div className={styles.rtActions}>
                                      <Button variant="outline" size="sm" onClick={() => openEditModal({ ...rt, level: 'rt', nama: '' })}>
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete({ ...rt, level: 'rt', nama: '' })}
                                        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                      >
                                        Hapus
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={
        formType === 'gubug' ? (editingItem ? 'Edit Gubug' : 'Tambah Gubug') :
        formType === 'rw' ? (editingItem ? 'Edit RW' : 'Tambah RW') :
        (editingItem ? 'Edit RT' : 'Tambah RT')
      }>
        <form onSubmit={handleSubmit} className={styles.form}>
          {formType === 'gubug' && (
            <>
              <Input
                label="Kode Gubug"
                value={gubugForm.kode}
                onChange={(e) => setGubugForm({ ...gubugForm, kode: e.target.value })}
                required
                placeholder="Contoh: 01"
              />
              <Input
                label="Nama Gubug"
                value={gubugForm.nama}
                onChange={(e) => setGubugForm({ ...gubugForm, nama: e.target.value })}
                required
                placeholder="Contoh: Mandiri"
              />
            </>
          )}

          {formType === 'rw' && (
            <>
              <Input
                label="Kode RW"
                value={rwForm.kode}
                onChange={(e) => setRwForm({ ...rwForm, kode: e.target.value })}
                required
                placeholder="Contoh: 01"
              />
              <Input
                label="Nama RW"
                value={rwForm.nama}
                onChange={(e) => setRwForm({ ...rwForm, nama: e.target.value })}
                required
                placeholder="Contoh: RW 01"
              />
            </>
          )}

          {formType === 'rt' && (
            <Input
              label="Kode RT"
              value={rtForm.kode}
              onChange={(e) => setRtForm({ ...rtForm, kode: e.target.value })}
              required
              placeholder="Contoh: 001"
            />
          )}

          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </AdminLayout>
  );
}
