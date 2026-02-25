/**
 * Seeker profile and accessibility center.
 */

import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
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

  const activeFlags = useMemo(
    () => [settings.tts_enabled, settings.haptic_enabled].filter(Boolean).length,
    [settings.haptic_enabled, settings.tts_enabled]
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
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 12, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 280 }}
          >
            <GlassCard
              tone="light"
              className="border-slate-200/80 shadow-sm shadow-cyan-200/40"
              contentClassName="relative overflow-hidden p-6"
            >
              <View
                pointerEvents="none"
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-100/70"
              />

              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
                  <Text className="text-xl font-semibold text-white">
                    {(displayName[0] || "S").toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-accessible-lg font-semibold text-slate-900">{displayName}</Text>
                  <Text className="mt-1 text-sm text-slate-500">实时求助账户 · 无障碍优先</Text>
                </View>
              </View>

              <View className="mt-4 flex-row gap-2">
                <View className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2">
                  <Text className="text-xs text-cyan-700">辅助功能</Text>
                  <Text className="mt-1 text-base font-semibold text-cyan-800">{activeFlags} 项开启</Text>
                </View>
                <View className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Text className="text-xs text-slate-500">当前角色</Text>
                  <Text className="mt-1 text-base font-semibold text-slate-800">求助者</Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 320, delay: 50 }}
          >
            <GlassCard tone="light" className="border-slate-200/80" contentClassName="p-5">
              <Text className="text-accessible-base font-semibold text-slate-900">无障碍设置</Text>

              <View className="mt-4 gap-3">
                <View className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-slate-800">语音播报</Text>
                      <Text className="mt-1 text-xs text-slate-500">自动播报关键状态和回复内容</Text>
                    </View>
                    <Switch
                      value={settings.tts_enabled}
                      onValueChange={(value) => updateSetting("tts_enabled", value)}
                    />
                  </View>
                </View>

                <View className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-slate-800">触觉反馈</Text>
                      <Text className="mt-1 text-xs text-slate-500">按钮点击和关键事件震动提醒</Text>
                    </View>
                    <Switch
                      value={settings.haptic_enabled}
                      onValueChange={(value) => updateSetting("haptic_enabled", value)}
                    />
                  </View>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 340, delay: 90 }}
          >
            <GlassCard tone="light" className="border-slate-200/80" contentClassName="p-5">
              <Text className="text-accessible-base font-semibold text-slate-900">快捷入口</Text>

              <View className="mt-3 gap-2">
                <Pressable
                  className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"
                  onPress={() => router.push("/(seeker)/hall")}
                >
                  <Text className="text-sm font-semibold text-slate-800">我的求助</Text>
                  <Text className="mt-1 text-xs text-slate-500">查看状态、回复和进度</Text>
                </Pressable>

                <Pressable
                  className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3"
                  onPress={() => router.push("/(seeker)/messages")}
                >
                  <Text className="text-sm font-semibold text-slate-800">消息中心</Text>
                  <Text className="mt-1 text-xs text-slate-500">集中查看系统通知和志愿者回复</Text>
                </Pressable>
              </View>
            </GlassCard>
          </MotiView>

          <View className="mt-2">
            <AccessibleButton title="退出登录" variant="danger" onPress={handleLogout} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}
