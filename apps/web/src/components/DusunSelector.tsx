import { Select } from '@/components/ui';
import { useGubug } from '@/hooks/useGubug';
import { useRw } from '@/hooks/useRw';
import { useRt } from '@/hooks/useRt';

export interface DusunSelectorProps {
  selectedGubugId?: string | number | null;
  selectedRwId?: string | number | null;
  selectedRtId?: string | number | null;
  onChange: (
    gubugId?: string,
    rwId?: string,
    rtId?: string,
    names?: { gubug?: string; rw?: string; rt?: string }
  ) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function DusunSelector({
  selectedGubugId,
  selectedRwId,
  selectedRtId,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
}: DusunSelectorProps) {
  // Ensure IDs are numbers for the hooks, but strings for the Select component
  const gubugIdNum = selectedGubugId ? Number(selectedGubugId) : undefined;
  const rwIdNum = selectedRwId ? Number(selectedRwId) : undefined;

  const { data: gubugs, isLoading: isLoadingGubug } = useGubug();
  const { data: rws, isLoading: isLoadingRw } = useRw(gubugIdNum);
  const { data: rts, isLoading: isLoadingRt } = useRt(rwIdNum);

  const handleGubugChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGubugId = e.target.value;
    const gubugName = gubugs?.find((g) => g.id.toString() === newGubugId)?.nama;
    onChange(newGubugId || undefined, undefined, undefined, {
      gubug: gubugName,
      rw: undefined,
      rt: undefined,
    });
  };

  const handleRwChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRwId = e.target.value;
    const gubugName = gubugs?.find((g) => g.id.toString() === String(selectedGubugId))?.nama;
    const rwName = rws?.find((r) => r.id.toString() === newRwId)?.nama;
    onChange(
      selectedGubugId ? String(selectedGubugId) : undefined,
      newRwId || undefined,
      undefined,
      { gubug: gubugName, rw: rwName, rt: undefined }
    );
  };

  const handleRtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRtId = e.target.value;
    const gubugName = gubugs?.find((g) => g.id.toString() === String(selectedGubugId))?.nama;
    const rwName = rws?.find((r) => r.id.toString() === String(selectedRwId))?.nama;
    const rtName = rts?.find((r) => r.id.toString() === newRtId)?.kode; // RT uses kode

    onChange(
      selectedGubugId ? String(selectedGubugId) : undefined,
      selectedRwId ? String(selectedRwId) : undefined,
      newRtId || undefined,
      { gubug: gubugName, rw: rwName, rt: rtName }
    );
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <Select
        label="Dusun / Gubug"
        name="gubugId"
        value={selectedGubugId?.toString() || ''}
        onChange={handleGubugChange}
        disabled={disabled || isLoadingGubug}
        required={required}
        error={error}
        options={[
          { value: '', label: 'Pilih Dusun/Gubug' },
          ...(gubugs?.map((g) => ({
            value: g.id.toString(),
            label: g.nama,
          })) || []),
        ]}
      />

      <Select
        label="RW"
        name="rwId"
        value={selectedRwId?.toString() || ''}
        onChange={handleRwChange}
        disabled={disabled || !selectedGubugId || isLoadingRw}
        required={required && !!selectedGubugId}
        options={[
          { value: '', label: 'Pilih RW' },
          ...(rws?.map((r) => ({
            value: r.id.toString(),
            label: r.nama,
          })) || []),
        ]}
      />

      <Select
        label="RT"
        name="rtId"
        value={selectedRtId?.toString() || ''}
        onChange={handleRtChange}
        disabled={disabled || !selectedRwId || isLoadingRt}
        required={required && !!selectedRwId}
        options={[
          { value: '', label: 'Pilih RT' },
          ...(rts?.map((r) => ({
            value: r.id.toString(),
            label: r.kode,
          })) || []),
        ]}
      />
    </div>
  );
}
