/**
 * Custom Hooks Index
 * Centralized exports for all custom hooks
 */

// Region/Wilayah
export { useProvinsi } from './useProvinsi';
export { useKabupaten } from './useKabupaten';
export { useKecamatan } from './useKecamatan';
export { useDesa } from './useDesa';
export { useGubug } from './useGubug';
export { useRw } from './useRw';
export { useRt } from './useRt';

// Content Management
export { useBeritaList, useBeritaDetail, useKategori } from './useBerita';
export { useHalaman } from './useHalaman';
export { useAgendaList } from './useAgenda';
export { useMediaList } from './useMedia';
export { useUmkmList, useUmkmDetail } from './useUmkm';
export { usePotensiList, usePotensi } from './usePotensi';
export { useLayananList, useLayananDetail } from './useLayanan';
export { useApbdes } from './useTransparansi';
export { usePerangkatDesa } from './usePerangkatDesa';
export { useIdentitasDesa } from './useIdentitasDesa';

// SEO
export { useSEO } from './useSeo';
export { useStatistikDesa } from './useStatistikDesa';
export { useStructuredData } from './useStructuredData';

// Utilities
export { useScrollReveal } from './useScrollReveal';
export { useHealthCheck } from './useHealthCheck';

// Auth API helpers (not React hooks)
export { authApi } from './useAuth';
