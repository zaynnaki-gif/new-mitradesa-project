import { Link } from 'react-router-dom';
import { NavCategory } from '@/lib/constants';
import { useBeritaList } from '@/hooks/useBerita';
import styles from '../PublicLayout.module.css';

interface InformasiDropdownProps {
  item: NavCategory;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identitas: any;
}

export function InformasiDropdown({ item, identitas }: InformasiDropdownProps) {
  // Fetch up to 3 latest news items
  const { data: berita, loading } = useBeritaList({ limit: 3 });

  if (!item.dropdown) return null;
  
  return (
    <div className={styles.megamenuDropdown}>
      <div className={styles.megamenuInner}>
        {/* Column 1: Description + Latest News */}
        <div className={styles.megamenuDescBox} style={{ flex: '0 0 450px' }}>
          <h3 className={styles.megamenuDescTitle}>Pusat Informasi</h3>
          <p className={styles.megamenuDescText} style={{ marginBottom: '24px' }}>
            {item.dropdown.description}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--editorial-white)', fontSize: '1rem', margin: 0 }}>
              Berita Terbaru
            </h4>
            <Link to="/berita" style={{ fontSize: '0.875rem', color: 'var(--blue-400)', textDecoration: 'none' }}>
              Lihat Semua &rarr;
            </Link>
          </div>
          
          {loading ? (
             <div className={styles.loadingSkeleton} style={{ height: '200px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
          ) : berita && berita.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {berita.map(b => (
                <Link key={b.id} to={`/berita/${b.slug}`} style={{ textDecoration: 'none', display: 'flex', gap: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                >
                  {b.gambarUrl && (
                    <div style={{ width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={b.gambarUrl} alt={b.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--editorial-white)', fontSize: '0.95rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {b.judul}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--stone-400)' }}>
                      {new Date(b.publishedAt || b.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
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
