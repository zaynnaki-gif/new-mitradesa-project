import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import styles from './AdminLayout.module.css';

interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    ],
  },
  {
    title: 'Pelayanan',
    items: [
      { label: 'Layanan', href: '/admin/layanan', icon: '📋' },
      { label: 'Permintaan Masuk', href: '/admin/permintaan', icon: '📥' },
      { label: 'Dokumen', href: '/admin/dokumen', icon: '📄' },
    ],
  },
  {
    title: 'Surat',
    items: [
      { label: 'Persetujuan (TTE)', href: '/admin/surat/tte', icon: '📝' },
      { label: 'Jenis Surat', href: '/admin/surat/jenis', icon: '📄' },
      { label: 'Template Surat', href: '/admin/surat/templates', icon: '📋' },
      { label: 'Penandatangan', href: '/admin/surat/penandatangan', icon: '✍️' },
      { label: 'Penomoran Surat', href: '/admin/surat/penomoran', icon: '🔢' },
    ],
  },
  {
    title: 'Konten',
    items: [
      { label: 'Berita', href: '/admin/konten/berita', icon: '📰' },
      { label: 'Halaman', href: '/admin/konten/halaman', icon: '📃' },
      { label: 'Media', href: '/admin/konten/media', icon: '🖼️' },
      { label: 'Kategori', href: '/admin/konten/kategori', icon: '🏷️' },
      { label: 'Agenda', href: '/admin/konten/agenda', icon: '📅' },
      { label: 'UMKM', href: '/admin/konten/umkm', icon: '🏪' },
      { label: 'Potensi Desa', href: '/admin/konten/potensi', icon: '🌾' },
      { label: 'Transparansi', href: '/admin/konten/transparansi', icon: '📊' },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { label: 'Penduduk', href: '/admin/master/penduduk', icon: '👤' },
      { label: 'Keluarga', href: '/admin/master/keluarga', icon: '👨‍👩‍👧‍👦' },
      { label: 'Mutasi Penduduk', href: '/admin/master/mutasi-penduduk', icon: '🔄' },
      { label: 'Lembaga', href: '/admin/master/lembaga', icon: '🏛️' },
      { label: 'Identitas Desa', href: '/admin/master/identitas-desa', icon: '🏘️' },
      { label: 'Perangkat Desa', href: '/admin/master/perangkat-desa', icon: '👥' },
      { label: 'Wilayah', href: '/admin/master/wilayah', icon: '🗺️' },
    ],
  },
  {
    title: 'Kesehatan',
    items: [
      { label: 'Posyandu', href: '/admin/kesehatan/posyandu', icon: '🩺' },
      { label: 'Ibu Hamil', href: '/admin/kesehatan/bumil', icon: '🤰' },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { label: 'Kas Umum', href: '/admin/keuangan/kas-umum', icon: '💰' },
      { label: 'APBDes Entry', href: '/admin/keuangan/apbdes-entry', icon: '📑' },
    ],
  },
  {
    title: 'Pemerintahan',
    items: [
      { label: 'Bansos', href: '/admin/pemerintahan/bansos', icon: '🎁' },
      { label: 'Saran & Aduan', href: '/admin/pemerintahan/saran', icon: '💬' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'User Management', href: '/admin/sistem/user-management', icon: '⚙️' },
      { label: 'Activity Log', href: '/admin/sistem/activity-log', icon: '📜' },
      { label: 'Konfigurasi', href: '/admin/sistem/config', icon: '🔧' },
      { label: 'Export Data', href: '/admin/sistem/export', icon: '📥' },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsUserMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.userMenu}`)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [isUserMenuOpen]);

  const getUserInitials = () => {
    if (!user?.username) return 'A';
    return user.username.substring(0, 2).toUpperCase();
  };

  const formatRole = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'User';
    const roleMap: Record<string, string> = {
      'ADMIN': 'Administrator',
      'DEVELOPER': 'Developer',
      'OPERATOR': 'Operator',
      'SUPERADMIN': 'Super Admin',
    };
    return roleMap[roles[0]] || roles[0];
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      <div
        className={`${styles.overlay} ${isSidebarOpen ? styles.visible : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className={styles.logoText}>{APP_NAME}</span>
          </Link>
        </div>

        <nav className={styles.sidebarNav} aria-label="Admin navigation">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={sectionIndex} className={styles.navSection}>
              {section.title && (
                <div className={styles.navSectionTitle}>{section.title}</div>
              )}
              <ul className={styles.navList}>
                {section.items.map((item) => (
                  <li key={item.href} className={styles.navItem}>
                    <Link
                      to={item.href}
                      className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={styles.navBadge}>{item.badge}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Kembali ke Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.mobileMenuToggle}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
              aria-expanded={isSidebarOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/admin/dashboard" className={styles.breadcrumbLink}>Admin</Link>
              {location.pathname !== '/admin/dashboard' && (
                <>
                  <span className={styles.breadcrumbSeparator}>/</span>
                  <span className={styles.breadcrumbCurrent}>
                    {location.pathname.split('/').pop()?.replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className={styles.topBarRight}>
            {/* User Menu */}
            <div className={styles.userMenu}>
              <button
                className={styles.userButton}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className={styles.userAvatar}>{getUserInitials()}</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.username || 'Admin'}</span>
                  <span className={styles.userRole}>{formatRole(user?.roles || [])}</span>
                </div>
                <svg
                  className={styles.userDropdownIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className={styles.dropdownMenu} role="menu">
                  <div className={styles.dropdownHeader}>
                    <div className={styles.userName}>{user?.username}</div>
                    <div className={styles.userRole}>{user?.email || formatRole(user?.roles || [])}</div>
                  </div>
                  <Link to="/admin/dashboard" className={styles.dropdownItem} role="menuitem">
                    Dashboard
                  </Link>
                  <Link to="/admin/master/identitas-desa" className={styles.dropdownItem} role="menuitem">
                    Profil Saya
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    onClick={logout}
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    role="menuitem"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
