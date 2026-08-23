// hooks/useAuth.ts — standalone auth API helpers

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

export interface CitizenOtpResponse {
  challenge: string;
  message: string;
}

export interface CitizenVerifyResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
}

export const authApi = {
  /**
   * Internal login
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    return data.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.removeItem('token');
  },

  /**
   * Get current user
   */
  getMe: async (): Promise<LoginResponse['user']> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get user');
    }

    return data.data;
  },

  /**
   * Request OTP for citizen
   */
  requestOtp: async (nik: string): Promise<CitizenOtpResponse> => {
    const response = await fetch(`${API_URL}/auth/citizen/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nik }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to request OTP');
    }

    return data.data;
  },

  /**
   * Verify OTP for citizen
   */
  verifyOtp: async (challenge: string, otp: string): Promise<CitizenVerifyResponse> => {
    const response = await fetch(`${API_URL}/auth/citizen/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to verify OTP');
    }

    return data.data;
  },

  /**
   * Citizen logout
   */
  citizenLogout: async (): Promise<void> => {
    const token = localStorage.getItem('citizen_token');
    if (!token) return;

    await fetch(`${API_URL}/auth/citizen/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.removeItem('citizen_token');
  },
};
