/**
 * Wilayah Store
 * Menyimpan pemilihan wilayah terakhir di UI (hanya cache untuk mempermudah form)
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
  // Current selected wilayah for UI caching
  activeWilayah: StoredWilayah | null;

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

  setWilayah: (wilayah: StoredWilayah) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wilayah));
    } catch (e) {
      console.error('Failed to save wilayah to storage:', e);
    }
    set({
      activeWilayah: wilayah,
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
    });
  },

  initFromStorage: () => {
    const stored = loadStoredWilayah();
    if (stored) {
      set({
        activeWilayah: stored,
      });
    }
  },
}));

// Initialize on module load
useWilayahStore.getState().initFromStorage();
