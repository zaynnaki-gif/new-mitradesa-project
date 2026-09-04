import { Link } from 'react-router-dom';
import { NavCategory } from '@/lib/constants';
import { usePotensiList } from '@/hooks/usePotensi';
import styles from '../PublicLayout.module.css';

interface PotensiDropdownProps {
  item: NavCategory;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identitas: any;
}

export function PotensiDropdown({ item, identitas }: PotensiDropdownProps) {
  // Fetch up to 2 items with images for Potensi
  const { data: potensi, loading } = usePotensiList({ limit: 2 });

  if (!item.dropdown) return null;
  
  return (
    <div className={styles.megamenuDropdown}>
      <div className={styles.megamenuInner}>
        {/* Column 1: Description + Image Feature */}
        <div className={styles.megamenuDescBox} style={{ flex: '0 0 450px' }}>
          <h3 className={styles.megamenuDescTitle}>Jelajahi Potensi</h3>
          <p className={styles.megamenuDescText} style={{ marginBottom: '24px' }}>
            {item.dropdown.description}
          </p>
          
          {loading ? (
             <div className={styles.loadingSkeleton} style={{ height: '200px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
          ) : potensi && potensi.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {potensi.map(p => (
                <Link key={p.id} to={`/potensi/${p.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--ink-medium)' }}>
                    {p.gambarUrl ? (
                      <img src={p.gambarUrl} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} 
                           onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                           onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--editorial-white)', fontSize: '1rem', margin: 0 }}>
                      {p.nama}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--amber-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {p.kategori}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        
        {/* Column 2: Main Items (distributed) */}
        <div className={styles.megamenuList}>
          {item.dropdown.items.map((subItem, sIdx) => (
            <Link key={sIdx} to={subItem.href} className={styles.megamenuItemLink}>
              <span className={styles.megamenuItemLabel}>{subItem.label}</span>
              {subItem.description && <span className={styles.megamenuItemDesc}>{subItem.description}</span>}
            </Link>
          ))}
        </div>
        
        {/* Column 3: Shortcuts */}
        {item.dropdown.shortcuts && (
          <div className={styles.megamenuShortcutsBox}>
            <h4 className={styles.megamenuShortcutsTitle}>Pintasan</h4>
            <div className={styles.megamenuShortcutsList}>
              {item.dropdown.shortcuts.map((shortcut, scIdx) => (
                <Link key={scIdx} to={shortcut.href} className={styles.megamenuShortcutLink}>
                  {shortcut.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={styles.megamenuFooter}>
        <div className={styles.megamenuFooterInner}>
          <div className={styles.megamenuFooterContact}>
            {identitas?.alamat && <span>{identitas.alamat}</span>}
            {identitas?.telepon && (
              <span>
                <strong>T:</strong> {identitas.telepon}
              </span>
            )}
            {identitas?.email && (
              <span>
                <strong>E:</strong> {identitas.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
