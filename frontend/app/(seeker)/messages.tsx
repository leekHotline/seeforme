/**
 * Seeker message center with filters and interactive cards.
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
  title: string;
  preview: string;
  time: string;
  unread: boolean;
  requestId?: string;
}

const mockMessages: MessageItem[] = [
  {
    id: "msg-1",
    type: "reply",
    title: "志愿者已回复你的求助",
    preview: "药盒是布洛芬 200mg，每 6 小时最多 1 片。",
    time: "刚刚",
    unread: true,
    requestId: "demo-seeker-2",
  },
  {
    id: "msg-2",
    type: "system",
    title: "系统提醒",
    preview: "建议在发布时添加图片或语音，平均响应速度可提升 40%。",
    time: "12 分钟前",
    unread: true,
  },
  {
    id: "msg-3",
    type: "reply",
    title: "任务状态更新",
    preview: "你的请求已被志愿者接单，预计 1 分钟内收到答复。",
    time: "35 分钟前",
    unread: false,
    requestId: "demo-seeker-1",
  },
];

export default function SeekerMessagesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<MessageFilter>("all");

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
        >
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360 }}
          >
            <GlassCard contentClassName="p-6">
              <Text className="text-accessible-lg font-semibold text-white">消息中心</Text>
              <Text className="mt-2 text-accessible-sm text-slate-200">
                查看志愿者回复、系统提醒和状态变化。
              </Text>
            </GlassCard>
          </MotiView>

          <View className="flex-row gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "unread", label: "未读" },
              { key: "system", label: "系统" },
            ].map((item) => {
              const selected = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  className={`rounded-full px-4 py-2 ${
                    selected ? "bg-cyan-300" : "bg-white/20"
                  }`}
                  onPress={() => setFilter(item.key as MessageFilter)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filtered.length === 0 ? (
            <GlassCard contentClassName="items-center p-8">
              <Text className="text-accessible-base font-semibold text-white">暂无消息</Text>
              <Text className="mt-2 text-sm text-slate-300">切换筛选或稍后再看</Text>
            </GlassCard>
          ) : (
            filtered.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 18 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 320, delay: 70 * (index + 1) }}
              >
                <Pressable
                  onPress={() => {
                    if (item.requestId) {
                      router.push(`/(seeker)/hall/${item.requestId}`);
                    }
                  }}
                >
                  <GlassCard contentClassName="p-5">
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-accessible-base font-semibold text-white">{item.title}</Text>
                      <View className="flex-row items-center gap-2">
                        {item.unread ? (
                          <View className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                        ) : null}
                        <Text className="text-xs text-slate-300">{item.time}</Text>
                      </View>
                    </View>
                    <Text className="text-sm leading-6 text-slate-200">{item.preview}</Text>
                  </GlassCard>
                </Pressable>
              </MotiView>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}

