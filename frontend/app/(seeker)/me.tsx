/**
 * Seeker profile and accessibility center.
 */

import React, { useMemo, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

import AccessibleButton from "@/components/AccessibleButton";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AccessibilitySettings } from "@/lib/types";

export default function SeekerProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [settings, setSettings] = useState<AccessibilitySettings>({
    tts_enabled: true,
    tts_rate: 1,
    haptic_enabled: true,
    voice_prompt_level: 2,
  });

  const displayName = useMemo(
    () => user?.email || user?.phone || "求助者",
    [user?.email, user?.phone]
  );

  const updateSetting = async (
    key: keyof AccessibilitySettings,
    value: boolean | number
  ) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    trigger("light");
    try {
      if (isAuthenticated) {
        await api.patch("/users/me/accessibility", next);
      }
      announce("设置已更新");
    } catch {
      announce("保存失败，请稍后重试");
    }
  };

  const handleLogout = async () => {
    await logout();
    trigger("success");
    announce("已退出登录");
  };

  return (
    <GlassBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 px-4 pt-3">
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360 }}
        >
          <GlassCard contentClassName="p-6">
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/25">
                <Text className="text-xl font-semibold text-cyan-100">
                  {(displayName[0] || "S").toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-accessible-lg font-semibold text-white">{displayName}</Text>
                <Text className="mt-1 text-sm text-slate-200">求助者账号 · 已启用实时协助</Text>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 90 }}
        >
          <GlassCard className="mt-3" contentClassName="p-5">
            <Text className="text-accessible-base font-semibold text-white">无障碍偏好</Text>
            <View className="mt-4 gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-accessible-sm text-slate-100">语音播报</Text>
                  <Text className="mt-1 text-xs text-slate-300">自动播报关键状态与回复</Text>
                </View>
                <Switch
                  value={settings.tts_enabled}
                  onValueChange={(value) => updateSetting("tts_enabled", value)}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-accessible-sm text-slate-100">触觉反馈</Text>
                  <Text className="mt-1 text-xs text-slate-300">按钮点击与关键事件震动提醒</Text>
                </View>
                <Switch
                  value={settings.haptic_enabled}
                  onValueChange={(value) => updateSetting("haptic_enabled", value)}
                />
              </View>
            </View>
          </GlassCard>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 420, delay: 130 }}
        >
          <GlassCard className="mt-3" contentClassName="p-5">
            <Text className="text-accessible-base font-semibold text-white">快捷操作</Text>
            <View className="mt-3 gap-2">
              <Pressable
                className="rounded-2xl bg-white/10 px-4 py-3"
                onPress={() => router.push("/(seeker)/hall")}
              >
                <Text className="text-accessible-sm font-medium text-slate-100">查看我的求助</Text>
              </Pressable>
              <Pressable
                className="rounded-2xl bg-white/10 px-4 py-3"
                onPress={() => router.push("/(seeker)/messages")}
              >
                <Text className="text-accessible-sm font-medium text-slate-100">查看消息通知</Text>
              </Pressable>
            </View>
          </GlassCard>
        </MotiView>

        <View className="mt-4">
          <AccessibleButton title="退出登录" variant="danger" onPress={handleLogout} />
        </View>
      </SafeAreaView>
    </GlassBackground>
  );
}

