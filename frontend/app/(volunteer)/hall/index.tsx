/**
 * Volunteer hall with white theme and rich media card showcase.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import AccessibleButton from "@/components/AccessibleButton";
import FeedbackModal from "@/components/FeedbackModal";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import ShowcaseMediaCard from "@/components/ShowcaseMediaCard";
import StaggerItem from "@/components/StaggerItem";
import StatusBadge from "@/components/StatusBadge";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { demoVolunteerRequests, showcaseCards } from "@/lib/demo-data";
import type { HelpRequest, HelpRequestListResponse } from "@/lib/types";

interface NoticeState {
  visible: boolean;
  title: string;
  message: string;
}

const initialNotice: NoticeState = {
  visible: false,
  title: "",
  message: "",
};

export default function VolunteerHallScreen() {
  const router = useRouter();
  const { isAuthenticated, isGuest } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 180], [0, -42], Extrapolation.CLAMP),
      },
      {
        scale: interpolate(scrollY.value, [0, 180], [1, 0.94], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 180], [1, 0.72], Extrapolation.CLAMP),
  }));

  const isDemo = useMemo(
    () => isGuest || !isAuthenticated,
    [isAuthenticated, isGuest]
  );

  const closeNotice = () => setNotice(initialNotice);

  const showNotice = (title: string, message: string) => {
    setNotice({ visible: true, title, message });
    announce(`${title}。${message}`);
  };

  const load = useCallback(async () => {
    if (isDemo) {
      setRequests(demoVolunteerRequests);
      return;
    }

    try {
      const data = await api.get<HelpRequestListResponse>("/help-requests/hall");
      setRequests(data.items);
      announce(`大厅当前有${data.items.length}条求助`);
    } catch {
      trigger("warning");
      setRequests(demoVolunteerRequests);
      showNotice("已切换演示数据", "网络恢复后可下拉刷新，切回真实大厅列表。");
    }
  }, [announce, isDemo, trigger]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshSeed((prev) => prev + 1);
    setRefreshing(false);
    announce("刷新完成");
  };

  const openDetail = (requestId: string) => {
    router.push(`/(volunteer)/hall/${requestId}`);
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
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              tintColor="#0284C7"
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <Animated.View style={heroStyle}>
            <GlassCard tone="light" contentClassName="p-6">
              <Text className="text-accessible-lg font-semibold text-slate-900">白色主题 · 任务大厅</Text>
              <Text className="mt-2 text-accessible-sm text-slate-600">
                卡片展示支持图文、视频文、音频文三种组合，方便后续扩展素材上传。
              </Text>
            </GlassCard>
          </Animated.View>

          {showcaseCards.map((card, index) => (
            <ShowcaseMediaCard key={`vol-${card.id}`} card={card} index={index + 1} />
          ))}

          {isDemo ? (
            <StaggerItem index={4}>
              <GlassCard tone="light" contentClassName="p-5">
                <Text className="text-accessible-sm font-semibold text-slate-900">游客模式</Text>
                <Text className="mt-2 text-sm text-slate-600">
                  你正在查看演示任务。登录后可以接单、回复并看到真实状态变化。
                </Text>
                <View className="mt-4">
                  <AccessibleButton
                    title="登录并开始接单"
                    onPress={() => router.push("/(public)/login")}
                  />
                </View>
              </GlassCard>
            </StaggerItem>
          ) : null}

          {requests.length === 0 ? (
            <StaggerItem index={5}>
              <GlassCard tone="light" contentClassName="items-center p-8">
                <Text className="text-accessible-base font-semibold text-slate-900">暂时没有待处理请求</Text>
                <Text className="mt-2 text-sm text-slate-600">下拉刷新获取最新任务</Text>
              </GlassCard>
            </StaggerItem>
          ) : (
            requests.map((item, index) => (
              <StaggerItem key={`${item.id}-${refreshSeed}`} index={index + 5}>
                <Pressable onPress={() => openDetail(item.id)} accessibilityRole="button">
                  <GlassCard tone="light" contentClassName="p-5">
                    <View className="mb-3 flex-row items-center justify-between">
                      <StatusBadge status={item.status} />
                      <Text className="text-sm text-slate-500">
                        {new Date(item.created_at).toLocaleString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Text className="text-accessible-sm leading-7 text-slate-700" numberOfLines={3}>
                      {item.transcribed_text || item.raw_text || "语音求助（点击查看）"}
                    </Text>
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {Array.from(
                        new Set(
                          [
                            ...(item.attachments || []).map((media) => media.file_type),
                            ...(item.voice_file_id ? ["voice"] : []),
                          ]
                        )
                      ).map((type) => (
                        <View
                          key={`${item.id}-${type}`}
                          className="rounded-full bg-slate-200 px-3 py-1"
                        >
                          <Text className="text-xs font-semibold text-slate-700">
                            {type === "image"
                              ? "图文"
                              : type === "video"
                                ? "视频"
                                : "语音"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </Pressable>
              </StaggerItem>
            ))
          )}
        </Animated.ScrollView>
      </SafeAreaView>

      <FeedbackModal
        visible={notice.visible}
        title={notice.title}
        message={notice.message}
        tone="info"
        onClose={closeNotice}
        primaryAction={{ label: "继续", onPress: closeNotice }}
      />
    </GlassBackground>
  );
}
