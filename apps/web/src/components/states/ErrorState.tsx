import { Button } from '../ui';

/**
 * Error State Component
 * Shows an error message with optional retry action
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  message = 'Gagal memuat data. Silakan coba lagi.',
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: fullPage ? '4rem 1rem' : '2rem',
    textAlign: 'center',
    gap: '1rem',
  };

  const iconStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    color: 'var(--color-error)',
    marginBottom: '0.5rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    maxWidth: '400px',
  };

  return (
    <div role="alert" aria-live="assertive" style={containerStyle}>
      <svg
        style={iconStyle}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <h3 style={titleStyle}>{title}</h3>
      <p style={messageStyle}>{message}</p>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          style={{ marginTop: '0.5rem' }}
        >
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

/**
 * Full Page Error State
 * For critical page-level errors
 */
export function PageErrorState({
  title = 'Terjadi Kesalahan',
  message = 'Mohon maaf, terjadi kesalahan pada sistem. Silakan muat ulang halaman.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
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
      <ErrorState
        title={title}
        message={message}
        onRetry={onRetry}
        fullPage
      />
    </div>
  );
}
