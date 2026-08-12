import { create } from 'zustand';
import api from '../services/api';
import { useBookingStore } from './useBookingStore';

function clearStoredAuth() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem('dibaoxa_user');
    storage.removeItem('dibaoxa_token');
  });
}

function loadStoredSession() {
  for (const storage of [localStorage, sessionStorage]) {
    const token = storage.getItem('dibaoxa_token');
    const rawUser = storage.getItem('dibaoxa_user');
    if (!token || !rawUser) {
      storage.removeItem('dibaoxa_user');
      storage.removeItem('dibaoxa_token');
      continue;
    }

    try {
      return { user: JSON.parse(rawUser), token };
    } catch {
      storage.removeItem('dibaoxa_user');
      storage.removeItem('dibaoxa_token');
    }
  }

  return { user: null, token: null };
}

function persistSession(user, token, rememberMe) {
  clearStoredAuth();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('dibaoxa_token', token);
  storage.setItem('dibaoxa_user', JSON.stringify(user));
}

const storedSession = loadStoredSession();

export const useAuthStore = create((set, get) => ({
  user: storedSession.user,
  token: storedSession.token,
  isAuthenticated: !!storedSession.user && !!storedSession.token,
  loading: false,

  login: async (email, password, rememberMe = true) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;

      persistSession(user, token, rememberMe);

      set({ user, token, isAuthenticated: true, loading: false });
      return { success: true, user };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.message };
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', formData);
      const { user, token } = res.data.data;

      persistSession(user, token, true);

      set({ user, token, isAuthenticated: true, loading: false });
      return { success: true, user };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.message };
    }
  },

  logout: () => {
    clearStoredAuth();
    useBookingStore.getState().clearActiveHold();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    if (!get().token) return;
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      const storage = localStorage.getItem('dibaoxa_token') ? localStorage : sessionStorage;
      storage.setItem('dibaoxa_user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      get().logout();
    }
  },

  refreshProfile: async () => {
    if (!get().token) return null;
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      const storage = localStorage.getItem('dibaoxa_token') ? localStorage : sessionStorage;
      storage.setItem('dibaoxa_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return user;
    } catch {
      get().logout();
      return null;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await api.patch('/auth/me', profileData);
      const user = res.data.data;
      const storage = localStorage.getItem('dibaoxa_token') ? localStorage : sessionStorage;
      storage.setItem('dibaoxa_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
}));
