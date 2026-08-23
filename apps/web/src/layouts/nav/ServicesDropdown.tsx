import { Link } from 'react-router-dom';
import { NavCategory } from '@/lib/constants';
import { useLayananList } from '@/hooks/useLayanan';
import styles from '../PublicLayout.module.css';

interface ServicesDropdownProps {
  item: NavCategory;
  identitas: any;
}

export function ServicesDropdown({ item, identitas }: ServicesDropdownProps) {
  // Fetch up to 3 services to highlight
  const { data: services, loading } = useLayananList({ limit: 3 });

  if (!item.dropdown) return null;
  
  return (
    <div className={styles.megamenuDropdown}>
      <div className={styles.megamenuInner}>
        {/* Column 1: Featured Services from API */}
        <div className={styles.megamenuDescBox} style={{ flex: '0 0 350px' }}>
          <h3 className={styles.megamenuDescTitle}>Layanan Unggulan</h3>
          
          {loading ? (
            <div className={styles.loadingSkeleton} style={{ height: '100px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
          ) : services && services.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              {services.map(layanan => (
                <Link 
                  key={layanan.id} 
                  to={`/layanan?search=${layanan.slug}`} 
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                >
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--editorial-white)', fontSize: '1.1rem', marginBottom: '4px' }}>
                    {layanan.nama}
                  </span>
                  {layanan.deskripsi && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--stone-400)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {layanan.deskripsi}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
             <p className={styles.megamenuDescText}>{item.dropdown.description}</p>
          )}
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
