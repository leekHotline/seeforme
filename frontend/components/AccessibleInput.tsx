/**
 * Accessible text input with label and error display.
 */

import React from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";

interface AccessibleInputProps extends TextInputProps {
  label: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export default function AccessibleInput({
  label,
  error,
  className = "",
  labelClassName = "",
  inputClassName = "",
  ...rest
}: AccessibleInputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      <Text
        className={`text-accessible-sm font-semibold mb-1 ${labelClassName || "text-gray-700"}`}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={rest.placeholder}
        className={`
          min-h-touch rounded-xl border-2 px-4 py-3 text-accessible-base
          ${error ? "border-error" : "border-gray-300 focus:border-cyan-400"}
          ${inputClassName}
        `}
        placeholderTextColor="#94A3B8"
        {...rest}
      />
      {error ? (
        <Text
          className="mt-1 text-sm text-error"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
