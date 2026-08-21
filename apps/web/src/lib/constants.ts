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

// ============================================
// WESLEY-INSPIRED MEGA MENU NAVIGATION
// ============================================

export interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavCategory {
  label: string;
  href?: string;
  dropdown?: {
    description?: string;
    items: NavDropdownItem[];
    shortcuts?: NavDropdownItem[];
  };
  isUtility?: boolean; // For Dashboard link styling
}

// Simplified top-level navigation inspired by Wesley College
export const MEGA_NAV_STRUCTURE: NavCategory[] = [
  {
    label: 'Beranda',
    href: '/',
  },
  {
    label: 'Tentang Desa',
    href: '/profil',
    dropdown: {
      description: 'Kenali identitas, sejarah, dan struktur pemerintahan desa kami.',
      items: [
        { label: 'Profil Desa', href: '/profil', description: 'Identitas dan visi misi desa' },
        { label: 'Pemerintahan', href: '/pemerintahan', description: 'Struktur organisasi desa' },
        { label: 'Perangkat Desa', href: '/pemerintahan', description: 'Aparatur desa' },
        { label: 'Demografi', href: '/kependudukan', description: 'Data kependudukan' },
      ],
      shortcuts: [
        { label: 'Sejarah Singkat', href: '/profil#sejarah' },
        { label: 'Visi & Misi', href: '/profil#visi-misi' },
      ],
    },
  },
  {
    label: 'Layanan',
    href: '/layanan',
    dropdown: {
      description: 'Layanan administrasi dan permohonan dokumen desa.',
      items: [
        { label: 'Katalog Layanan', href: '/layanan', description: 'Semua layanan desa' },
        { label: 'Tracking Permohonan', href: '/layanan/tracking', description: 'Lacak status permohonan' },
        { label: 'Permohonan Surat', href: '/layanan', description: 'Surat pengantar, keterangan, dll' },
        { label: 'Informasi Layanan', href: '/layanan', description: 'Syarat dan prosedur' },
      ],
      shortcuts: [
        { label: 'Buat Permohonan', href: '/layanan' },
        { label: 'Syarat Dokumen', href: '/layanan#syarat' },
      ],
    },
  },
  {
    label: 'Potensi',
    href: '/potensi',
    dropdown: {
      description: 'Jelajahi potensi dan produk lokal desa.',
      items: [
        { label: 'Potensi Desa', href: '/potensi', description: 'Sumber daya dan potensi' },
        { label: 'UMKM Lokal', href: '/umkm', description: 'Usaha mikro dan kecil' },
        { label: 'Produk Unggulan', href: '/umkm', description: 'Produk khas desa' },
      ],
      shortcuts: [
        { label: 'Peta Potensi', href: '/potensi#peta' },
        { label: 'Daftar UMKM', href: '/umkm#daftar' },
      ],
    },
  },
  {
    label: 'Informasi',
    dropdown: {
      items: [
        { label: 'Berita Desa', href: '/berita', description: 'Berita dan informasi terkini' },
        { label: 'Agenda Kegiatan', href: '/agenda', description: 'Jadwal dan event' },
        { label: 'Galeri Foto', href: '/galeri', description: 'Dokumentasi kegiatan' },
        { label: 'Transparansi APBDes', href: '/transparansi', description: 'Anggaran dan belanja' },
      ],
      shortcuts: [
        { label: 'Pengumuman Terbaru', href: '/berita#pengumuman' },
        { label: 'Laporan Keuangan', href: '/transparansi' },
      ],
    },
  },
  {
    label: 'Kontak',
    href: '/kontak',
  },
];

// Legacy flat navigation for fallback/footer (preserved)
export const PUBLIC_NAV_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Layanan', href: '/layanan' },
  { label: 'Berita', href: '/berita' },
  { label: 'Agenda', href: '/agenda' },
  { label: 'Transparansi', href: '/transparansi' },
  { label: 'Profil', href: '/profil' },
  { label: 'Pemerintahan', href: '/pemerintahan' },
  { label: 'Potensi', href: '/potensi' },
  { label: 'UMKM', href: '/umkm' },
  { label: 'Galeri', href: '/galeri' },
] as const;

// Admin Navigation Links
export const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Wilayah', href: '/admin/master/wilayah' },
  { label: 'Penduduk', href: '/admin/master/penduduk' },
  { label: 'Keluarga', href: '/admin/master/keluarga' },
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
