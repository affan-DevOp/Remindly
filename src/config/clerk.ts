import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_aGFyZHktaWd1YW5hLTk0MzcuY2xlcmsuYWNjb3VudHMuZGV2JA';

export const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      return await SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};
