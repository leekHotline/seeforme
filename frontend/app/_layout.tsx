/**
 * Root layout — wraps entire app with providers (Auth, NativeWind).
 */

import React from "react";
import { Platform } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/lib/auth";
import "../global.css";

// GestureHandlerRootView is only needed on native
let GestureWrapper: React.ComponentType<{ children: React.ReactNode }>;
if (Platform.OS !== "web") {
  const { GestureHandlerRootView } =
    require("react-native-gesture-handler") as typeof import("react-native-gesture-handler");
  GestureWrapper = ({ children }: { children: React.ReactNode }) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {children}
    </GestureHandlerRootView>
  );
} else {
  GestureWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureWrapper>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Slot />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureWrapper>
  );
}
