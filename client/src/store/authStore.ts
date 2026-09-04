import { create } from 'zustand';
import api from '../lib/api';
import { User, UserRole } from '../types';
import { toast } from './toastStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  quickLogin: (role: 'customer' | 'seller' | 'admin') => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const getStoredToken = () => localStorage.getItem('prajnacart_token') || localStorage.getItem('novamart_token');
const getStoredUser = () => {
  try {
    const saved = localStorage.getItem('prajnacart_user') || localStorage.getItem('novamart_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: Boolean(getStoredToken()),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;

      localStorage.setItem('prajnacart_token', token);
      localStorage.setItem('prajnacart_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success(res.data.message || `Welcome back, ${user.firstName}!`);
      return true;
    } catch (err: any) {
      set({ isLoading: false });
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    }
  },

  quickLogin: async (role) => {
    const creds = {
      customer: { email: 'customer@prajnacart.com', pass: 'Customer@123' },
      seller: { email: 'seller@prajnacart.com', pass: 'Seller@123' },
      admin: { email: 'admin@prajnacart.com', pass: 'Admin@123' },
    };

    const target = creds[role];
    return get().login(target.email, target.pass);
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      const { token, user } = res.data.data;

      localStorage.setItem('prajnacart_token', token);
      localStorage.setItem('prajnacart_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success(res.data.message || 'Account created successfully!');
      return true;
    } catch (err: any) {
      set({ isLoading: false });
      toast.error(err.response?.data?.message || 'Registration failed.');
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('prajnacart_token');
    localStorage.removeItem('prajnacart_user');
    localStorage.removeItem('novamart_token');
    localStorage.removeItem('novamart_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    toast.info('Signed out successfully.');
  },

  checkAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      localStorage.setItem('prajnacart_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('prajnacart_token');
      localStorage.removeItem('prajnacart_user');
      localStorage.removeItem('novamart_token');
      localStorage.removeItem('novamart_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  updateUser: (updatedData) => {
    const current = get().user;
    if (current) {
      const newUser = { ...current, ...updatedData };
      localStorage.setItem('prajnacart_user', JSON.stringify(newUser));
      set({ user: newUser });
    }
  },
}));
