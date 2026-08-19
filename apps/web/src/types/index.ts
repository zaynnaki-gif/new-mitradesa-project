/**
 * MITRADESA Type Definitions
 * TypeScript types aligned with Prisma schema
 */

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

// ============================================
// Geographic Types (Wilayah)
// ============================================

export interface Provinsi {
  id: number;
  kode: string;
  nama: string;
}

export interface Kabupaten {
  id: number;
  kode: string;
  nama: string;
  provinsiId: number;
  provinsi?: Provinsi;
}

export interface Kecamatan {
  id: number;
  kode: string;
  nama: string;
  kabupatenId: number;
  kabupaten?: Kabupaten;
}

export interface Desa {
  id: number;
  kode: string;
  nama: string;
  kecamatanId: number;
  kecamatan?: Kecamatan;
}

// ============================================
// Village Identity (IdentitasDesa)
// ============================================

export interface IdentitasDesa {
  id: number;
  desaId: number;
  namaDesa: string;
  singkatanDesa?: string;
  kodeDesa?: string;
  alamat?: string;
  kodepos?: string;
  telepon?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logoDesaUrl?: string;
  logoKabupatenUrl?: string;
  faviconUrl?: string;
  kepalaDesa?: string;
  sekretarisDesa?: string;
  createdAt: string;
  updatedAt: string;
  desa?: {
    id: number;
    kode: string;
    nama: string;
    kecamatan?: {
      id: number;
      nama: string;
      kode: string;
      kabupaten?: {
        id: number;
        nama: string;
        kode: string;
        provinsi?: {
          id: number;
          nama: string;
          kode: string;
        };
      };
    };
  };
}

// ============================================
// Auth Types
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface CitizenOtpResponse {
  challenge: string;
  message: string;
}

export interface CitizenVerifyResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
}

// ============================================
// Health Check
// ============================================

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
}

// ============================================
// Pagination
// ============================================

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
