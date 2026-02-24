import React from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: "dark" | "light";
}

export default function GlassCard({
  children,
  className = "",
  contentClassName = "",
  tone = "dark",
}: GlassCardProps) {
  const isLight = tone === "light";

  return (
    <View
      className={`overflow-hidden rounded-3xl border ${
        isLight ? "border-slate-200/90" : "border-white/30"
      } ${className}`}
    >
      <BlurView
        intensity={isLight ? 24 : 22}
        tint={isLight ? "light" : "dark"}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        className={`${
          isLight ? "bg-white/88" : "bg-slate-900/45"
        } ${contentClassName}`}
      >
        {children}
      </View>
    </View>
  );
}
