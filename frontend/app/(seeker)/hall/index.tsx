/**
 * Seeker hall with white theme and rich media card showcase.
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
import AttachmentAudioPlayer from "@/components/AttachmentAudioPlayer";
import FeedbackModal from "@/components/FeedbackModal";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import SecureImage from "@/components/SecureImage";
import ShowcaseMediaCard from "@/components/ShowcaseMediaCard";
import StaggerItem from "@/components/StaggerItem";
import StatusBadge from "@/components/StatusBadge";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { demoSeekerRequests, showcaseCards } from "@/lib/demo-data";
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

export default function SeekerHallScreen() {
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
        translateY: interpolate(scrollY.value, [0, 180], [0, -40], Extrapolation.CLAMP),
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
      setRequests(demoSeekerRequests);
      return;
    }

    try {
      const data = await api.get<HelpRequestListResponse>("/help-requests/mine");
      setRequests(data.items);
      announce(`已加载${data.items.length}条求助`);
    } catch {
      trigger("warning");
      setRequests(demoSeekerRequests);
      showNotice(
        "网络波动",
        "已切换到演示数据。你仍可浏览体验，稍后刷新可重试真实数据。"
      );
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
    announce("刷新完成，内容已渐进显示");
  };

  const openDetail = (requestId: string) => {
    router.push(`/(seeker)/hall/${requestId}`);
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
              <Text className="text-accessible-lg font-semibold text-slate-900">白色主题 · 求助大厅</Text>
              <Text className="mt-2 text-accessible-sm text-slate-600">
                下面先展示三种素材卡片：图文、视频+文字、音频+文字。下拉可刷新并重播入场动画。
              </Text>
            </GlassCard>
          </Animated.View>

          {showcaseCards.map((card, index) => (
            <ShowcaseMediaCard key={card.id} card={card} index={index + 1} />
          ))}

          {isDemo ? (
            <StaggerItem index={4}>
              <GlassCard tone="light" contentClassName="p-5">
                <Text className="text-accessible-sm font-semibold text-slate-900">游客模式</Text>
                <Text className="mt-2 text-sm text-slate-600">
                  当前为演示数据，功能可体验但不会写入服务器。
                </Text>
                <View className="mt-4">
                  <AccessibleButton
                    title="登录以发布真实请求"
                    onPress={() => router.push("/(public)/login")}
                  />
                </View>
              </GlassCard>
            </StaggerItem>
          ) : null}

          {requests.length === 0 ? (
            <StaggerItem index={5}>
              <GlassCard tone="light" contentClassName="items-center p-8">
                <Text className="text-accessible-base font-semibold text-slate-900">暂无求助记录</Text>
                <Text className="mt-2 text-sm text-slate-600">点击“发布求助”创建你的第一条请求</Text>
              </GlassCard>
            </StaggerItem>
          ) : (
            requests.map((item, index) => {
              const imageAttachments = (item.attachments || []).filter(
                (media) => media.file_type === "image" && media.file_url
              );
              const voiceAttachments = (item.attachments || []).filter(
                (media) => media.file_type === "voice" && media.file_url
              );
              const mediaTypes = Array.from(
                new Set((item.attachments || []).map((media) => media.file_type))
              );
              if (
                mediaTypes.length === 0 &&
                item.voice_file_id &&
                item.voice_file_id !== "text-only-placeholder"
              ) {
                mediaTypes.push("voice");
              }

              return (
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
                        {item.transcribed_text || item.raw_text || "语音求助"}
                      </Text>

                      {imageAttachments[0]?.file_url ? (
                        <SecureImage
                          endpoint={imageAttachments[0].file_url}
                          className="mt-3 h-36 w-full rounded-2xl"
                        />
                      ) : null}

                      {voiceAttachments[0]?.file_url ? (
                        <View className="mt-3">
                          <AttachmentAudioPlayer
                            endpoint={voiceAttachments[0].file_url}
                            label="语音内容"
                            compact
                          />
                        </View>
                      ) : null}

                      <View className="mt-3 flex-row flex-wrap gap-2">
                        {mediaTypes.map((type) => (
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
              );
            })
          )}
        </Animated.ScrollView>
      </SafeAreaView>

      <FeedbackModal
        visible={notice.visible}
        title={notice.title}
        message={notice.message}
        tone="info"
        onClose={closeNotice}
        primaryAction={{ label: "继续体验", onPress: closeNotice }}
      />
    </GlassBackground>
  );
}
