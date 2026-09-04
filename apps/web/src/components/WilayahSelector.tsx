/**
 * WilayahSelector Component
 * Cascading dropdown selector for Provinsi → Kabupaten → Kecamatan → Desa
 *
 * Usage:
 * <WilayahSelector
 *   selectedDesaId={selectedDesaId}
 *   onChange={handleChange}
 *   error={errors.desaId}
 *   persistToStore={true} // Auto-save selection to localStorage (default: true)
 * />
 */

import { useState, useEffect, useCallback } from 'react';
import { useProvinsi } from '@/hooks/useProvinsi';
import { useKabupaten } from '@/hooks/useKabupaten';
import { useKecamatan } from '@/hooks/useKecamatan';
import { useDesa } from '@/hooks/useDesa';
import { useWilayahStore } from '@/stores/wilayah.store';
import { Provinsi, Kabupaten, Kecamatan, Desa } from '@/types';

interface StoredWilayahData {
  provinsiId: string;
  provinsiNama: string;
  kabupatenId: string;
  kabupatenNama: string;
  kecamatanId: string;
  kecamatanNama: string;
  desaId: string;
  desaNama: string;
}

interface WilayahSelectorProps {
  /** Currently selected desa ID */
  selectedDesaId?: number;
  /** Callback when selection changes */
  onChange?: (desaId: number, fullData?: {
    provinsi: Provinsi;
    kabupaten: Kabupaten;
    kecamatan: Kecamatan;
    desa: Desa;
  }) => void;
  /** Error message to display */
  error?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Show loading states */
  showLoading?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Custom label */
  label?: string;
  /** Initial values (provinsiId, kabupatenId, kecamatanId, desaId) */
  initialValues?: {
    provinsiId?: number;
    kabupatenId?: number;
    kecamatanId?: number;
    desaId?: number;
  };
  /** Persist selection to localStorage (default: true) */
  persistToStore?: boolean;
  /** Show selected wilayah summary (read-only mode) */
  showSummaryOnly?: boolean;
}

