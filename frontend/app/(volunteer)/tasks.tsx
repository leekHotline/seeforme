/**
 * Volunteer tasks list with guest-safe demo fallback.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";

import AccessibleButton from "@/components/AccessibleButton";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import StaggerItem from "@/components/StaggerItem";
import StatusBadge from "@/components/StatusBadge";
import { useAnnounce } from "@/lib/accessibility";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { demoVolunteerRequests } from "@/lib/demo-data";
import type { HelpRequest, HelpRequestListResponse } from "@/lib/types";

export default function VolunteerTasksScreen() {
  const router = useRouter();
  const { announce } = useAnnounce();
  const { isAuthenticated, isGuest } = useAuth();

  const [tasks, setTasks] = useState<HelpRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [seed, setSeed] = useState(0);

  const isDemo = useMemo(
    () => isGuest || !isAuthenticated,
    [isAuthenticated, isGuest]
  );

  const load = useCallback(async () => {
    if (isDemo) {
      setTasks(demoVolunteerRequests.filter((item) => item.status === "claimed"));
      return;
    }

    try {
      const data = await api.get<HelpRequestListResponse>("/help-requests/hall?status=claimed");
      setTasks(data.items);
    } catch {
      setTasks(demoVolunteerRequests.filter((item) => item.status === "claimed"));
      announce("网络异常，已切换演示任务");
    }
  }, [announce, isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setSeed((prev) => prev + 1);
    setRefreshing(false);
  };

  return (
    <GlassBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1">
        <Animated.ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 28,
            gap: 12,
          }}
          refreshControl={
            <RefreshControl
              tintColor="#67E8F9"
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <GlassCard contentClassName="p-6">
            <Text className="text-accessible-lg font-semibold text-white">我的任务</Text>
            <Text className="mt-2 text-accessible-sm text-slate-200">
              已接单任务会显示在这里。下拉可刷新并重新播放入场动画。
            </Text>
          </GlassCard>

          {isDemo ? (
            <GlassCard contentClassName="p-5">
              <Text className="text-accessible-sm font-semibold text-cyan-100">游客模式</Text>
              <Text className="mt-2 text-sm text-slate-300">演示数据不会写入服务器。</Text>
              <View className="mt-4">
                <AccessibleButton
                  title="登录以管理真实任务"
                  onPress={() => router.push("/(public)/login")}
                />
              </View>
            </GlassCard>
          ) : null}

          {tasks.length === 0 ? (
            <GlassCard contentClassName="items-center p-8">
              <Text className="text-accessible-base font-semibold text-white">暂无已接单任务</Text>
              <Text className="mt-2 text-sm text-slate-300">去大厅接单后会出现在这里</Text>
            </GlassCard>
          ) : (
            tasks.map((item, index) => (
              <StaggerItem key={`${item.id}-${seed}`} index={index + 1}>
                <Pressable onPress={() => router.push(`/(volunteer)/hall/${item.id}`)}>
                  <GlassCard contentClassName="p-5">
                    <View className="mb-3 flex-row items-center justify-between">
                      <StatusBadge status={item.status} />
                      <Text className="text-sm text-slate-300">
                        {new Date(item.created_at).toLocaleString("zh-CN")}
                      </Text>
                    </View>
                    <Text className="text-accessible-sm text-slate-100" numberOfLines={3}>
                      {item.transcribed_text || item.raw_text || "语音求助"}
                    </Text>
                  </GlassCard>
                </Pressable>
              </StaggerItem>
            ))
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}
