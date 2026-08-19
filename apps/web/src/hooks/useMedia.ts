/**
 * useMedia Hook
 * Fetches media/gallery items from the API
 */

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/constants';

export interface MediaItem {
  id: string;
  nama: string;
  slug: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  alt: string | null;
  thumbnailUrl?: string;
}

interface MediaResponse {
  success: boolean;
  data: MediaItem[];
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseMediaOptions {
  limit?: number;
  page?: number;
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
}

interface UseMediaResult {
  data: MediaItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  meta?: MediaResponse['meta'];
}

export function useMediaList(options: UseMediaOptions = {}): UseMediaResult {
  const [data, setData] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<MediaResponse['meta']>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(options.limit || 20),
          page: String(options.page || 1),
        });

        if (options.type) {
          params.set('type', options.type);
        }

        const res = await fetch(`${API_URL}/public/galeri?${params}`);

        if (!res.ok) {
          throw new Error('Gagal memuat galeri');
        }

        const result: MediaResponse = await res.json();

        if (result.success) {
          // Filter only images for gallery display
          const media = (result.data || []).filter(
            (item) => item.fileType === 'IMAGE' && item.fileUrl
          );
          setData(media);
          setMeta(result.meta);
        } else {
          setData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [options.limit, options.page, options.type, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return { data, loading, error, refetch, meta };
}
