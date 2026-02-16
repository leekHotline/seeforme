/**
 * Seeker Profile — personal info and accessibility settings.
 */

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AccessibleButton from "@/components/AccessibleButton";
import { useAuth } from "@/lib/auth";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";
import type { AccessibilitySettings } from "@/lib/types";

export default function SeekerProfileScreen() {
  const { user, logout } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [settings, setSettings] = useState<AccessibilitySettings>({
    tts_enabled: true,
    tts_rate: 1.0,
    haptic_enabled: true,
    voice_prompt_level: 2,
  });

  const updateSetting = async (
    key: keyof AccessibilitySettings,
    value: boolean | number
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    trigger("light");
    try {
      await api.patch("/users/me/accessibility", updated);
    } catch {
      announce("保存设置失败");
    }
  };

  const handleLogout = async () => {
    await logout();
    trigger("success");
    announce("已退出登录");
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-4">
        {/* Profile card */}
        <View className="bg-white rounded-2xl p-5 mb-6">
          <Text className="text-accessible-lg font-bold text-gray-900">
            {user?.email || user?.phone || "用户"}
          </Text>
          <Text className="text-accessible-sm text-primary-600 mt-1">
            求助者
          </Text>
        </View>

        {/* Accessibility settings */}
        <Text
          className="text-accessible-base font-bold text-gray-900 mb-3"
          accessibilityRole="header"
        >
          无障碍设置
        </Text>

        <View className="bg-white rounded-2xl p-5 mb-6">
          <View className="flex-row items-center justify-between min-h-touch">
            <Text className="text-accessible-sm text-gray-900">语音播报</Text>
            <Switch
              value={settings.tts_enabled}
              onValueChange={(v) => updateSetting("tts_enabled", v)}
              accessibilityLabel="语音播报开关"
            />
          </View>

          <View className="flex-row items-center justify-between min-h-touch border-t border-gray-100">
            <Text className="text-accessible-sm text-gray-900">触觉反馈</Text>
            <Switch
              value={settings.haptic_enabled}
              onValueChange={(v) => updateSetting("haptic_enabled", v)}
              accessibilityLabel="触觉反馈开关"
            />
          </View>
        </View>

        {/* Logout */}
        <AccessibleButton
          title="退出登录"
          variant="danger"
          announceText="退出登录"
          onPress={handleLogout}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
