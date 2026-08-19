/**
 * Loading State Component
 * Shows a centered loading spinner with optional message
 */
interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
}

export function LoadingState({
  message = 'Memuat...',
  size = 'medium',
  fullPage = false,
}: LoadingStateProps) {
  const spinnerSizeMap = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const spinnerSize = spinnerSizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: fullPage ? '4rem 1rem' : '2rem',
    gap: '1rem',
  };

  const spinnerStyle: React.CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: size === 'small' ? 'var(--text-sm)' : 'var(--text-base)',
    color: 'var(--color-text-secondary)',
  };

  return (
    <div role="status" aria-live="polite" style={containerStyle}>
      <div style={spinnerStyle} />
      <span style={messageStyle}>{message}</span>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

/**
 * Full Page Loading State
 * For initial page loads
 */
export function PageLoadingState({ message = 'Memuat halaman...' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '4rem 1rem',
      }}
    >
      <LoadingState message={message} size="large" />
    </div>
  );
}
