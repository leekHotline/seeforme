import React from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

export default function GlassBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#020617", "#0f172a", "#1e1b4b"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <MotiView
          from={{ opacity: 0.28, scale: 0.82 }}
          animate={{ opacity: 0.52, scale: 1.14 }}
          transition={{ type: "timing", duration: 5800, loop: true }}
          style={styles.orbCyan}
        />
        <MotiView
          from={{ opacity: 0.22, scale: 0.88 }}
          animate={{ opacity: 0.42, scale: 1.10 }}
          transition={{ type: "timing", duration: 7200, loop: true }}
          style={styles.orbViolet}
        />
        <MotiView
          from={{ opacity: 0.18, scale: 0.90 }}
          animate={{ opacity: 0.36, scale: 1.08 }}
          transition={{ type: "timing", duration: 6600, loop: true }}
          style={styles.orbBlue}
        />
      </View>

      <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
  content: { flex: 1 },
  orbCyan: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(6,182,212,0.22)",
    top: -80,
    left: -80,
  },
  orbViolet: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.18)",
    top: 200,
    right: -100,
  },
  orbBlue: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.20)",
    bottom: -60,
    left: 40,
  },
});
