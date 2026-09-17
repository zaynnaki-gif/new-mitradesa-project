import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui';
import { API_URL } from '@/lib/constants';

interface RecordSelectorProps {
  endpoint: string;
  label: string;
  placeholder?: string;
  value?: string | null;
  onChange: (id: string, record: any) => void;
  renderItem: (item: any) => React.ReactNode;
  getDisplayValue: (item: any) => string;
  searchParam?: string;
  defaultName?: string;
}

export function RecordSelector({
  endpoint,
  label,
  placeholder = "Ketik minimal 3 karakter...",
  value,
  onChange,
  renderItem,
  getDisplayValue,
  searchParam = "search",
  defaultName = ""
}: RecordSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(defaultName);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync searchQuery when value becomes empty (e.g. form reset)
  useEffect(() => {
    if (!value && defaultName === '') {
      setSearchQuery('');
    }
  }, [value, defaultName]);

  useEffect(() => {
    // Click outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }
    
    setIsSearching(true);
    setIsOpen(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}${endpoint}?${searchParam}=${encodeURIComponent(query)}&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
      }
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (item: any) => {
    setSearchQuery(getDisplayValue(item));
    setIsOpen(false);
    onChange(item.id, item);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
      <Input
        label={label}
        value={searchQuery}
        onChange={e => handleSearch(e.target.value)}
        onFocus={() => { if (searchResults.length > 0) setIsOpen(true) }}
        placeholder={placeholder}
      />
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 10,
          marginTop: '4px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {isSearching ? (
            <div style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Mencari...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(res => (
              <div 
                key={res.id} 
                style={{ 
                  padding: '0.75rem', 
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                  background: value === res.id ? 'var(--color-surface-hover)' : 'transparent'
                }}
                onClick={() => handleSelect(res)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = value === res.id ? 'var(--color-surface-hover)' : 'transparent')}
              >
                {renderItem(res)}
              </div>
            ))
          ) : (
            <div style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Tidak ada hasil ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
}
