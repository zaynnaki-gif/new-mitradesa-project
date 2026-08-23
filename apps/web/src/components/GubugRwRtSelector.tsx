/**
 * GubugRwRtSelector Component
 * Cascading dropdown selector for Gubug (Dusun) → RW → RT within a selected desa
 *
 * Usage:
 * <GubugRwRtSelector
 *   selectedDesaId={selectedDesaId}
 *   onChange={handleChange}
 * />
 */

import { useState, useCallback } from 'react';
import { useGubug } from '@/hooks/useGubug';
import { useRw } from '@/hooks/useRw';
import { useRt } from '@/hooks/useRt';

interface GubugRwRtSelectorProps {
  /** Currently selected desa ID */
  selectedDesaId?: number;
  /** Currently selected gubug ID */
  selectedGubugId?: number;
  /** Currently selected RW ID */
  selectedRwId?: number;
  /** Currently selected RT ID */
  selectedRtId?: number;
  /** Callback when selection changes */
  onChange?: (data: {
    gubugId?: number;
    rwId?: number;
    rtId?: number;
    gubug?: { id: number; kode: string; nama: string };
    rw?: { id: number; kode: string; nama: string };
    rt?: { id: number; kode: string };
  }) => void;
  /** Error message for RT field */
  error?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Custom label */
  label?: string;
  /** Show loading states */
  showLoading?: boolean;
}

export function GubugRwRtSelector({
  selectedDesaId,
  selectedGubugId,
  selectedRwId,
  selectedRtId,
  onChange,
  error,
  disabled = false,
  label = 'Wilayah Lokal',
  showLoading = true,
}: GubugRwRtSelectorProps) {
  // Selection state
  const [internalGubugId, setInternalGubugId] = useState<number | undefined>(selectedGubugId);
  const [internalRwId, setInternalRwId] = useState<number | undefined>(selectedRwId);
  const [internalRtId, setInternalRtId] = useState<number | undefined>(selectedRtId);

  // Fetch data using TanStack Query
  const { data: gubugList = [], isLoading: isLoadingGubug } = useGubug(selectedDesaId);
  const { data: rwList = [], isLoading: isLoadingRw } = useRw(internalGubugId);
  const { data: rtList = [], isLoading: isLoadingRt } = useRt(internalRwId);

  // Handle gubug change - reset downstream selections
  const handleGubugChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : undefined;
    setInternalGubugId(value);
    setInternalRwId(undefined);
    setInternalRtId(undefined);

    if (onChange) {
      const selectedGubug = value ? gubugList.find(g => g.id === value) : undefined;
      onChange({
        gubugId: value,
        rwId: undefined,
        rtId: undefined,
        gubug: selectedGubug ? { id: selectedGubug.id, kode: selectedGubug.kode, nama: selectedGubug.nama } : undefined,
        rw: undefined,
        rt: undefined,
      });
    }
  }, [onChange, gubugList]);

  // Handle RW change - reset RT selection
  const handleRwChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : undefined;
    setInternalRwId(value);
    setInternalRtId(undefined);

    if (onChange) {
      const selectedRw = value ? rwList.find(r => r.id === value) : undefined;
      onChange({
        gubugId: internalGubugId,
        rwId: value,
        rtId: undefined,
        gubug: internalGubugId ? gubugList.find(g => g.id === internalGubugId) : undefined,
        rw: selectedRw ? { id: selectedRw.id, kode: selectedRw.kode, nama: selectedRw.nama } : undefined,
        rt: undefined,
      });
    }
  }, [onChange, internalGubugId, gubugList, rwList]);

  // Handle RT change
  const handleRtChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : undefined;
    setInternalRtId(value);

    if (onChange) {
      const selectedRt = value ? rtList.find(r => r.id === value) : undefined;
      onChange({
        gubugId: internalGubugId,
        rwId: internalRwId,
        rtId: value,
        gubug: internalGubugId ? gubugList.find(g => g.id === internalGubugId) : undefined,
        rw: internalRwId ? rwList.find(r => r.id === internalRwId) : undefined,
        rt: selectedRt ? { id: selectedRt.id, kode: selectedRt.kode } : undefined,
      });
    }
  }, [onChange, internalGubugId, internalRwId, gubugList, rwList, rtList]);

  // Sync with props
  if (selectedGubugId !== undefined && selectedGubugId !== internalGubugId) {
    setInternalGubugId(selectedGubugId);
  }
  if (selectedRwId !== undefined && selectedRwId !== internalRwId) {
    setInternalRwId(selectedRwId);
  }
  if (selectedRtId !== undefined && selectedRtId !== internalRtId) {
    setInternalRtId(selectedRtId);
  }

  const isLoading = showLoading;

  // Don't render if no desa is selected
  if (!selectedDesaId) {
    return (
      <div className="gubug-rw-rt-selector">
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          {label}
        </label>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Pilih desa terlebih dahulu untuk memilih wilayah lokal
        </p>
      </div>
    );
  }

  return (
    <div className="gubug-rw-rt-selector">
      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          {label}
        </label>

        {/* Gubug (Dusun) Select */}
        <div style={{ marginBottom: '0.75rem' }}>
          <select
            value={internalGubugId || ''}
            onChange={handleGubugChange}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.25rem',
              backgroundColor: 'white',
            }}
          >
            <option value="">
              {isLoading && isLoadingGubug ? 'Memuat dusun...' : '-- Pilih Gubug/Dusun --'}
            </option>
            {gubugList.map(gubug => (
              <option key={gubug.id} value={gubug.id}>
                {gubug.nama} ({gubug.kode})
              </option>
            ))}
          </select>
        </div>

        {/* RW Select */}
        <div style={{ marginBottom: '0.75rem' }}>
          <select
            value={internalRwId || ''}
            onChange={handleRwChange}
            disabled={disabled || !internalGubugId}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.25rem',
              backgroundColor: internalGubugId ? 'white' : '#f5f5f5',
              cursor: internalGubugId ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {isLoading && isLoadingRw
                ? 'Memuat RW...'
                : internalGubugId
                ? '-- Pilih RW --'
                : '-- Pilih Gubug/Dusun terlebih dahulu --'}
            </option>
            {rwList.map(rw => (
              <option key={rw.id} value={rw.id}>
                RW {rw.kode} - {rw.nama || ''}
              </option>
            ))}
          </select>
        </div>

        {/* RT Select */}
        <div>
          <select
            value={internalRtId || ''}
            onChange={handleRtChange}
            disabled={disabled || !internalRwId}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
              borderRadius: '0.25rem',
              backgroundColor: internalRwId ? 'white' : '#f5f5f5',
              cursor: internalRwId ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {isLoading && isLoadingRt
                ? 'Memuat RT...'
                : internalRwId
                ? '-- Pilih RT --'
                : '-- Pilih RW terlebih dahulu --'}
            </option>
            {rtList.map(rt => (
              <option key={rt.id} value={rt.id}>
                RT {rt.kode}
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
      </div>

      <style>{`
        .gubug-rw-rt-selector select:disabled {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

export default GubugRwRtSelector;
