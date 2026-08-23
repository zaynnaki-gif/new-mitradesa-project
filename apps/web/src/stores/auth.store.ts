import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: false,
  loading: true,

  setAuth: (token: string, user: User) => {
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true, loading: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, loading: false });
    window.location.href = '/login';
  },

  hasPermission: (_permission: string) => {
    const { user } = get();
    return user !== null;
  },

  hasRole: (role: string) => {
    const { user } = get();
    return user?.roles.includes(role) ?? false;
  },

  fetchUser: async () => {
    const { token } = get();
    
    if (!token) {
      set({ user: null, isAuthenticated: false, loading: false });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const mappedUser = {
          ...result.data,
          roles: result.data.roles?.map((r: any) => typeof r === 'string' ? r : r.code) || []
        };
        set({ user: mappedUser, isAuthenticated: true });
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          set({ token: null, user: null, isAuthenticated: false });
        } else {
          console.error('Failed to fetch user profile:', response.status);
        }
      }
    } catch (err) {
      console.error('Network error when fetching user:', err);
    } finally {
      set({ loading: false });
    }
  }
}));

// Initialize fetch automatically on load to prevent race conditions
useAuthStore.getState().fetchUser();
