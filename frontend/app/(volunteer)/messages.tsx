/**
 * Volunteer message center with task notifications.
 */

import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";

type MessageFilter = "all" | "urgent" | "system";

interface VolunteerMessage {
  id: string;
  title: string;
  preview: string;
  time: string;
  unread: boolean;
  urgent: boolean;
  system: boolean;
  requestId?: string;
}

const mockVolunteerMessages: VolunteerMessage[] = [
  {
    id: "vol-msg-1",
    title: "新任务：药品识别",
    preview: "求助者上传了图文内容，建议优先处理。",
    time: "刚刚",
    unread: true,
    urgent: true,
    system: false,
    requestId: "demo-volunteer-1",
  },
  {
    id: "vol-msg-2",
    title: "系统提醒",
    preview: "你今日已帮助 3 位用户，继续保持。",
    time: "10 分钟前",
    unread: false,
    urgent: false,
    system: true,
  },
  {
    id: "vol-msg-3",
    title: "任务状态变化",
    preview: "你接单的任务已被求助者标记为“已解决”。",
    time: "40 分钟前",
    unread: true,
    urgent: false,
    system: false,
    requestId: "demo-volunteer-2",
  },
];

export default function VolunteerMessagesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<MessageFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return mockVolunteerMessages;
    if (filter === "urgent") return mockVolunteerMessages.filter((item) => item.urgent);
    return mockVolunteerMessages.filter((item) => item.system);
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
                任务提醒、系统通知和状态回执都在这里统一展示。
              </Text>
            </GlassCard>
          </MotiView>

          <View className="flex-row gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "urgent", label: "紧急" },
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
              <Text className="mt-2 text-sm text-slate-300">可稍后刷新查看最新通知</Text>
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
                      router.push(`/(volunteer)/hall/${item.requestId}`);
                    }
                  }}
                >
                  <GlassCard contentClassName="p-5">
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-accessible-base font-semibold text-white">{item.title}</Text>
                      <View className="flex-row items-center gap-2">
                        {item.urgent ? (
                          <Text className="rounded-full bg-rose-300 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
                            紧急
                          </Text>
                        ) : null}
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

