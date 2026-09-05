const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_URL = rawApiUrl.includes('api.serunimumbul.com')
  ? 'https://indigo-barracuda-105731.hostingersite.com/api'
  : (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
}

export class ApiHttpError extends Error {
  public status: number;
  public code: string;
  public retryAfterSeconds?: number;
  public details?: unknown[];

  constructor(status: number, message: string, code = 'REQUEST_FAILED', retryAfterSeconds?: number, details?: unknown[]) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Attach Idempotency-Key for mutating requests if supplied or automatically
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    } else if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
      // Generate default idempotency key for mutations to safeguard against network drop retries
      headers['Idempotency-Key'] = this.generateIdempotencyKey();
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Permintaan gagal (${response.status})`;
      let errorCode = 'HTTP_ERROR';
      let details: unknown[] | undefined;

      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) errorMessage = errorJson.error.message;
        else if (errorJson.message) errorMessage = errorJson.message;
        if (errorJson.error?.code) errorCode = errorJson.error.code;
        if (errorJson.error?.details) details = errorJson.error.details;
      } catch {
        // Non-JSON response
      }

      // Handle specific HTTP Status Codes
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 30;
        throw new ApiHttpError(
          429,
          errorMessage || `Terlalu banyak permintaan. Silakan coba kembali dalam ${retryAfter} detik.`,
          'RATE_LIMITED',
          retryAfter
        );
      }

      if (response.status === 503 || response.status === 504) {
        throw new ApiHttpError(
          response.status,
          errorMessage || 'Layanan sedang sibuk atau dalam pemeliharaan (draining). Silakan coba sesaat lagi.',
          'SERVICE_UNAVAILABLE'
        );
      }

      throw new ApiHttpError(response.status, errorMessage, errorCode, undefined, details);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);

export default apiClient;
