import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIdentitasDesa } from '@/hooks/useIdentitasDesa';
import { APP_NAME, PUBLIC_NAV_LINKS } from '@/lib/constants';
import styles from './PublicLayout.module.css';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();
  const { data: identitas } = useIdentitasDesa();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const villageName = identitas?.namaDesa || APP_NAME;
  const menuId = 'mobile-menu';

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle body scroll lock when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header
        className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}
      >
        <div className={styles.headerInner}>
          {/* Logo & Village Name */}
          <Link to="/" className={styles.brand} onClick={closeMobileMenu}>
            {identitas?.logoDesaUrl ? (
              <img
                src={identitas.logoDesaUrl}
                alt={`Logo ${villageName}`}
                className={styles.logo}
              />
            ) : (
              <div className={styles.logoPlaceholder}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
            )}
            <div className={styles.brandText}>
              <span className={styles.appName}>{APP_NAME}</span>
              <div className={styles.villageInfo}>
                <span className={styles.villageName}>{villageName}</span>
                {identitas?.desa?.kecamatan?.nama && (
                  <span className={styles.kecamatanName}>
                    Kec. {identitas.desa.kecamatan.nama}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Main navigation">
            {PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`${styles.navLink} ${location.pathname === link.href ? styles.active : ''}`}
                aria-current={location.pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/layanan" className={styles.navCta}>
              Mulai Layanan
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={styles.menuButton}
            aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls={menuId}
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav
          id={menuId}
          className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}
          aria-label="Mobile navigation"
          aria-hidden={!isMobileMenuOpen}
        >
          <div className={styles.mobileNavInner}>
            {PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`${styles.mobileNavLink} ${location.pathname === link.href ? styles.active : ''}`}
                aria-current={location.pathname === link.href ? 'page' : undefined}
                onClick={closeMobileMenu}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className={styles.main}>{children}</main>

      {/* Footer */}
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
                    <polyline points="9,22 9,12 15,12 15,22" />
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
                {PUBLIC_NAV_LINKS.slice(0, 6).map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
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
              <span className={styles.copyright}>
                {identitas?.desa?.kecamatan?.kabupaten?.provinsi?.nama || 'Indonesia'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
