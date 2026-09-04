import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { Button, Input, Select } from '@/components/ui';
import { safeFetchJson } from '@/lib/fetch';
import styles from './BlankoBuilderPage.module.css';

// 1mm = 3.7795275591 pixels (approximately). Let's use 3.8 for easy scaling
const MM_TO_PX = 3.8;

type ElementType = 'text' | 'image' | 'line';

interface BlankoElement {
  id: string;
  type: ElementType;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  content: string; // text content or image URL
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export default function BlankoBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blanko, setBlanko] = useState<Record<string, unknown> | null>(null);
  
  const [elements, setElements] = useState<BlankoElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Paper sizes in mm
  const paperSizes = {
    F4: { width: 215, height: 330 },
    A4: { width: 210, height: 297 },
  };

  useEffect(() => {
    const loadBlanko = async () => {
      setLoading(true);
      try {
        const res = await safeFetchJson(`${API_URL}/blanko/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data) throw new Error('Data tidak ditemukan');
        
        setBlanko(res.data);
        if (res.data.layout && Array.isArray(res.data.layout)) {
          setElements(res.data.layout);
        }
      } catch (e) {
        alert((e as Error).message);
        navigate('/admin/surat/blanko');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadBlanko();
  }, [id, token, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await safeFetchJson(`${API_URL}/blanko/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...blanko,
          layout: elements,
        }),
      });
      alert('Desain berhasil disimpan!');
    } catch (e) {
      alert('Gagal menyimpan: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addElement = (type: ElementType) => {
    const newEl: BlankoElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 20,
      y: 20,
      width: type === 'line' ? 100 : 50,
      height: type === 'line' ? 1 : 10,
      content: type === 'text' ? 'Teks Baru' : type === 'image' ? 'https://via.placeholder.com/150' : '',
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left'
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const updateSelected = (key: keyof BlankoElement, value: string | number) => {
    setElements(elements.map(el => el.id === selectedId ? { ...el, [key]: value } : el));
  };

  const removeSelected = () => {
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  // Drag logic
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedId(elId);
    setIsDragging(true);

    const el = elements.find(e => e.id === elId);
    if (!el || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Offset in px
    const startXPx = el.x * MM_TO_PX;
    const startYPx = el.y * MM_TO_PX;

    setDragOffset({
      x: mouseX - startXPx,
      y: mouseY - startYPx
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    const newXPx = mouseX - dragOffset.x;
    const newYPx = mouseY - dragOffset.y;

    // Convert back to mm
    const newX = Math.max(0, Math.round(newXPx / MM_TO_PX));
    const newY = Math.max(0, Math.round(newYPx / MM_TO_PX));

    updateSelected('x', newX);
    updateSelected('y', newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (loading || !blanko) return <AdminLayout><div className="p-4">Memuat...</div></AdminLayout>;

  const sizeMm = paperSizes[blanko.paperSize as keyof typeof paperSizes] || paperSizes.F4;
  const canvasWidthPx = sizeMm.width * MM_TO_PX;
  const canvasHeightPx = sizeMm.height * MM_TO_PX;

  const selectedEl = elements.find(e => e.id === selectedId);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className="text-xl font-bold">Desainer Blanko: {String(blanko.nama)}</h1>
            <p className="text-gray-500 text-sm">Ukuran Kertas: {String(blanko.paperSize)} ({sizeMm.width}x{sizeMm.height} mm)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/surat/blanko')}>Kembali</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Desain'}</Button>
          </div>
        </div>

        <div className={styles.builderContainer}>
          <div 
            className={styles.canvasWrapper}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedId(null)}
          >
            <div 
              className={styles.canvas} 
              ref={canvasRef}
              style={{ width: `${canvasWidthPx}px`, height: `${canvasHeightPx}px` }}
            >
              {elements.map(el => (
                <div
                  key={el.id}
                  className={`${styles.canvasElement} ${selectedId === el.id ? styles.selected : ''}`}
                  style={{
                    left: `${el.x * MM_TO_PX}px`,
                    top: `${el.y * MM_TO_PX}px`,
                    width: `${el.width * MM_TO_PX}px`,
                    height: el.type === 'line' ? `${Math.max(1, el.height * MM_TO_PX)}px` : 'auto',
                    minHeight: el.type === 'line' ? undefined : `${el.height * MM_TO_PX}px`,
                    fontSize: `${(el.fontSize || 12) * MM_TO_PX / 3}px`, // approximate pt to px
                    fontWeight: el.fontWeight || 'normal',
                    textAlign: el.textAlign || 'left',
                    backgroundColor: el.type === 'line' ? '#000' : 'transparent',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                >
                  {el.type === 'text' && (
                    <div style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {el.content}
                    </div>
                  )}
                  {el.type === 'image' && (
                    <img 
                      src={el.content} 
                      alt="Element" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      draggable={false}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className="font-bold text-lg mb-2">Toolbox</div>
            <div className={styles.toolbox}>
              <button className={styles.toolBtn} onClick={() => addElement('text')}>+ Teks</button>
              <button className={styles.toolBtn} onClick={() => addElement('image')}>+ Gambar</button>
              <button className={styles.toolBtn} onClick={() => addElement('line')}>+ Garis</button>
            </div>

            <hr className="my-4 border-gray-200" />

            {selectedEl ? (
              <div className={styles.propertyGroup}>
                <div className="font-bold mb-2">Properti Elemen</div>
                
                <div className={styles.propertyRow}>
                  <div className="flex-1">
                    <label className="text-xs">X (mm)</label>
                    <Input type="number" value={selectedEl.x} onChange={e => updateSelected('x', Number(e.target.value))} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs">Y (mm)</label>
                    <Input type="number" value={selectedEl.y} onChange={e => updateSelected('y', Number(e.target.value))} />
                  </div>
                </div>

                <div className={styles.propertyRow}>
                  <div className="flex-1">
                    <label className="text-xs">Lebar (mm)</label>
                    <Input type="number" value={selectedEl.width} onChange={e => updateSelected('width', Number(e.target.value))} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs">Tinggi (mm)</label>
                    <Input type="number" value={selectedEl.height} onChange={e => updateSelected('height', Number(e.target.value))} />
                  </div>
                </div>

                {selectedEl.type === 'text' && (
                  <>
                    <div className="mt-2">
                      <label className="text-xs">Konten Teks</label>
                      <textarea 
                        className="w-full border rounded p-2 text-sm mt-1" 
                        rows={3} 
                        value={selectedEl.content}
                        onChange={e => updateSelected('content', e.target.value)}
                      />
                    </div>
                    <div className={styles.propertyRow}>
                      <div className="flex-1">
                        <label className="text-xs">Ukuran Font (pt)</label>
                        <Input type="number" value={selectedEl.fontSize} onChange={e => updateSelected('fontSize', Number(e.target.value))} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs">Ketebalan</label>
                        <Select 
                          value={selectedEl.fontWeight} 
                          onChange={e => updateSelected('fontWeight', e.target.value)}
                          options={[{label: 'Normal', value: 'normal'}, {label: 'Bold', value: 'bold'}]}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs">Rata Teks</label>
                      <Select 
                        value={selectedEl.textAlign} 
                        onChange={e => updateSelected('textAlign', e.target.value)}
                        options={[
                          {label: 'Kiri', value: 'left'}, 
                          {label: 'Tengah', value: 'center'},
                          {label: 'Kanan', value: 'right'}
                        ]}
                      />
                    </div>
                  </>
                )}

                {selectedEl.type === 'image' && (
                  <div className="mt-2">
                    <label className="text-xs">URL Gambar</label>
                    <Input value={selectedEl.content} onChange={e => updateSelected('content', e.target.value)} />
                  </div>
                )}

                <Button variant="secondary" style={{ backgroundColor: 'var(--color-error)' }} className="mt-4" onClick={removeSelected}>Hapus Elemen</Button>
              </div>
            ) : (
              <div className="text-gray-500 text-sm text-center py-8">
                Pilih elemen di kanvas untuk mengedit properti
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
