/**
 * Accessible button component with haptics, announcements, and micro-interactions.
 */

import React, { useCallback, useState } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type GestureResponderEvent,
} from "react-native";
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
  primary: "bg-cyan-400 active:bg-cyan-300",
  secondary: "bg-slate-200 active:bg-slate-100",
  danger: "bg-red-500 active:bg-red-400",
  ghost: "bg-white/70 active:bg-slate-100 border border-slate-200",
};

const variantTextStyles: Record<
  NonNullable<AccessibleButtonProps["variant"]>,
  string
> = {
  primary: "text-slate-900",
  secondary: "text-slate-950",
  danger: "text-white",
  ghost: "text-slate-700",
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

  return (
    <MotiView
      animate={{
        scale: pressed ? 0.985 : hovered ? 1.02 : 1,
        opacity: isDisabled ? 0.55 : 1,
      }}
      transition={{ type: "timing", duration: 140 }}
    >
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
          <ActivityIndicator color={variant === "secondary" ? "#0f172a" : "#ffffff"} />
        ) : (
          <Text
            className={`text-accessible-base font-semibold ${variantTextStyles[variant]} ${textClassName}`}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </MotiView>
  );
}