export function WilayahSelector({
  selectedDesaId,
  onChange,
  error,
  disabled = false,
  showLoading = true,
  required = false,
  label = 'Wilayah',
  initialValues,
  persistToStore = true,
  showSummaryOnly = false,
}: WilayahSelectorProps) {
  const { activeWilayah, setWilayah } = useWilayahStore();

  // Check if we should use stored values (no initialValues provided and has stored data)
  const hasStoredValues = !initialValues && activeWilayah;

  // Selection state - use string for IDs (API returns string)
  // Priority: initialValues > stored > undefined
  const [selectedProvinsiId, setSelectedProvinsiId] = useState<string | undefined>(() => {
    if (initialValues?.provinsiId && initialValues.provinsiId !== 0) return initialValues.provinsiId.toString();
    if (hasStoredValues) return activeWilayah.provinsiId;
    return undefined;
  });
  const [selectedKabupatenId, setSelectedKabupatenId] = useState<string | undefined>(() => {
    if (initialValues?.kabupatenId && initialValues.kabupatenId !== 0) return initialValues.kabupatenId.toString();
    if (hasStoredValues) return activeWilayah.kabupatenId;
    return undefined;
  });
  const [selectedKecamatanId, setSelectedKecamatanId] = useState<string | undefined>(() => {
    if (initialValues?.kecamatanId && initialValues.kecamatanId !== 0) return initialValues.kecamatanId.toString();
    if (hasStoredValues) return activeWilayah.kecamatanId;
    return undefined;
  });
  const [selectedDesaIdState, setSelectedDesaIdState] = useState<string | undefined>(() => {
    if (selectedDesaId !== undefined && selectedDesaId !== 0) return selectedDesaId.toString();
    if (initialValues?.desaId && initialValues.desaId !== 0) return initialValues.desaId.toString();
    if (hasStoredValues) return activeWilayah.desaId;
    return undefined;
  });

  // Full data for callback
  const [fullWilayahData, setFullWilayahData] = useState<{
    provinsi?: Provinsi;
    kabupaten?: Kabupaten;
    kecamatan?: Kecamatan;
    desa?: Desa;
  }>({});

  // Fetch data using TanStack Query - cascading filter
  const { data: provinsiList = [], isLoading: isLoadingProvinsi } = useProvinsi();
  const { data: kabupatenList = [], isLoading: isLoadingKabupaten } = useKabupaten(selectedProvinsiId);
  const { data: kecamatanList = [], isLoading: isLoadingKecamatan } = useKecamatan(selectedKabupatenId);
  const { data: desaList = [], isLoading: isLoadingDesa } = useDesa(selectedKecamatanId);

  // Sync external selectedDesaId prop
  useEffect(() => {
    if (selectedDesaId !== undefined) {
      setSelectedDesaIdState(selectedDesaId === 0 ? undefined : selectedDesaId.toString());
    }
  }, [selectedDesaId]);

  // Find full wilayah data when selectedDesaId changes
  useEffect(() => {
    if (selectedDesaIdState && desaList.length > 0) {
      const selectedDesa = desaList.find(d => d.id === selectedDesaIdState);
      if (selectedDesa && selectedKecamatanId) {
        const selectedKecamatan = kecamatanList.find(k => k.id === selectedKecamatanId);
        if (selectedKecamatan && selectedKabupatenId) {
          const selectedKabupaten = kabupatenList.find(k => k.id === selectedKabupatenId);
          if (selectedKabupaten && selectedProvinsiId) {
            const selectedProvinsi = provinsiList.find(p => p.id === selectedProvinsiId);
            if (selectedProvinsi) {
              const fullData = {
                provinsi: selectedProvinsi,
                kabupaten: selectedKabupaten,
                kecamatan: selectedKecamatan,
                desa: selectedDesa,
              };
              setFullWilayahData(fullData);

              // Persist to localStorage if enabled
              if (persistToStore) {
                const storedData: StoredWilayahData = {
                  provinsiId: selectedProvinsi.id,
                  provinsiNama: selectedProvinsi.nama,
                  kabupatenId: selectedKabupaten.id,
                  kabupatenNama: selectedKabupaten.nama,
                  kecamatanId: selectedKecamatan.id,
                  kecamatanNama: selectedKecamatan.nama,
                  desaId: selectedDesa.id,
                  desaNama: selectedDesa.nama,
                };
                setWilayah(storedData);
              }
            }
          }
        }
      }
    }
  }, [selectedDesaIdState, desaList, selectedKecamatanId, selectedKabupatenId, selectedProvinsiId,
      kecamatanList, kabupatenList, provinsiList, persistToStore, setWilayah]);

  // Handle provinsi change - reset all downstream selections
  const handleProvinsiChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedProvinsiId(value);
    setSelectedKabupatenId(undefined);
    setSelectedKecamatanId(undefined);
    setSelectedDesaIdState(undefined);
    setFullWilayahData({});

    if (onChange && !value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange(0 as any); // Clear selection
    }
  }, [onChange]);

  // Handle kabupaten change - reset downstream selections
  const handleKabupatenChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedKabupatenId(value);
    setSelectedKecamatanId(undefined);
    setSelectedDesaIdState(undefined);
    setFullWilayahData(prev => ({ ...prev, kabupaten: undefined, kecamatan: undefined, desa: undefined }));

    if (onChange && !value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange(0 as any);
    }
  }, [onChange]);

  // Handle kecamatan change - reset desa selection
  const handleKecamatanChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedKecamatanId(value);
    setSelectedDesaIdState(undefined);
    setFullWilayahData(prev => ({ ...prev, kecamatan: undefined, desa: undefined }));

    if (onChange && !value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange(0 as any);
    }
  }, [onChange]);

  // Handle desa change
  const handleDesaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedDesaIdState(value);

    if (onChange && value) {
      const selectedDesa = desaList.find(d => d.id === value);
      const selectedKecamatan = selectedKecamatanId ? kecamatanList.find(k => k.id === selectedKecamatanId) : undefined;
      const selectedKabupaten = selectedKabupatenId ? kabupatenList.find(k => k.id === selectedKabupatenId) : undefined;
      const selectedProvinsi = selectedProvinsiId ? provinsiList.find(p => p.id === selectedProvinsiId) : undefined;

      const fullData = {
        provinsi: selectedProvinsi!,
        kabupaten: selectedKabupaten!,
        kecamatan: selectedKecamatan!,
        desa: selectedDesa!,
      };

      setFullWilayahData(fullData);
      onChange(parseInt(value), fullData);
    } else if (onChange && !value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange(0 as any);
    }
  }, [onChange, desaList, selectedKecamatanId, selectedKabupatenId, selectedProvinsiId,
      kecamatanList, kabupatenList, provinsiList]);

  const isLoading = showLoading;

  // Read-only mode: Show only the summary of selected wilayah
  if (showSummaryOnly && activeWilayah) {
    return (
      <div className="wilayah-selector-summary">
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          {label}
        </label>
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '0.5rem',
          border: '1px solid #e0f2fe',
          fontSize: '0.875rem',
        }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#64748b' }}>Provinsi:</span>{' '}
            <strong>{activeWilayah.provinsiNama}</strong>
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#64748b' }}>Kabupaten:</span>{' '}
            <strong>{activeWilayah.kabupatenNama}</strong>
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#64748b' }}>Kecamatan:</span>{' '}
            <strong>{activeWilayah.kecamatanNama}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Desa:</span>{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{activeWilayah.desaNama}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wilayah-selector">
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>

        {/* Provinsi Select */}
        <div style={{ marginBottom: '0.75rem' }}>
          <select
            value={selectedProvinsiId || ''}
            onChange={handleProvinsiChange}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.25rem',
              backgroundColor: 'white',
              ...(error && { borderColor: 'var(--color-error)' }),
            }}
          >
            <option value="">
              {isLoading && isLoadingProvinsi ? 'Memuat provinsi...' : '-- Pilih Provinsi --'}
            </option>
            {provinsiList.map(prov => (
              <option key={prov.id} value={prov.id}>
                {prov.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Kabupaten Select */}
        <div style={{ marginBottom: '0.75rem' }}>
          <select
            value={selectedKabupatenId || ''}
            onChange={handleKabupatenChange}
            disabled={disabled || !selectedProvinsiId}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.25rem',
              backgroundColor: selectedProvinsiId ? 'white' : '#f5f5f5',
              cursor: selectedProvinsiId ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {isLoading && isLoadingKabupaten
                ? 'Memuat kabupaten...'
                : selectedProvinsiId
                ? '-- Pilih Kabupaten/Kota --'
                : '-- Pilih Provinsi terlebih dahulu --'}
            </option>
            {kabupatenList.map(kab => (
              <option key={kab.id} value={kab.id}>
                {kab.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Kecamatan Select */}
        <div style={{ marginBottom: '0.75rem' }}>
          <select
            value={selectedKecamatanId || ''}
            onChange={handleKecamatanChange}
            disabled={disabled || !selectedKabupatenId}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.25rem',
              backgroundColor: selectedKabupatenId ? 'white' : '#f5f5f5',
              cursor: selectedKabupatenId ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {isLoading && isLoadingKecamatan
                ? 'Memuat kecamatan...'
                : selectedKabupatenId
                ? '-- Pilih Kecamatan --'
                : '-- Pilih Kabupaten/Kota terlebih dahulu --'}
            </option>
            {kecamatanList.map(kec => (
              <option key={kec.id} value={kec.id}>
                {kec.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Desa Select */}
        <div>
          <select
            value={selectedDesaIdState || ''}
            onChange={handleDesaChange}
            disabled={disabled || !selectedKecamatanId}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
              borderRadius: '0.25rem',
              backgroundColor: selectedKecamatanId ? 'white' : '#f5f5f5',
              cursor: selectedKecamatanId ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {isLoading && isLoadingDesa
                ? 'Memuat desa...'
                : selectedKecamatanId
                ? '-- Pilih Desa/Kelurahan --'
                : '-- Pilih Kecamatan terlebih dahulu --'}
            </option>
            {desaList.map(desa => (
              <option key={desa.id} value={desa.id}>
                {desa.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {error}
          </p>
        )}

        {/* Selected Wilayah Summary */}
        {selectedDesaIdState && fullWilayahData.desa && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <strong>Lokasi:</strong> {fullWilayahData.desa.nama}, Kec. {fullWilayahData.kecamatan?.nama},
            {fullWilayahData.kabupaten?.nama}, {fullWilayahData.provinsi?.nama}
          </div>
        )}
      </div>

      <style>{`
        .wilayah-selector select:disabled {
          opacity: 0.7;
        }
        .wilayah-selector-summary strong {
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

