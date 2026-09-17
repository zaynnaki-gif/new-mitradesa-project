import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Modal } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { useWilayahStore } from '@/stores/wilayah.store';
import { WilayahSelector } from '@/components/WilayahSelector';
import { useWilayahTree, useCreateWilayah, useUpdateWilayah, useDeleteWilayah, Level } from '@/hooks/useWilayah';
import styles from './WilayahPage.module.css';

// Types
interface TreeNode {
  id: string;
  kode: string;
  nama: string;
  level: 'gubug' | 'rw' | 'rt';
}

type FormType = 'gubug' | 'rw' | 'rt' | null;

export function WilayahPage() {
  const { token } = useAuthStore();
  const { activeWilayah } = useWilayahStore();
  const storedDesaId = activeWilayah?.desaId;

  // State - use stored desa ID if available
  const [selectedDesaId, setSelectedDesaId] = useState<string>(storedDesaId || '');
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

  // Fetch all wilayah data via react-query
  const { data: wilayahData, isLoading: loading, error: queryError } = useWilayahTree(selectedDesaId);
  const error = queryError ? queryError.message : null;
  const gubugs = wilayahData?.gubug || [];
  const rws = wilayahData?.rw || [];
  const rts = wilayahData?.rt || [];

  // Mutations
  const createMutation = useCreateWilayah(selectedDesaId);
  const updateMutation = useUpdateWilayah(selectedDesaId);
  const deleteMutation = useDeleteWilayah(selectedDesaId);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<FormType>(null);
  const [editingItem, setEditingItem] = useState<TreeNode | null>(null);
  const [parentContext, setParentContext] = useState<{ level: string; id: string } | null>(null);

  // Form data
  const [gubugForm, setGubugForm] = useState({ kode: '', nama: '' });
  const [rwForm, setRwForm] = useState({ kode: '', nama: '' });
  const [rtForm, setRtForm] = useState({ kode: '' });

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
    if (!formType || !token) return;
    
    try {
      let body: any = {};
      
      if (formType === 'gubug') {
        body = { ...gubugForm, desaId: parseInt(selectedDesaId) };
      } else if (formType === 'rw') {
        body = editingItem ? rwForm : { ...rwForm, gubugId: parseInt(parentContext?.id || '0') };
      } else if (formType === 'rt') {
        body = editingItem ? rtForm : { ...rtForm, rwId: parseInt(parentContext?.id || '0') };
      }

      if (editingItem) {
        await updateMutation.mutateAsync({ level: formType as Level, id: editingItem.id, data: body, token });
      } else {
        await createMutation.mutateAsync({ level: formType as Level, data: body, token });
      }
      
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
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
      await deleteMutation.mutateAsync({ level: item.level as Level, id: item.id, token: token || '' });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
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
        <ErrorState title="Gagal Memuat Data" message={error} />
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
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </AdminLayout>
  );
}
