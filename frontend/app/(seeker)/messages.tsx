/**
 * Seeker message center with live reply feed.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { MotiView } from "moti";

import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import * as storage from "@/lib/storage";
import type {
  HelpRequestListResponse,
  NotificationItem,
  NotificationListResponse,
  ReplyListResponse,
} from "@/lib/types";

type MessageFilter = "all" | "unread" | "system";
type MessageType = "reply" | "system";

interface MessageItem {
  id: string;
  type: MessageType;
  sender: string;
  title: string;
  preview: string;
  time: string;
  unread: boolean;
  tag: string;
  requestId?: string;
  sortTs: number;
}

interface SystemMessageSeed {
  id: string;
  title: string;
  preview: string;
  tag: string;
  minutesAgo: number;
}

const filterOptions: Array<{ key: MessageFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未读" },
  { key: "system", label: "系统" },
];

const SYSTEM_MESSAGES: SystemMessageSeed[] = [
  {
    id: "upload-tip",
    title: "上传语音可提高响应速度",
    preview: "带语音的求助平均更快被志愿者定位和处理。",
    tag: "系统",
    minutesAgo: 12,
  },
  {
    id: "photo-tip",
    title: "建议补充拍摄角度",
    preview: "如果是药盒或标签，建议拍摄正反两面，识别更准确。",
    tag: "建议",
    minutesAgo: 90,
  },
];

const SEEN_STORAGE_KEY = "seeker_seen_message_ids_v1";

function formatRelativeTime(timestampMs: number): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestampMs);
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffHour < 48) return "昨天";

  return new Date(timestampMs).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseTimestamp(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : fallback;
}

function applySeenState(items: MessageItem[], seen: Set<string>): MessageItem[] {
  return items.map((item) => ({
    ...item,
    unread: !seen.has(item.id),
  }));
}

function mapNotificationToMessage(item: NotificationItem): MessageItem | null {
  if (item.type !== "reply") return null;

  const sortTs = parseTimestamp(item.created_at, Date.now());
  return {
    id: item.id,
    type: "reply",
    sender: item.sender || "志愿者",
    title: item.title || "你的求助收到新回复",
    preview: item.preview || "收到一条回复，点击查看详情。",
    time: formatRelativeTime(sortTs),
    unread: false,
    tag: item.tag || "回复",
    requestId: item.request_id ?? undefined,
    sortTs,
  };
}

export default function SeekerMessagesScreen() {
  const router = useRouter();
  const { isAuthenticated, isGuest } = useAuth();

  const [filter, setFilter] = useState<MessageFilter>("all");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    seenIdsRef.current = seenIds;
  }, [seenIds]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await storage.getItem(SEEN_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as string[];
        const next = new Set(parsed);
        setSeenIds(next);
        seenIdsRef.current = next;
      } catch {
        // Ignore malformed local state.
      }
    })();
  }, []);

  const persistSeen = useCallback(async (next: Set<string>) => {
    await storage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const markAsRead = useCallback(
    (messageId: string) => {
      setSeenIds((prev) => {
        if (prev.has(messageId)) return prev;
        const next = new Set(prev);
        next.add(messageId);
        seenIdsRef.current = next;
        void persistSeen(next);

        setMessages((current) =>
          current.map((item) =>
            item.id === messageId ? { ...item, unread: false } : item
          )
        );

        return next;
      });
    },
    [persistSeen]
  );

  const buildSystemMessages = useCallback((): MessageItem[] => {
    const now = Date.now();
    return SYSTEM_MESSAGES.map((seed) => {
      const sortTs = now - seed.minutesAgo * 60 * 1000;
      return {
        id: `system-${seed.id}`,
        type: "system",
        sender: "系统助手",
        title: seed.title,
        preview: seed.preview,
        time: formatRelativeTime(sortTs),
        unread: false,
        tag: seed.tag,
        sortTs,
      };
    });
  }, []);

  const loadReplyMessagesLegacy = useCallback(async (): Promise<MessageItem[]> => {
    const requestsResp = await api.get<HelpRequestListResponse>(
      "/help-requests/mine?page=1&page_size=100"
    );

    const requests = requestsResp.items;
    const replyGroups = await Promise.all(
      requests.map(async (request) => {
        try {
          const repliesResp = await api.get<ReplyListResponse>(
            `/help-requests/${request.id}/replies`
          );
          return { requestId: request.id, replies: repliesResp.items };
        } catch {
          return { requestId: request.id, replies: [] as ReplyListResponse["items"] };
        }
      })
    );

    const replyMessages: MessageItem[] = [];
    replyGroups.forEach(({ requestId, replies }) => {
      replies.forEach((reply) => {
        const sortTs = parseTimestamp(reply.created_at, Date.now());
        replyMessages.push({
          id: `reply-${reply.id}`,
          type: "reply",
          sender: "志愿者",
          title: "你的求助收到新回复",
          preview:
            reply.reply_type === "voice"
              ? "收到一条语音回复，点击进入详情收听。"
              : reply.text?.trim() || "收到一条文本回复，点击查看详情。",
          time: formatRelativeTime(sortTs),
          unread: false,
          tag: reply.reply_type === "voice" ? "语音" : "回复",
          requestId,
          sortTs,
        });
      });
    });

    return replyMessages;
  }, []);

  const loadMessages = useCallback(async () => {
    setLoadError(null);

    const systemItems = buildSystemMessages();

    if (isGuest || !isAuthenticated) {
      setMessages(applySeenState(systemItems, seenIdsRef.current));
      setLastSyncedAt(Date.now());
      return;
    }

    try {
      const notificationResp = await api.get<NotificationListResponse>(
        "/notifications?limit=200"
      );
      const notificationItems = Array.isArray(notificationResp.items)
        ? notificationResp.items
        : [];

      let replyMessages = notificationItems
        .map(mapNotificationToMessage)
        .filter((item): item is MessageItem => Boolean(item));

      if (replyMessages.length === 0) {
        replyMessages = await loadReplyMessagesLegacy();
      }

      const merged = [...replyMessages, ...systemItems].sort((a, b) => b.sortTs - a.sortTs);
      setMessages(applySeenState(merged, seenIdsRef.current));
      setLastSyncedAt(Date.now());
    } catch {
      try {
        const fallbackReplyMessages = await loadReplyMessagesLegacy();
        const merged = [...fallbackReplyMessages, ...systemItems].sort(
          (a, b) => b.sortTs - a.sortTs
        );
        setMessages(applySeenState(merged, seenIdsRef.current));
        setLastSyncedAt(Date.now());
        setLoadError("通知服务暂不可用，已切换兼容模式");
      } catch {
        setLoadError("同步失败，稍后将自动重试");
        setMessages(applySeenState(systemItems, seenIdsRef.current));
      }
    }
  }, [buildSystemMessages, isAuthenticated, isGuest, loadReplyMessagesLegacy]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useFocusEffect(
    useCallback(() => {
      void loadMessages();

      if (isGuest || !isAuthenticated) return;

      const timer = setInterval(() => {
        void loadMessages();
      }, 8000);

      return () => clearInterval(timer);
    }, [isAuthenticated, isGuest, loadMessages])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }, [loadMessages]);

  const unreadCount = useMemo(
    () => messages.filter((item) => item.unread).length,
    [messages]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return messages;
    if (filter === "unread") return messages.filter((item) => item.unread);
    return messages.filter((item) => item.type === "system");
  }, [filter, messages]);

  const onOpenMessage = useCallback(
    (item: MessageItem) => {
      markAsRead(item.id);
      if (item.requestId) {
        router.push(`/(seeker)/hall/${item.requestId}`);
      }
    },
    [markAsRead, router]
  );

  return (
    <GlassBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 px-4 pt-3">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 12, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#06B6D4"
            />
          }
        >
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <GlassCard
              tone="light"
              className="border-slate-200/80 shadow-sm shadow-cyan-200/40"
              contentClassName="relative overflow-hidden p-6"
            >
              <View
                pointerEvents="none"
                className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-100/70"
              />
              <Text className="text-accessible-lg font-semibold text-slate-900">消息中心</Text>
              <Text className="mt-2 text-sm text-slate-600">
                实时聚合志愿者回复和系统建议，进入页面即刷新，默认每 8 秒自动同步。
              </Text>

              <View className="mt-4 flex-row gap-2">
                <View className="rounded-xl border border-cyan-200/80 bg-cyan-50 px-3 py-2">
                  <Text className="text-xs text-cyan-700">未读消息</Text>
                  <Text className="mt-1 text-base font-semibold text-cyan-800">{unreadCount}</Text>
                </View>
                <View className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Text className="text-xs text-slate-500">全部消息</Text>
                  <Text className="mt-1 text-base font-semibold text-slate-800">{messages.length}</Text>
                </View>
              </View>

              <Text className="mt-3 text-xs text-slate-500">
                {lastSyncedAt
                  ? `最近同步：${new Date(lastSyncedAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}`
                  : "正在同步..."}
              </Text>

              {loadError ? (
                <Text className="mt-1 text-xs text-rose-500">{loadError}</Text>
              ) : null}
            </GlassCard>
          </MotiView>

          <View className="flex-row gap-2">
            {filterOptions.map((item) => {
              const selected = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  className={`rounded-full border px-4 py-2 ${
                    selected
                      ? "border-cyan-300 bg-cyan-100"
                      : "border-slate-200 bg-white/80"
                  }`}
                  onPress={() => setFilter(item.key)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? "text-cyan-800" : "text-slate-700"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filtered.length === 0 ? (
            <GlassCard tone="light" contentClassName="items-center p-8">
              <Text className="text-accessible-base font-semibold text-slate-900">暂无消息</Text>
              <Text className="mt-2 text-sm text-slate-500">下拉刷新以同步最新回复</Text>
            </GlassCard>
          ) : (
            filtered.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 260, delay: index * 60 }}
              >
                <Pressable
                  onPress={() => onOpenMessage(item)}
                  accessibilityRole="button"
                >
                  {({ pressed }) => (
                    <MotiView
                      animate={{ scale: pressed ? 0.988 : 1, translateY: pressed ? 1 : 0 }}
                      transition={{ type: "timing", duration: 120 }}
                    >
                      <GlassCard
                        tone="light"
                        className="border-slate-200/80"
                        contentClassName="p-5"
                      >
                        <View className="mb-3 flex-row items-start justify-between">
                          <View className="flex-row items-center gap-3">
                            <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-900">
                              <Text className="text-xs font-semibold text-white">
                                {item.sender.slice(0, 1)}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-sm font-semibold text-slate-900">{item.sender}</Text>
                              <Text className="text-xs text-slate-500">{item.time}</Text>
                            </View>
                          </View>

                          <View className="flex-row items-center gap-2">
                            {item.unread ? <View className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> : null}
                            <Text className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                              {item.tag}
                            </Text>
                          </View>
                        </View>

                        <Text className="text-accessible-base font-semibold text-slate-900">
                          {item.title}
                        </Text>
                        <Text className="mt-1 text-sm leading-6 text-slate-600">
                          {item.preview}
                        </Text>

                        <View className="mt-3 flex-row items-center justify-between">
                          <Text className="text-xs text-slate-400">
                            {item.requestId ? "点击进入求助详情" : "系统通知"}
                          </Text>
                          {item.requestId ? (
                            <Text className="text-xs font-semibold text-cyan-700">查看详情</Text>
                          ) : null}
                        </View>
                      </GlassCard>
                    </MotiView>
                  )}
                </Pressable>
              </MotiView>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}
