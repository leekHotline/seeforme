import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export type TabIconName = "hall" | "create" | "messages" | "profile" | "tasks";

interface AnimatedTabIconProps {
  name: TabIconName;
  focused: boolean;
  pulseSeed?: number;
}

const INACTIVE_COLOR = "#64748B";

const ACTIVE_ICON_COLOR = "#ffffff";

const iconMap: Record<TabIconName, { activeIcon: keyof typeof Ionicons.glyphMap; inactiveIcon: keyof typeof Ionicons.glyphMap }> = {
  hall: { activeIcon: "home", inactiveIcon: "home-outline" },
  create: { activeIcon: "add-circle", inactiveIcon: "add-circle-outline" },
  messages: { activeIcon: "chatbubble-ellipses", inactiveIcon: "chatbubble-ellipses-outline" },
  profile: { activeIcon: "person-circle", inactiveIcon: "person-circle-outline" },
  tasks: { activeIcon: "checkmark-done-circle", inactiveIcon: "checkmark-done-circle-outline" },
};

export default function AnimatedTabIcon({
  name,
  focused,
  pulseSeed,
}: AnimatedTabIconProps) {
  const [pulseKey, setPulseKey] = useState(0);
  const prevPulseSeed = useRef<number | undefined>(pulseSeed);

  useEffect(() => {
    if (focused) {
      setPulseKey((prev) => prev + 1);
    }
  }, [focused]);

  useEffect(() => {
    if (pulseSeed !== prevPulseSeed.current) {
      setPulseKey((prev) => prev + 1);
    }
    prevPulseSeed.current = pulseSeed;
  }, [pulseSeed]);

  const gradientId = useMemo(
    () => `tab-grad-${name}-${Math.random().toString(36).slice(2, 8)}`,
    [name]
  );

  const iconName = focused ? iconMap[name].activeIcon : iconMap[name].inactiveIcon;

  return (
    <View style={styles.wrapper}>
      {pulseKey > 0 ? (
        <>
          <MotiView
            key={`${name}-wave-a-${pulseKey}`}
            from={{ opacity: 0.55, scale: 0.3 }}
            animate={{ opacity: 0, scale: 3.6 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.pulseWavePrimary}
          />
          <MotiView
            key={`${name}-wave-b-${pulseKey}`}
            from={{ opacity: 0.42, scale: 0.25 }}
            animate={{ opacity: 0, scale: 4.2 }}
            transition={{ type: "timing", duration: 700, delay: 100 }}
            style={styles.pulseWaveSecondary}
          />
        </>
      ) : null}

      <MotiView
        animate={{ scale: focused ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        {focused ? (
          <View style={styles.iconContainer}>
            {/* Gradient mask via SVG behind the icon */}
            <Svg width={28} height={28} style={StyleSheet.absoluteFillObject}>
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#06b6d4" />
                  <Stop offset="50%" stopColor="#3b82f6" />
                  <Stop offset="100%" stopColor="#8b5cf6" />
                </LinearGradient>
              </Defs>
              <Rect width="28" height="28" fill={`url(#${gradientId})`} />
            </Svg>
            <Ionicons name={iconName} size={28} color={ACTIVE_ICON_COLOR} style={styles.iconOverlay} />
          </View>
        ) : (
          <Ionicons name={iconName} size={26} color={INACTIVE_COLOR} />
        )}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 4,
  },
  iconOverlay: {
    position: "absolute",
  },
  pulseWavePrimary: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(6,182,212,0.40)",
  },
  pulseWaveSecondary: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.32)",
  },
});
