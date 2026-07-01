import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });

    // Show strike warning alert for mechanics on login
    if (data.user.role === 'mechanic' && data.strike_count > 0) {
      const count = data.strike_count;
      const remaining = 5 - count;
      const title = count >= 4 ? '🚨 Final Warning' : `⚠️ Strike Warning (${count}/5)`;
      const message =
        count >= 5
          ? 'Your account has been suspended due to 5 low-rated reviews. Please contact support.'
          : count === 4
          ? `You have ${count} strikes. ONE more low-rated review (1–2 stars) will immediately suspend your account.`
          : `You have ${count} of 5 strikes. ${remaining} more low-rated review${remaining !== 1 ? 's' : ''} will suspend your account. Please maintain high service quality.`;
      setTimeout(() => Alert.alert(title, message, [{ text: 'Understood' }]), 800);
    }
  },

  register: async (form) => {
    const { data } = await authApi.register(form);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
