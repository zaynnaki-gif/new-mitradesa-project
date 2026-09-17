import { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/ui';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

/**
 * useConfirm — Replaces window.confirm() with a professional dialog.
 *
 * Usage:
 *   const { confirm, ConfirmElement } = useConfirm();
 *   // In JSX: {ConfirmElement}
 *   // In handler:
 *   const ok = await confirm({ message: 'Yakin ingin menghapus?', title: 'Hapus Data' });
 *   if (!ok) return;
 *   // ... proceed with delete
 */
export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  const ConfirmElement = state ? (
    <ConfirmDialog
      isOpen={state.isOpen}
      title={state.options.title}
      message={state.options.message}
      confirmLabel={state.options.confirmLabel}
      cancelLabel={state.options.cancelLabel}
      variant={state.options.variant ?? 'danger'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, ConfirmElement };
}
