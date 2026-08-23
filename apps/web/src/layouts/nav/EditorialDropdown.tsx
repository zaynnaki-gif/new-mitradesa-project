import { Link } from 'react-router-dom';
import { NavCategory } from '@/lib/constants';
import styles from '../PublicLayout.module.css';

interface EditorialDropdownProps {
  item: NavCategory;
  identitas: any;
}

export function EditorialDropdown({ item, identitas }: EditorialDropdownProps) {
  if (!item.dropdown) return null;
  
  return (
    <div className={styles.megamenuDropdown}>
      <div className={styles.megamenuInner}>
        {/* Column 1: Description */}
        <div className={styles.megamenuDescBox}>
          <h3 className={styles.megamenuDescTitle}>{item.label}</h3>
          {item.dropdown.description && (
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
