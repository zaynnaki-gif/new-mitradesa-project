import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MEGA_NAV_STRUCTURE } from '@/lib/constants';
import styles from '../PublicLayout.module.css';

interface MobileAccordionNavProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identitas: any;
}

export function MobileAccordionNav({ isOpen, onClose, identitas }: MobileAccordionNavProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const location = useLocation();

  if (!isOpen) return null;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  return (
    <div className={styles.mobileNavOverlay} onClick={onClose}>
      <div 
        className={`${styles.mobileNavDrawer} ${isOpen ? styles.open : ''}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className={styles.mobileNavHeader}>
          <div className={styles.headerLogo}>
            <img src="/logo.png" alt="Logo" className={styles.logoImage} />
            <div className={styles.logoTextGroup}>
              <span className={styles.logoTitle}>MITRADESA</span>
              <span className={styles.logoSubtitle}>{identitas?.namaDesa || 'Desa Mandiri'}</span>
            </div>
          </div>
          <button className={styles.closeMenuBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.mobileNavContent}>
          {MEGA_NAV_STRUCTURE.map((category) => (
            <div key={category.label} className={styles.mobileNavItem}>
              {category.dropdown ? (
                <>
                  <button 
                    className={`${styles.mobileAccordionBtn} ${expandedCategory === category.label ? styles.active : ''} ${category.href && location.pathname.startsWith(category.href) ? styles.current : ''}`}
                    onClick={() => toggleCategory(category.label)}
                  >
                    <span>{category.label}</span>
                    <svg 
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ transform: expandedCategory === category.label ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  {expandedCategory === category.label && (
                    <div className={styles.mobileAccordionContent}>
                      <p className={styles.mobileAccordionDesc}>{category.dropdown.description}</p>
                      
                      <div className={styles.mobileSubmenuList}>
                        {category.dropdown.items.map((item, idx) => (
                          <Link 
                            key={idx} 
                            to={item.href} 
                            className={`${styles.mobileSubmenuLink} ${location.pathname === item.href ? styles.active : ''}`}
                            onClick={onClose}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {category.dropdown.shortcuts && (
                        <div className={styles.mobileShortcutsList}>
                          {category.dropdown.shortcuts.map((shortcut, idx) => (
                            <Link 
                              key={idx} 
                              to={shortcut.href} 
                              className={styles.mobileShortcutLink}
                              onClick={onClose}
                            >
                              {shortcut.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Link 
                  to={category.href || '#'} 
                  className={`${styles.mobileNavLink} ${category.href && location.pathname === category.href ? styles.active : ''}`}
                  onClick={onClose}
                >
                  {category.label}
                </Link>
              )}
            </div>
          ))}
          
          <div className={styles.mobileNavFooter}>
            <Link to="/login" className={styles.mobileLoginBtn} onClick={onClose}>
              Masuk Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
