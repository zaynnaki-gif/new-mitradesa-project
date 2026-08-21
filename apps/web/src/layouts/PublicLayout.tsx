import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { useAuthStore } from '@/stores/auth.store';
import { APP_NAME, MEGA_NAV_STRUCTURE } from '@/lib/constants';
import styles from './PublicLayout.module.css';
import { EditorialDropdown } from './nav/EditorialDropdown';
import { ServicesDropdown } from './nav/ServicesDropdown';
import { PotensiDropdown } from './nav/PotensiDropdown';
import { InformasiDropdown } from './nav/InformasiDropdown';
import { MobileAccordionNav } from './nav/MobileAccordionNav';

interface publicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: publicLayoutProps) {
  const location = useLocation();
  const { data: identitas } = useIdentitasDesa();
  const { user, isAuthenticated } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const villageName = identitas?.namaDesa || APP_NAME;

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle body scroll lock when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Helper to split MEGA_NAV_STRUCTURE into columns for the Wesley layout
  // Column 1: Tentang Desa (index 1)
  // Column 2: Layanan (index 2)
  // Column 3: Potensi (index 3)
  // Right Column 1: Informasi (index 4)
  // Right Column 2: Utilities (Beranda, Kontak, Dashboard, Mulai Layanan)
  // Column 2: Layanan (index 2)
  // Column 3: Potensi (index 3)
  // Right Column 1: Informasi (index 4)
  // Right Column 2: Utilities (Beranda, Kontak, Dashboard, Mulai Layanan)

  return (
    <div className={styles.layout}>
      {/* Dimmed Background when a dropdown is active */}
      <div 
        className={`${styles.dimmerOverlay} ${activeDropdown !== null ? styles.dimmerActive : ''}`}
        aria-hidden="true"
      ></div>

      {/* Header */}
      <header 
        className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''} ${activeDropdown !== null || isMenuOpen ? styles.headerOpen : ''}`} 
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <div className={styles.headerInner}>
          {/* Logo */}
          <Link to="/" className={styles.brand}>
            {identitas?.logoDesaUrl ? (
              <img
                src={identitas.logoDesaUrl}
                alt={`Logo ${villageName}`}
                className={styles.logo}
              />
            ) : (
              <div className={styles.logoPlaceholder}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            )}
          </Link>

          {/* Desktop Navigation (Wesley Megamenu Style) */}
          <nav className={styles.desktopNav}>
            {MEGA_NAV_STRUCTURE.map((item, idx) => (
              <div 
                key={idx} 
                className={styles.desktopNavItem}
                onMouseEnter={() => item.dropdown && setActiveDropdown(idx)}
              >
                <Link to={item.href || '#'} className={`${styles.desktopNavLink} ${activeDropdown === idx ? styles.active : ''}`}>
                  {item.label}
                  {item.dropdown && (
                    <svg className={styles.dropdownIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </Link>
                
                {/* Megamenu Dropdown panel */}
                {item.dropdown && activeDropdown === idx && (
                  <>
                    {item.dropdown.variant === 'editorial' && <EditorialDropdown item={item} identitas={identitas} />}
                    {item.dropdown.variant === 'services' && <ServicesDropdown item={item} identitas={identitas} />}
                    {item.dropdown.variant === 'potensi' && <PotensiDropdown item={item} identitas={identitas} />}
                    {item.dropdown.variant === 'informasi' && <InformasiDropdown item={item} identitas={identitas} />}
                    {/* Fallback to editorial if no variant matches (or handle differently) */}
                    {!item.dropdown.variant && <EditorialDropdown item={item} identitas={identitas} />}
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions: Notifications, Login, Mobile Menu */}
          <div className={styles.headerRight}>
            <button className={styles.iconButton} aria-label="Notifikasi">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            
            {isAuthenticated && user && (
              <div className={styles.avatar} title={user.username}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            
            {!isAuthenticated ? (
              <Link to="/login" className={styles.loginButton}>
                Login
              </Link>
            ) : (
              <Link to="/admin/dashboard" className={styles.loginButton}>
                Dashboard
              </Link>
            )}

            {/* Mobile Menu Button */}
            <div className={styles.headerActions}>
              <button
                className={styles.menuButton}
                aria-label="Buka Menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen(true)}
              >
                MENU
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Accordion Menu */}
      <MobileAccordionNav 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        identitas={identitas} 
      />

      {/* Main Content */}
      <main className={styles.main}>{children}</main>

      {/* Regular Footer (Unchanged) */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          {/* Footer Top */}
          <div className={styles.footerTop}>
            {/* Brand Info */}
            <div className={styles.footerBrand}>
              <div className={styles.footerBrandLogo}>
                {identitas?.logoDesaUrl ? (
                  <img
                    src={identitas.logoDesaUrl}
                    alt={`Logo ${villageName}`}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 40, height: 40, color: 'var(--amber-400)' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )}
                <span className={styles.footerBrandName}>{villageName}</span>
              </div>
              <p className={styles.footerBrandTagline}>
                {APP_NAME} - Portal Informasi dan Pelayanan Desa
              </p>
              {identitas?.alamat && (
                <address className={styles.footerAddress}>
                  {identitas.alamat}
                </address>
              )}
            </div>

            {/* Quick Links */}
            <div className={styles.footerLinks}>
              <h4 className={styles.footerHeading}>Navigasi</h4>
              <ul className={styles.footerNav}>
                <li><Link to="/" className={styles.footerLink}>Beranda</Link></li>
                <li><Link to="/profil" className={styles.footerLink}>Profil</Link></li>
                <li><Link to="/layanan" className={styles.footerLink}>Layanan</Link></li>
                <li><Link to="/berita" className={styles.footerLink}>Berita</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className={styles.footerContact}>
              <h4 className={styles.footerHeading}>Kontak</h4>
              <ul className={styles.footerContactList}>
                {identitas?.telepon && (
                  <li>
                    <span className={styles.footerContactLabel}>Telepon</span>
                    <a href={`tel:${identitas.telepon}`}>{identitas.telepon}</a>
                  </li>
                )}
                {identitas?.whatsapp && (
                  <li>
                    <span className={styles.footerContactLabel}>WhatsApp</span>
                    <a
                      href={`https://wa.me/${identitas.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {identitas.whatsapp}
                    </a>
                  </li>
                )}
                {identitas?.email && (
                  <li>
                    <span className={styles.footerContactLabel}>Email</span>
                    <a href={`mailto:${identitas.email}`}>{identitas.email}</a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className={styles.footerBottom}>
            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} {APP_NAME} - {villageName}.
              Hak Cipta Dilindungi.
            </p>
            <div className={styles.footerMeta}>
              <span>
                {identitas?.desa?.kecamatan?.kabupaten?.provinsi?.nama || 'Indonesia'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
