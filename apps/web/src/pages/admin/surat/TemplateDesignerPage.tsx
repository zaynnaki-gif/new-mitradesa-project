import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './TemplateDesignerPage.module.css';

type ElementType = 'text' | 'field' | 'divider' | 'spacer' | 'page_break';

interface Element {
  id: string;
  type: ElementType;
  content?: string;
  binding?: string;
  label?: string;
  formatter?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  height?: number;
  style?: string;
  thickness?: number;
}

interface TemplateVersion {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  content: {
    metadata: { name: string; description?: string };
    elements: Element[];
  };
  kopConfig?: Record<string, unknown>;
  signatureConfig?: Record<string, unknown>;
  createdAt: string;
  creator?: { username: string };
}

interface BindingOption {
  path: string;
  category: string;
  label: string;
}

interface FormatterOption {
  name: string;
  label: string;
}

export default function TemplateDesignerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuthStore();

  const [version, setVersion] = useState<TemplateVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [bindings, setBindings] = useState<BindingOption[]>([]);
  const [formatters, setFormatters] = useState<FormatterOption[]>([]);

  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showKopEditor, setShowKopEditor] = useState(false);
  const [showSignatory, setShowSignatory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('DEVELOPER');

  const loadVersion = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/template-designer/versions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Gagal memuat template');
      }

      const data = await res.json();
      setVersion(data.data);

      const content = data.data.content;
      if (content?.elements && Array.isArray(content.elements)) {
        setElements(content.elements);
      } else {
        setElements([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadRegistry = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/template-designer/registry`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setBindings(data.data.bindings || []);
        setFormatters(data.data.formatters || []);
      }
    } catch {
      console.error('Failed to load registry');
    }
  }, []);

  useEffect(() => {
    loadVersion();
    loadRegistry();
  }, [loadVersion, loadRegistry]);

  const addElement = (type: ElementType) => {
    const newElement: Element = {
      id: crypto.randomUUID(),
      type,
    };

    switch (type) {
      case 'text':
        newElement.content = 'Teks baru';
        newElement.fontSize = 11;
        newElement.fontWeight = 'normal';
        newElement.textAlign = 'left';
        break;
      case 'field':
        newElement.binding = 'penduduk.namaLengkap';
        newElement.label = '';
        newElement.fontSize = 11;
        newElement.textAlign = 'left';
        break;
      case 'divider':
        newElement.style = 'solid';
        newElement.thickness = 1;
        break;
      case 'spacer':
        newElement.height = 20;
        break;
    }

    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<Element>) => {
    setElements(
      elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (elementId: string) => {
    setElements(elements.filter((el) => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    const index = elements.findIndex((el) => el.id === elementId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= elements.length) return;

    const newElements = [...elements];
    [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
    setElements(newElements);
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    setError('');
    try {
      const content = {
        metadata: {
          name: version?.content?.metadata?.name || 'Template',
          description: '',
          createdAt: new Date().toISOString(),
          version: version?.version || 1,
        },
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements,
      };

      const res = await fetch(`${API_URL}/template-designer/versions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          changelog: 'Update template',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Gagal menyimpan template');
      }

      setSuccessMessage('Template berhasil disimpan');
      setTimeout(() => setSuccessMessage(''), 3000);

      loadVersion();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!id) return;

    try {
      const res = await fetch(`${API_URL}/template-designer/versions/${id}/validate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setValidationResult(data.data);
      }
    } catch {
      console.error('Failed to validate');
    }
  };

  const handlePublish = async () => {
    if (!id) return;

    try {
      const res = await fetch(`${API_URL}/template-designer/versions/${id}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSuccessMessage('Template berhasil dipublikasikan');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadVersion();
      }
    } catch {
      setError('Failed to publish');
    }
  };

  const insertBinding = (path: string, formatter?: string) => {
    if (selectedElementId) {
      updateElement(selectedElementId, { binding: path, formatter });
    } else {
      addElement('field');
    }
    setShowFieldPicker(false);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Memuat data pengguna...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className={styles.noAccess}>
          Anda tidak memiliki akses ke halaman ini.
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Memuat template...</div>
      </AdminLayout>
    );
  }

  if (error && !version) {
    return (
      <AdminLayout>
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );
  }

  const getStatusClass = () => {
    switch (version?.status) {
      case 'PUBLISHED': return styles.statusPublished;
      case 'ARCHIVED': return styles.statusArchived;
      default: return styles.statusDraft;
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={() => navigate('/admin/surat/templates')}>
              ← Kembali
            </button>
            <div className={styles.templateInfo}>
              <h1 className={styles.templateTitle}>
                {version?.content?.metadata?.name || 'Template Designer'}
              </h1>
              <p className={styles.templateMeta}>
                Versi {version?.version} • Status:{' '}
                <span className={`${styles.statusBadge} ${getStatusClass()}`}>
                  {version?.status}
                </span>
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={`${styles.button} ${styles.buttonOutline}`} onClick={() => setShowPreview(true)}>
              Preview
            </button>
            <button className={`${styles.button} ${styles.buttonOutline}`} onClick={handleValidate}>
              Validasi
            </button>
            <button
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            {version?.status === 'DRAFT' && (
              <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handlePublish}>
                Publikasi
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            {error}
          </div>
        )}

        {/* Success banner */}
        {successMessage && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            {successMessage}
          </div>
        )}

        {/* Validation result */}
        {validationResult && (
          <div className={`${styles.alert} ${validationResult.valid ? styles.alertSuccess : styles.alertError}`}>
            {validationResult.valid
              ? '✓ Template valid dan siap dipublikasi'
              : `✗ ${validationResult.errors.length} error ditemukan`}
          </div>
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Left Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Elemen</div>
              <div className={styles.sidebarButtons}>
                <button className={styles.sidebarButton} onClick={() => addElement('text')}>
                  <span>T</span> Teks
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('field')}>
                  <span>{'{}'}</span> Field Data
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('divider')}>
                  <span>—</span> Garis
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('spacer')}>
                  <span>↕</span> Spasi
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('page_break')}>
                  <span>⏹</span> Page Break
                </button>
              </div>
            </div>

            <div className={styles.sidebarDivider} />

            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Konfigurasi</div>
              <div className={styles.sidebarButtons}>
                <button className={styles.sidebarButton} onClick={() => setShowFieldPicker(true)}>
                  📋 Insert Field
                </button>
                <button className={styles.sidebarButton} onClick={() => setShowKopEditor(true)}>
                  🏛️ Kop Surat
                </button>
                <button className={styles.sidebarButton} onClick={() => setShowSignatory(true)}>
                  ✍️ Tanda Tangan
                </button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className={styles.canvas}>
            <div className={styles.canvasPaper}>
              <div className={styles.paper}>
                <div className={styles.paperContent}>
                  {elements.length === 0 ? (
                    <div className={styles.canvasEmpty}>
                      <p className={styles.canvasEmptyTitle}>
                        Klik elemen di sidebar untuk menambahkan
                      </p>
                      <p className={styles.canvasEmptyHint}>
                        atau gunakan "Insert Field" untuk menambahkan field data
                      </p>
                    </div>
                  ) : (
                    elements.map((element) => (
                      <div
                        key={element.id}
                        className={`${styles.element} ${selectedElementId === element.id ? styles.elementSelected : ''}`}
                        onClick={() => setSelectedElementId(element.id)}
                      >
                        {/* Controls */}
                        <div className={styles.elementControls}>
                          <button
                            className={styles.elementControl}
                            onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'up'); }}
                          >
                            ↑
                          </button>
                          <button
                            className={styles.elementControl}
                            onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'down'); }}
                          >
                            ↓
                          </button>
                          <button
                            className={`${styles.elementControl} ${styles.elementControlDelete}`}
                            onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Element content */}
                        {element.type === 'text' && (
                          <div
                            className={styles.textElement}
                            style={{
                              fontSize: `${element.fontSize || 11}px`,
                              fontWeight: element.fontWeight as any || 'normal',
                              textAlign: element.textAlign as any || 'left',
                            }}
                          >
                            {element.content}
                          </div>
                        )}

                        {element.type === 'field' && (
                          <div className={styles.fieldElement}>
                            {element.label && (
                              <span className={styles.fieldLabel}>{element.label}</span>
                            )}
                            <span className={styles.fieldBinding}>
                              {element.binding}{element.formatter && ` | ${element.formatter}`}
                            </span>
                          </div>
                        )}

                        {element.type === 'divider' && (
                          <hr
                            className={styles.dividerElement}
                            style={{
                              borderTopWidth: element.thickness || 1,
                              borderStyle: element.style as any || 'solid',
                            }}
                          />
                        )}

                        {element.type === 'spacer' && (
                          <div className={styles.spacerElement} style={{ height: element.height || 20 }} />
                        )}

                        {element.type === 'page_break' && (
                          <div className={styles.pageBreakElement}>
                            — Page Break —
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className={styles.properties}>
            {selectedElement ? (
              <div>
                <div className={styles.propertiesTitle}>
                  Properties: {selectedElement.type.toUpperCase()}
                </div>

                {selectedElement.type === 'text' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Konten</label>
                      <textarea
                        value={selectedElement.content || ''}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className={`${styles.propertyInput} ${styles.propertyTextarea}`}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Ukuran Font</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 11}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 11 })}
                        className={styles.propertyInput}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Style</label>
                      <select
                        value={selectedElement.fontWeight || 'normal'}
                        onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                        className={styles.propertyInput}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'field' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Binding</label>
                      <input
                        value={selectedElement.binding || ''}
                        onChange={(e) => updateElement(selectedElement.id, { binding: e.target.value })}
                        className={styles.propertyInput}
                        style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Label</label>
                      <input
                        value={selectedElement.label || ''}
                        onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                        className={styles.propertyInput}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Formatter</label>
                      <select
                        value={selectedElement.formatter || ''}
                        onChange={(e) => updateElement(selectedElement.id, { formatter: e.target.value || undefined })}
                        className={styles.propertyInput}
                      >
                        <option value="">Tanpa formatter</option>
                        {formatters.map(f => (
                          <option key={f.name} value={f.name}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'divider' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Style</label>
                      <select
                        value={selectedElement.style || 'solid'}
                        onChange={(e) => updateElement(selectedElement.id, { style: e.target.value })}
                        className={styles.propertyInput}
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Tebal</label>
                      <input
                        type="number"
                        value={selectedElement.thickness || 1}
                        onChange={(e) => updateElement(selectedElement.id, { thickness: parseInt(e.target.value) || 1 })}
                        className={styles.propertyInput}
                      />
                    </div>
                  </div>
                )}

                {selectedElement.type === 'spacer' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Tinggi (px)</label>
                      <input
                        type="number"
                        value={selectedElement.height || 20}
                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 20 })}
                        className={styles.propertyInput}
                      />
                    </div>
                  </div>
                )}

                <div className={styles.propertyDivider} />

                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  className={styles.deleteButton}
                >
                  Hapus Elemen
                </button>
              </div>
            ) : (
              <div className={styles.emptyProperties}>
                <p>Pilih elemen untuk mengedit</p>
              </div>
            )}
          </div>
        </div>

        {/* Field Picker Modal */}
        {showFieldPicker && (
          <div className={styles.modal} onClick={() => setShowFieldPicker(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Pilih Field</h2>
              </div>
              <div className={styles.modalBody}>
                {Object.entries(
                  bindings.reduce<Record<string, BindingOption[]>>((acc, binding) => {
                    const cat = binding.category;
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(binding);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <div key={category} className={styles.fieldCategory}>
                    <div className={styles.fieldCategoryTitle}>{category}</div>
                    <div className={styles.fieldList}>
                      {items.map((binding) => (
                        <button
                          key={binding.path}
                          onClick={() => insertBinding(binding.path)}
                          className={styles.fieldItem}
                        >
                          <div className={styles.fieldItemLabel}>{binding.label}</div>
                          <div className={styles.fieldItemPath}>{binding.path}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowFieldPicker(false)}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kop Editor Modal */}
        {showKopEditor && (
          <div className={styles.modal} onClick={() => setShowKopEditor(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Konfigurasi Kop Surat</h2>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.note}>
                  Konfigurasi kop surat akan menggunakan data dari Profil Desa.
                  Edit kop surat melalui menu Pemerintahan &gt; Identitas Desa.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowKopEditor(false)}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signatory Modal */}
        {showSignatory && (
          <div className={styles.modal} onClick={() => setShowSignatory(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Konfigurasi Tanda Tangan</h2>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.note}>
                  Pengaturan penandatangan akan tersedia setelah template dipublikasi.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowSignatory(false)}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className={styles.modal} onClick={() => setShowPreview(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Preview Template</h2>
              </div>
              <div className={styles.modalBody}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{
                    backgroundColor: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    width: '595px',
                    minHeight: '842px',
                    margin: '0 auto',
                    padding: '2rem',
                  }}>
                    <p style={{ textAlign: 'center', fontWeight: 600 }}>
                      Preview akan ditampilkan di sini
                    </p>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowPreview(false)}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
