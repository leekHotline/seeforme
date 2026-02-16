/**
 * Accessibility hooks for SeeForMe.
 *
 * useAnnounce — wraps expo-speech for TTS announcements.
 * useHaptic  — wraps expo-haptics for tactile feedback.
 *
 * Both respect user's accessibility settings.
 */

import { useCallback } from "react";
import { Platform } from "react-native";

// Lazy-load native-only modules
let Speech: typeof import("expo-speech") | null = null;
let Haptics: typeof import("expo-haptics") | null = null;

if (Platform.OS !== "web") {
  Speech = require("expo-speech");
  Haptics = require("expo-haptics");
}

// ── useAnnounce ──────────────────────────────────

export interface AnnounceOptions {
  /** Speech rate (0.5 – 2.0). Defaults to 1.0 */
  rate?: number;
  /** Language code. Defaults to "zh-CN" */
  language?: string;
}

/**
 * Speak a text string aloud.
 * Automatically stops any ongoing speech before starting.
 */
export function useAnnounce() {
  const announce = useCallback(
    (text: string, options?: AnnounceOptions) => {
      if (!Speech) return;
      Speech.stop(); // prevent overlap
      Speech.speak(text, {
        rate: options?.rate ?? 1.0,
        language: options?.language ?? "zh-CN",
      });
    },
    []
  );

  const stop = useCallback(() => Speech?.stop(), []);

  return { announce, stop };
}

// ── useHaptic ────────────────────────────────────

export type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * Trigger haptic feedback.
 */
export function useHaptic() {
  const trigger = useCallback((type: HapticType = "light") => {
    if (!Haptics) return;
    switch (type) {
      case "light":
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case "medium":
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case "heavy":
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case "success":
        return Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      case "warning":
        return Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
      case "error":
        return Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
    }
  }, []);

  return { trigger };
}
