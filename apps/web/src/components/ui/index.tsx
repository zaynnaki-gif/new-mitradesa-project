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
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
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
};

const buttonSizes: Record<string, CSSProperties> = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
  md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  lg: { padding: '1rem 2rem', fontSize: '1.125rem' },
};

export function Button({
  variant = 'primary',
  size = 'md',
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
        opacity: props.disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
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
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'muted';
  children: ReactNode;
}
export function Badge({ color = 'primary', children }: BadgeProps) {
  const colors: Record<string, string> = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    error: 'var(--color-error)',
    success: 'var(--color-success)',
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

