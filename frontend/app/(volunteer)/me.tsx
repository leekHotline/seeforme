/**
 * Volunteer profile, availability, and performance panel.
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
import { useAuth } from "@/lib/auth";

export default function VolunteerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [isAvailable, setIsAvailable] = useState(true);

  const displayName = useMemo(
    () => user?.email || user?.phone || "志愿者",
    [user?.email, user?.phone]
  );

  const toggleAvailability = (value: boolean) => {
    setIsAvailable(value);
    trigger("medium");
    announce(value ? "已切换为可接单状态" : "已暂停接单");
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
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-300/25">
                <Text className="text-xl font-semibold text-emerald-100">
                  {(displayName[0] || "V").toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-accessible-lg font-semibold text-white">{displayName}</Text>
                <Text className="mt-1 text-sm text-slate-200">志愿者账号 · 实时协助中</Text>
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
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-accessible-base font-semibold text-white">接单状态</Text>
                <Text className="mt-1 text-xs text-slate-300">
                  {isAvailable ? "正在接收新任务" : "暂停接收新任务"}
                </Text>
              </View>
              <Switch value={isAvailable} onValueChange={toggleAvailability} />
            </View>
          </GlassCard>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 420, delay: 130 }}
        >
          <GlassCard className="mt-3" contentClassName="p-5">
            <Text className="text-accessible-base font-semibold text-white">我的贡献</Text>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white/10 p-4">
                <Text className="text-2xl font-semibold text-cyan-100">24</Text>
                <Text className="mt-1 text-xs text-slate-300">累计响应</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white/10 p-4">
                <Text className="text-2xl font-semibold text-emerald-100">21</Text>
                <Text className="mt-1 text-xs text-slate-300">解决问题</Text>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 26 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 440, delay: 160 }}
        >
          <GlassCard className="mt-3" contentClassName="p-5">
            <Text className="text-accessible-base font-semibold text-white">快捷入口</Text>
            <View className="mt-3 gap-2">
              <Pressable
                className="rounded-2xl bg-white/10 px-4 py-3"
                onPress={() => router.push("/(volunteer)/tasks")}
              >
                <Text className="text-accessible-sm font-medium text-slate-100">查看我的任务</Text>
              </Pressable>
              <Pressable
                className="rounded-2xl bg-white/10 px-4 py-3"
                onPress={() => router.push("/(volunteer)/messages")}
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

