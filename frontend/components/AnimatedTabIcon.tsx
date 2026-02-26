import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { MotiView } from "moti";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export type TabIconName = "hall" | "create" | "messages" | "profile" | "tasks";

interface AnimatedTabIconProps {
  name: TabIconName;
  focused: boolean;
  pulseSeed?: number;
}

const INACTIVE_COLOR = "#D1D5DB";

function IconShape({
  name,
  base,
  accent,
}: {
  name: TabIconName;
  base: string;
  accent: string;
}) {
  if (name === "hall") {
    return (
      <>
        <Path
          d="M12 3L2.8 10.3C2.5 10.5 2.5 11 2.8 11.3C3 11.6 3.4 11.6 3.7 11.4L4.5 10.8V20.2C4.5 20.6 4.8 21 5.3 21H18.7C19.2 21 19.5 20.6 19.5 20.2V10.8L20.3 11.4C20.6 11.6 21 11.6 21.2 11.3C21.5 11 21.5 10.5 21.2 10.3L12 3Z"
          fill={base}
        />
        <Rect x="10.6" y="15" width="2.8" height="6" rx="1" fill={accent} />
      </>
    );
  }

  if (name === "create") {
    return (
      <>
        <Rect x="3.5" y="3.5" width="17" height="17" rx="5" fill={base} />
        <Rect x="11" y="7" width="2" height="10" rx="1" fill={accent} />
        <Rect x="7" y="11" width="10" height="2" rx="1" fill={accent} />
      </>
    );
  }

  if (name === "messages") {
    return (
      <>
        <Path
          d="M4.4 5.5C4.4 4.95 4.85 4.5 5.4 4.5H18.6C19.15 4.5 19.6 4.95 19.6 5.5V15.4C19.6 15.95 19.15 16.4 18.6 16.4H11.9L7.7 19.4V16.4H5.4C4.85 16.4 4.4 15.95 4.4 15.4V5.5Z"
          fill={base}
        />
        <Rect x="7.2" y="8.7" width="9.6" height="1.6" rx="0.8" fill={accent} />
        <Rect x="7.2" y="11.9" width="6.2" height="1.6" rx="0.8" fill={accent} />
      </>
    );
  }

  if (name === "tasks") {
    return (
      <>
        <Path
          d="M7 4.2H17C18.1 4.2 19 5.1 19 6.2V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6.2C5 5.1 5.9 4.2 7 4.2Z"
          fill={base}
        />
        <Rect x="7.8" y="7.3" width="2.2" height="2.2" rx="0.7" fill={accent} />
        <Rect x="7.8" y="11.2" width="2.2" height="2.2" rx="0.7" fill={accent} />
        <Rect x="7.8" y="15.1" width="2.2" height="2.2" rx="0.7" fill={accent} />
        <Rect x="11.4" y="7.8" width="5.8" height="1.3" rx="0.65" fill={accent} />
        <Rect x="11.4" y="11.7" width="5.8" height="1.3" rx="0.65" fill={accent} />
        <Rect x="11.4" y="15.6" width="5.8" height="1.3" rx="0.65" fill={accent} />
      </>
    );
  }

  return (
    <>
      <Path
        d="M12 4C14.43 4 16.4 5.97 16.4 8.4C16.4 10.83 14.43 12.8 12 12.8C9.57 12.8 7.6 10.83 7.6 8.4C7.6 5.97 9.57 4 12 4Z"
        fill={base}
      />
      <Path
        d="M5.3 19.8C6 16.8 8.7 14.8 12 14.8C15.3 14.8 18 16.8 18.7 19.8C18.8 20.2 18.5 20.6 18 20.6H6C5.5 20.6 5.2 20.2 5.3 19.8Z"
        fill={base}
      />
    </>
  );
}

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
    () => `tab-gradient-${name}-${Math.random().toString(36).slice(2, 8)}`,
    [name]
  );

  const base = focused ? `url(#${gradientId})` : INACTIVE_COLOR;
  const accent = focused ? "#FFFFFF" : "#F8FAFC";

  return (
    <View style={styles.wrapper}>
      {pulseKey > 0 ? (
        <>
          <View pointerEvents="none" style={styles.waveLayer}>
          <MotiView
            key={`${name}-wave-a-${pulseKey}`}
            from={{ opacity: 0.8, scale: 0.25 }}
            animate={{ opacity: 0, scale: 4.6 }}
            transition={{ type: "timing", duration: 720 }}
            style={styles.pulseWavePrimary}
          />
          <MotiView
            key={`${name}-wave-b-${pulseKey}`}
            from={{ opacity: 0.68, scale: 0.22 }}
            animate={{ opacity: 0, scale: 5.2 }}
            transition={{ type: "timing", duration: 800, delay: 120 }}
            style={styles.pulseWaveSecondary}
          />
          </View>
        </>
      ) : null}

      <MotiView
        animate={{ scale: focused ? 1.06 : 1 }}
        transition={{ type: "timing", duration: 170 }}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id={gradientId} x1="2" y1="3" x2="22" y2="21">
              <Stop offset="0%" stopColor="#06B6D4" />
              <Stop offset="58%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#A855F7" />
            </LinearGradient>
          </Defs>
          <IconShape name={name} base={base} accent={accent} />
        </Svg>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
  },
  waveLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 96,
    overflow: "visible",
  },
  pulseWavePrimary: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(2,132,199,0.6)",
    shadowColor: "#0284C7",
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 9,
  },
  pulseWaveSecondary: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.5)",
    shadowColor: "#2563EB",
    shadowOpacity: 0.78,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
});
