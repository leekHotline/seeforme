/**
 * Accessible button component.
 * Meets minimum touch target (64×64), provides haptic + speech feedback.
 */

import React, { useCallback } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { useAnnounce, useHaptic } from "@/lib/accessibility";

interface AccessibleButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  /** Optional announce text (defaults to title) */
  announceText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<string, string> = {
  primary: "bg-primary-600 active:bg-primary-700",
  secondary: "bg-gray-200 active:bg-gray-300",
  danger: "bg-error active:bg-red-600",
  ghost: "bg-transparent active:bg-gray-100",
};

const variantTextStyles: Record<string, string> = {
  primary: "text-white",
  secondary: "text-gray-900",
  danger: "text-white",
  ghost: "text-primary-600",
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
  ...rest
}: AccessibleButtonProps) {
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const handlePress = useCallback(
    (e: any) => {
      trigger("light");
      announce(announceText ?? title);
      onPress?.(e);
    },
    [trigger, announce, announceText, title, onPress]
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      className={`
        min-h-touch min-w-touch items-center justify-center rounded-2xl px-6 py-4
        ${variantStyles[variant]}
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" ? "#111" : "#fff"}
        />
      ) : (
        <Text
          className={`text-accessible-base font-bold ${variantTextStyles[variant]} ${textClassName}`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
