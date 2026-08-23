/**
 * Wilayah Store
 * Menyimpan pemilihan wilayah aktif (Desa) agar persist across sessions
 * dan bisa diakses dari seluruh aplikasi
 */

import { create } from 'zustand';

const STORAGE_KEY = 'mitra_wilayah';

interface StoredWilayah {
  provinsiId: string;
  provinsiNama: string;
  kabupatenId: string;
  kabupatenNama: string;
  kecamatanId: string;
  kecamatanNama: string;
  desaId: string;
  desaNama: string;
}

interface WilayahState {
  // Current active wilayah
  activeWilayah: StoredWilayah | null;

  // Quick access to IDs
  activeDesaId: string | null;

  // Setters
  setWilayah: (wilayah: StoredWilayah) => void;
  clearWilayah: () => void;

  // Initialize from localStorage
  initFromStorage: () => void;
}

// Load initial state from localStorage
const loadStoredWilayah = (): StoredWilayah | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load wilayah from storage:', e);
  }
  return null;
};

export const useWilayahStore = create<WilayahState>((set) => ({
  activeWilayah: loadStoredWilayah(),
  activeDesaId: loadStoredWilayah()?.desaId || null,

  setWilayah: (wilayah: StoredWilayah) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wilayah));
    } catch (e) {
      console.error('Failed to save wilayah to storage:', e);
    }
    set({
      activeWilayah: wilayah,
      activeDesaId: wilayah.desaId,
    });
  },

  clearWilayah: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear wilayah from storage:', e);
    }
    set({
      activeWilayah: null,
      activeDesaId: null,
    });
  },

  initFromStorage: () => {
    const stored = loadStoredWilayah();
    if (stored) {
      set({
        activeWilayah: stored,
        activeDesaId: stored.desaId,
      });
    }
  },
}));

// Initialize on module load
useWilayahStore.getState().initFromStorage();
