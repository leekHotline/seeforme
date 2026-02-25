/**
 * Seeker message center with modern summary and message cards.
 */

import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";

type MessageFilter = "all" | "unread" | "system";

interface MessageItem {
  id: string;
  type: "reply" | "system";
  sender: string;
  title: string;
  preview: string;
  time: string;
  unread: boolean;
  tag: string;
  requestId?: string;
}

const mockMessages: MessageItem[] = [
  {
    id: "msg-1",
    type: "reply",
    sender: "志愿者 Ming",
    title: "你的求助已收到回复",
    preview: "药盒是布洛芬 200mg，建议每 6 小时最多 1 片。",
    time: "刚刚",
    unread: true,
    tag: "回复",
    requestId: "demo-seeker-2",
  },
  {
    id: "msg-2",
    type: "system",
    sender: "系统助手",
    title: "上传语音可提高响应速度",
    preview: "带语音的求助平均更快被志愿者定位和处理。",
    time: "12 分钟前",
    unread: true,
    tag: "系统",
  },
  {
    id: "msg-3",
    type: "reply",
    sender: "志愿者 Lily",
    title: "任务状态更新",
    preview: "你的求助已被接单，志愿者正在查看现场信息。",
    time: "35 分钟前",
    unread: false,
    tag: "进度",
    requestId: "demo-seeker-1",
  },
  {
    id: "msg-4",
    type: "system",
    sender: "系统助手",
    title: "建议补充拍摄角度",
    preview: "如果是药盒或标签，建议拍摄正反两面，识别更准确。",
    time: "昨天",
    unread: false,
    tag: "建议",
  },
];

const filterOptions: Array<{ key: MessageFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未读" },
  { key: "system", label: "系统" },
];

export default function SeekerMessagesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<MessageFilter>("all");

  const unreadCount = useMemo(
    () => mockMessages.filter((item) => item.unread).length,
    []
  );

  const filtered = useMemo(() => {
    if (filter === "all") return mockMessages;
    if (filter === "unread") return mockMessages.filter((item) => item.unread);
    return mockMessages.filter((item) => item.type === "system");
  }, [filter]);

  return (
    <GlassBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 px-4 pt-3">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 12, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
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
                你可以在这里查看回复、状态变化和系统建议。
              </Text>

              <View className="mt-4 flex-row gap-2">
                <View className="rounded-xl border border-cyan-200/80 bg-cyan-50 px-3 py-2">
                  <Text className="text-xs text-cyan-700">未读消息</Text>
                  <Text className="mt-1 text-base font-semibold text-cyan-800">{unreadCount}</Text>
                </View>
                <View className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Text className="text-xs text-slate-500">全部消息</Text>
                  <Text className="mt-1 text-base font-semibold text-slate-800">{mockMessages.length}</Text>
                </View>
              </View>
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
              <Text className="mt-2 text-sm text-slate-500">切换筛选或稍后再查看</Text>
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
                  onPress={() => {
                    if (item.requestId) {
                      router.push(`/(seeker)/hall/${item.requestId}`);
                    }
                  }}
                  disabled={!item.requestId}
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
