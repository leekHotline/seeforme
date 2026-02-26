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
        isLight
          ? "border-white/30"
          : "border-white/12"
      } ${className}`}
      style={isLight ? styles.lightCard : styles.darkCard}
    >
      <BlurView
        intensity={isLight ? 60 : 28}
        tint={isLight ? "light" : "dark"}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        className={`${
          isLight ? "bg-white/82" : "bg-slate-900/40"
        } ${contentClassName}`}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lightCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  darkCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
});
