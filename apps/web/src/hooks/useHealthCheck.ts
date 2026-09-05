import { useQuery } from '@tanstack/react-query';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_URL = rawApiUrl.includes('api.serunimumbul.com')
  ? 'https://indigo-barracuda-105731.hostingersite.com/api'
  : (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`);

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
}

export function useHealthCheck() {
  return useQuery<HealthCheckResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) {
        throw new Error('Failed to fetch health check');
      }
      const result = await response.json();
      return result.data;
    },
    retry: 1,
    staleTime: 30000,
  });
}
