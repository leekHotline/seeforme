/**
 * Cross-platform secure storage adapter.
 *
 * - Native (iOS/Android): uses expo-secure-store
 * - Web: falls back to localStorage
 */

import { Platform } from "react-native";

let SecureStore: typeof import("expo-secure-store") | null = null;

if (Platform.OS !== "web") {
  // Dynamic require so the web bundle never pulls in expo-secure-store
  SecureStore = require("expo-secure-store");
}

/** Retrieve a value by key. Returns `null` if not found. */
export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore!.getItemAsync(key);
}

/** Persist a key-value pair. */
export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore!.setItemAsync(key, value);
}

/** Remove a stored value by key. */
export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore!.deleteItemAsync(key);
}
