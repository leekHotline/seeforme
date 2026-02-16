/**
 * Accessible text input with label and error display.
 */

import React from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";

interface AccessibleInputProps extends TextInputProps {
  label: string;
  error?: string;
  className?: string;
}

export default function AccessibleInput({
  label,
  error,
  className = "",
  ...rest
}: AccessibleInputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      <Text className="text-accessible-sm font-semibold text-gray-700 mb-1">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={rest.placeholder}
        className={`
          min-h-touch rounded-xl border-2 px-4 py-3 text-accessible-base
          ${error ? "border-error" : "border-gray-300 focus:border-primary-500"}
        `}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
      {error ? (
        <Text
          className="text-error text-sm mt-1"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
