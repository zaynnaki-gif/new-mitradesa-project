import { Link } from 'react-router-dom';
import { Button } from '../ui';

/**
 * Empty State Component
 * Shows when there's no data available
 */
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: 'document' | 'search' | 'inbox' | 'folder';
  fullPage?: boolean;
}

const iconPaths = {
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  inbox: (
    <>
      <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  folder: (
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </>
  ),
};

export function EmptyState({
  title = 'Tidak Ada Data',
  message = 'Belum ada data yang tersedia.',
  action,
  icon = 'inbox',
  fullPage = false,
}: EmptyStateProps) {
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
    color: 'var(--color-text-muted)',
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
    <div role="status" aria-live="polite" style={containerStyle}>
      <svg
        style={iconStyle}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        {iconPaths[icon]}
      </svg>

      <h3 style={titleStyle}>{title}</h3>
      <p style={messageStyle}>{message}</p>

      {action && (
        action.href ? (
          <Link to={action.href}>
            <Button variant="outline" style={{ marginTop: '0.5rem' }}>
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            onClick={action.onClick}
            style={{ marginTop: '0.5rem' }}
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

/**
 * Full Page Empty State
 * For page-level empty states
 */
export function PageEmptyState({
  title = 'Halaman Kosong',
  message = 'Tidak ada konten yang tersedia saat ini.',
  action,
  icon = 'folder',
}: {
  title?: string;
  message?: string;
  action?: EmptyStateProps['action'];
  icon?: EmptyStateProps['icon'];
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
      <EmptyState
        title={title}
        message={message}
        action={action}
        icon={icon}
        fullPage
      />
    </div>
  );
}
