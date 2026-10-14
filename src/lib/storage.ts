import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** SecureStore on the phone; localStorage in the web preview (SecureStore has no web support). */
export const storage = {
  get: async (key: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  remove: async (key: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};
