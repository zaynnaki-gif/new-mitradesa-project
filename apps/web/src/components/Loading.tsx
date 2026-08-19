import { CSSProperties } from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function Loading({ size = 'medium', color = 'var(--color-primary)' }: LoadingProps) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const spinnerSize = sizeMap[size];

  const styles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  };

  const spinnerStyles: CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
    border: '3px solid var(--color-border)',
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div style={styles}>
      <div style={spinnerStyles} />
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
