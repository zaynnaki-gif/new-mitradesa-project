/**
 * MITRADESA Constants
 * Centralized configuration for the frontend
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_URL = `${API_BASE_URL}/api`;

// App Configuration
export const APP_NAME = 'Sistem Desa';
export const APP_TAGLINE = 'Manajemen Informasi dan Administrasi Desa';

// Navigation Links (Public)
export const PUBLIC_NAV_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Layanan', href: '/layanan' },
  { label: 'Berita', href: '/berita' },
  { label: 'Agenda', href: '/agenda' },
  { label: 'Transparansi', href: '/transparansi' },
  { label: 'Profil', href: '/profil' },
  { label: 'Pemerintahan', href: '/pemerintahan' },
  { label: 'Potensi Desa', href: '/potensi' },
  { label: 'UMKM', href: '/umkm' },
  { label: 'Galeri', href: '/galeri' },
] as const;

// Admin Navigation Links
export const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Wilayah', href: '/admin/master/wilayah' },
  { label: 'Identitas Desa', href: '/admin/master/identitas-desa' },
  { label: 'Perangkat Desa', href: '/admin/master/perangkat-desa' },
  { label: 'Layanan', href: '/admin/layanan' },
  { label: 'Permintaan', href: '/admin/permintaan' },
  { label: 'Dokumen', href: '/admin/dokumen' },
  { label: 'Template Surat', href: '/admin/surat/templates' },
] as const;

// Footer Links
export const FOOTER_LINKS = [
  { label: 'Profil', href: '/profil' },
  { label: 'Pemerintahan', href: '/pemerintahan' },
  { label: 'UMKM', href: '/umkm' },
  { label: 'Layanan', href: '/layanan' },
  { label: 'Kontak', href: '/kontak' },
] as const;

// SEO Defaults
export const SEO_DEFAULTS = {
  title: APP_NAME,
  description: 'Sistem Manajemen Informasi dan Administrasi Desa',
  keywords: 'desa, pemerintahan, administratif, informasi',
};
