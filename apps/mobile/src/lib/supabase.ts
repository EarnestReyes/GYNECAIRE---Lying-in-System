
import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing mobile Supabase configuration.");
}

// SecureStore has a per-value size limit on some platforms.
// Chunking avoids exceeding that limit for larger sessions.
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const countString = await SecureStore.getItemAsync(
      `${key}.chunks`
    );

    if (!countString) return null;

    const count = Number(countString);

    if (!Number.isSafeInteger(count) || count < 1 || count > 100) {
      return null;
    }

    const chunks: string[] = [];

    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }

    return chunks.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    const oldCount = Number(
      (await SecureStore.getItemAsync(`${key}.chunks`)) || "0"
    );

    const chunks = value.match(/[\s\S]{1,1800}/g) || [""];

    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
    }

    await SecureStore.setItemAsync(
      `${key}.chunks`,
      String(chunks.length)
    );

    for (let i = chunks.length; i < oldCount; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
  },

  async removeItem(key: string): Promise<void> {
    const count = Number(
      (await SecureStore.getItemAsync(`${key}.chunks`)) || "0"
    );

    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }

    await SecureStore.deleteItemAsync(`${key}.chunks`);
  },
};

const webStorage = {
  getItem: (key: string) => typeof window === 'undefined' ? null : window.localStorage.getItem(key),
  setItem: (key: string, value: string) => { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); },
  removeItem: (key: string) => { if (typeof window !== 'undefined') window.localStorage.removeItem(key); },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
