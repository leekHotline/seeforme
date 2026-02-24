import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { MotiView } from "moti";

import AccessibleButton from "@/components/AccessibleButton";
import GlassCard from "@/components/GlassCard";

type FeedbackTone = "error" | "success" | "info";

interface FeedbackModalAction {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

interface FeedbackModalProps {
  visible: boolean;
  title: string;
  message: string;
  tone?: FeedbackTone;
  onClose: () => void;
  primaryAction?: FeedbackModalAction;
  secondaryAction?: FeedbackModalAction;
}

const toneStyles: Record<FeedbackTone, { badge: string; icon: string }> = {
  error: { badge: "bg-red-400/30", icon: "!" },
  success: { badge: "bg-emerald-400/30", icon: "✓" },
  info: { badge: "bg-cyan-400/30", icon: "i" },
};

export default function FeedbackModal({
  visible,
  title,
  message,
  tone = "info",
  onClose,
  primaryAction,
  secondaryAction,
}: FeedbackModalProps) {
  const meta = toneStyles[tone];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-slate-950/70 px-6">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: 18 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 260 }}
          className="w-full max-w-[440px]"
        >
          <GlassCard contentClassName="p-6">
            <View className={`mb-4 h-12 w-12 items-center justify-center rounded-full ${meta.badge}`}>
              <Text className="text-2xl font-semibold text-white">{meta.icon}</Text>
            </View>

            <Text className="text-accessible-lg font-semibold text-white">{title}</Text>
            <Text className="mt-2 text-accessible-sm text-slate-200">{message}</Text>

            <View className="mt-6 gap-3">
              {primaryAction ? (
                <AccessibleButton
                  title={primaryAction.label}
                  variant={primaryAction.variant ?? "primary"}
                  onPress={primaryAction.onPress}
                />
              ) : null}
              {secondaryAction ? (
                <AccessibleButton
                  title={secondaryAction.label}
                  variant={secondaryAction.variant ?? "ghost"}
                  onPress={secondaryAction.onPress}
                />
              ) : null}
            </View>
          </GlassCard>
        </MotiView>
      </View>
    </Modal>
  );
}
