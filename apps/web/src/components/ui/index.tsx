import { CSSProperties, ReactNode, ButtonHTMLAttributes, useRef, useEffect } from 'react';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption';
  color?: 'primary' | 'secondary' | 'error' | 'success';
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const variantStyles: Record<string, CSSProperties> = {
  h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  body1: { fontSize: '1rem', lineHeight: 1.6 },
  body2: { fontSize: '0.875rem', lineHeight: 1.6 },
  caption: { fontSize: '0.75rem', lineHeight: 1.4 },
};

const colorStyles: Record<string, CSSProperties> = {
  primary: { color: 'var(--color-primary)' },
  secondary: { color: 'var(--color-text-secondary)' },
  error: { color: 'var(--color-error)' },
  success: { color: 'var(--color-success)' },
};

export function Typography({
  variant = 'body1',
  color,
  children,
  style,
  className,
}: TypographyProps) {
  const tag = variant.startsWith('h') ? variant : 'p';
  const Component = tag as keyof JSX.IntrinsicElements;

  return (
    <Component
      className={className}
      style={{
        ...variantStyles[variant],
        ...(color && colorStyles[color]),
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

interface ContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  style?: CSSProperties;
  className?: string;
}

const maxWidthMap = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function Container({
  children,
  maxWidth = 'lg',
  style,
  className,
}: ContainerProps) {
  return (
    <div
      className={className}
      style={{
        maxWidth: maxWidthMap[maxWidth],
        margin: '0 auto',
        padding: '0 1rem',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const buttonVariants: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--color-secondary)',
    color: 'white',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
  },
  danger: {
    backgroundColor: 'var(--color-error, #ef4444)',
    color: 'white',
    border: 'none',
  },
};

const buttonSizes: Record<string, CSSProperties> = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
  md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  lg: { padding: '1rem 2rem', fontSize: '1.125rem' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        borderRadius: '0.375rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        ...buttonVariants[variant],
        ...buttonSizes[size],
        opacity: (props.disabled || loading) ? 0.6 : 1,
        ...style,
      }}
    >
      {loading ? 'Memuat...' : children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stub components (to be implemented)
// ---------------------------------------------------------------------------

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({ label, error, ...props }: InputProps) {
  return (
    <div>
      {label && <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          borderRadius: '0.25rem',
          ...props.style,
        }}
      />
      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: { value: string | number; label: string }[];
  error?: string;
  loading?: boolean;
  placeholder?: string;
}
export function Select({ label, options = [], error, loading, placeholder, ...props }: SelectProps) {
  return (
    <div>
      {label && <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>}
      <select
        {...props}
        disabled={props.disabled || loading}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          borderRadius: '0.25rem',
          backgroundColor: props.disabled || loading ? '#f5f5f5' : 'white',
          cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
          ...props.style,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        {props.children}
      </select>
      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isInitialOpen = useRef(true);

  // Focus management - only focus on first open, not every re-render
  useEffect(() => {
    if (!isOpen) {
      isInitialOpen.current = true;
      return;
    }

    // Only auto-focus on first open, not subsequent re-renders
    if (!isInitialOpen.current) return;
    isInitialOpen.current = false;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the modal
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      // Small delay to ensure input is rendered
      requestAnimationFrame(() => {
        focusableElements[0]?.focus();
      });
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Handle Escape key and focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          minWidth: 300,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          outline: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="document"
      >
        {title && <h3 id="modal-title" style={{ marginTop: 0 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

interface BadgeProps {
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'muted' | 'warning' | 'neutral' | 'danger';
  children: ReactNode;
}
export function Badge({ color = 'primary', children }: BadgeProps) {
  const colors: Record<string, string> = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    error: 'var(--color-error)',
    danger: 'var(--color-error, #ef4444)',
    success: 'var(--color-success)',
    warning: '#f59e0b',
    neutral: '#999',
    muted: '#999',
  };
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem',
      borderRadius: '9999px', fontSize: '0.75rem', color: 'white',
      backgroundColor: colors[color] ?? colors.primary,
    }}>
      {children}
    </span>
  );
}

export function Card({ children, style }: { children: ReactNode, style?: CSSProperties }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      ...style
    }}>
      {children}
    </div>
  );
}

// ============================================================
// ConfirmDialog — replaces all window.confirm() usages
// Usage: <ConfirmDialog isOpen={...} onConfirm={...} onCancel={...} title="..." message="..." variant="danger" />
// ============================================================
interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantColor: Record<string, string> = {
    danger: 'var(--color-error, #ef4444)',
    warning: '#f59e0b',
    default: 'var(--color-primary, #2563eb)',
  };

  const iconMap: Record<string, string> = {
    danger: '🗑️',
    warning: '⚠️',
    default: 'ℹ️',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
      }}
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        style={{
          background: 'white', borderRadius: '0.75rem', padding: '2rem',
          maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>{iconMap[variant]}</span>
          <div>
            {title && (
              <h3 id="confirm-title" style={{ margin: '0 0 0.375rem', fontSize: '1.1rem', fontWeight: 600, color: '#111' }}>
                {title}
              </h3>
            )}
            <p id="confirm-message" style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #d1d5db',
              background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none',
              background: variantColor[variant], color: 'white', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SkeletonLoader — consistent shimmer-effect skeleton rows
// Usage: <SkeletonLoader rows={5} />  or  <SkeletonLoader type="card" count={4} />
// ============================================================
interface SkeletonLoaderProps {
  rows?: number;
  type?: 'table' | 'card' | 'list';
  count?: number;
}

export function SkeletonLoader({ rows = 5, type = 'table', count }: SkeletonLoaderProps) {
  const shimmer: CSSProperties = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
    borderRadius: '0.25rem',
  };

  const n = count ?? rows;

  if (type === 'card') {
    return (
      <>
        <style>{`@keyframes skeletonShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: n }).map((_, i) => (
            <div key={i} style={{ borderRadius: '0.75rem', overflow: 'hidden', background: '#f9fafb', padding: '1.25rem' }}>
              <div style={{ ...shimmer, height: 40, width: 40, borderRadius: '50%', marginBottom: '1rem' }} />
              <div style={{ ...shimmer, height: 14, width: '60%', marginBottom: '0.5rem' }} />
              <div style={{ ...shimmer, height: 20, width: '40%' }} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (type === 'list') {
    return (
      <>
        <style>{`@keyframes skeletonShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: n }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ ...shimmer, height: 40, width: 40, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...shimmer, height: 14, width: '50%', marginBottom: '0.5rem' }} />
                <div style={{ ...shimmer, height: 12, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Default: table rows
  return (
    <>
      <style>{`@keyframes skeletonShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: '1rem', padding: '0.75rem 0' }}>
            <div style={{ ...shimmer, height: 14 }} />
            <div style={{ ...shimmer, height: 14, width: '80%' }} />
            <div style={{ ...shimmer, height: 14, width: '60%' }} />
            <div style={{ ...shimmer, height: 20, borderRadius: '9999px', width: 60 }} />
            <div style={{ ...shimmer, height: 14, width: '50%' }} />
          </div>
        ))}
      </div>
    </>
  );
}

