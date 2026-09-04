interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, disabled }: PaginationProps) {
  const pages: (number | 'ellipsis' | 'prev' | 'next')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);

    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('ellipsis');

    pages.push(totalPages);
  }

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '0.25rem',
      marginTop: '1.5rem',
      padding: '1rem 0'
    }}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage <= 1}
        aria-label="Halaman sebelumnya"
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--color-border)',
          background: 'white',
          borderRadius: '0.25rem',
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage <= 1 ? 0.5 : 1,
        }}
      >
        ‹
      </button>

      {pages.map((page, idx) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${idx}`} style={{ padding: '0.5rem 0.5rem', color: 'var(--color-text-secondary)' }}>
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            disabled={disabled}
            aria-label={`Halaman ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              background: page === currentPage ? 'var(--color-primary)' : 'white',
              color: page === currentPage ? 'white' : 'var(--color-text)',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              minWidth: '40px',
              fontWeight: page === currentPage ? 600 : 400,
            }}
          >
            {page}
          </button>
        );
      })}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= totalPages}
        aria-label="Halaman selanjutnya"
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--color-border)',
          background: 'white',
          borderRadius: '0.25rem',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage >= totalPages ? 0.5 : 1,
        }}
      >
        ›
      </button>
    </nav>
  );
}
