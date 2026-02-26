/**
 * Accessible button component with haptics, announcements, and micro-interactions.
 */

import React, { useCallback, useState } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

import { useAnnounce, useHaptic } from "@/lib/accessibility";

interface AccessibleButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  announceText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<
  NonNullable<AccessibleButtonProps["variant"]>,
  string
> = {
  primary: "",
  secondary: "bg-white/15 active:bg-white/25 border border-white/20",
  danger: "bg-red-500 active:bg-red-400",
  ghost: "bg-white/10 active:bg-white/20 border border-white/15",
};

const variantTextStyles: Record<
  NonNullable<AccessibleButtonProps["variant"]>,
  string
> = {
  primary: "text-white",
  secondary: "text-white",
  danger: "text-white",
  ghost: "text-slate-200",
};

export default function AccessibleButton({
  title,
  announceText,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  textClassName = "",
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...rest
}: AccessibleButtonProps) {
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isDisabled = disabled || loading;

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      trigger("light");
      announce(announceText ?? title);
      onPress?.(event);
    },
    [announce, announceText, onPress, title, trigger]
  );

  const inner = (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      className={`
        min-h-touch min-w-touch items-center justify-center rounded-2xl px-6 py-4
        ${variantStyles[variant]}
        ${className}
      `}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text
          className={`text-accessible-base font-semibold ${variantTextStyles[variant]} ${textClassName}`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );

  return (
    <MotiView
      animate={{
        scale: pressed ? 0.985 : hovered ? 1.02 : 1,
        opacity: isDisabled ? 0.5 : 1,
      }}
      transition={{ type: "timing", duration: 140 }}
      style={styles.wrapper}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={["#06b6d4", "#3b82f6", "#8b5cf6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientWrapper}
        >
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 16, overflow: "hidden" },
  gradientWrapper: { borderRadius: 16 },
});
