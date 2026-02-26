import React from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";

export default function GlassBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View className="flex-1 bg-slate-50">
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <MotiView
          from={{ opacity: 0.2, scale: 0.86 }}
          animate={{ opacity: 0.34, scale: 1.08 }}
          transition={{ type: "timing", duration: 5200, loop: true }}
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-200/70"
        />
        <MotiView
          from={{ opacity: 0.18, scale: 0.9 }}
          animate={{ opacity: 0.3, scale: 1.04 }}
          transition={{ type: "timing", duration: 6400, loop: true }}
          className="absolute right-[-90px] top-40 h-80 w-80 rounded-full bg-rose-100/60"
        />
        <MotiView
          from={{ opacity: 0.12, scale: 0.92 }}
          animate={{ opacity: 0.24, scale: 1.06 }}
          transition={{ type: "timing", duration: 7000, loop: true }}
          className="absolute bottom-[-88px] left-16 h-72 w-72 rounded-full bg-teal-100/65"
        />
      </View>

      <BlurView intensity={32} tint="light" style={StyleSheet.absoluteFillObject} />
      <View className="flex-1 bg-white/72">{children}</View>
    </View>
  );
}
