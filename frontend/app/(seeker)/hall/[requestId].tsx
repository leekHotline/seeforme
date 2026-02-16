/**
 * Seeker request detail — view request, listen to replies, give feedback.
 */

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import StatusBadge from "@/components/StatusBadge";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";
import type { HelpRequest, Reply, RequestStatus } from "@/lib/types";

export default function SeekerRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [req, reps] = await Promise.all([
        api.get<HelpRequest>(`/help-requests/${requestId}`),
        api.get<Reply[]>(`/help-requests/${requestId}/replies`),
      ]);
      setRequest(req);
      setReplies(reps);
      announce(`求助详情已加载，状态${req.status}，共${reps.length}条回复`);
    } catch {
      announce("加载失败");
    } finally {
      setLoading(false);
    }
  }, [requestId, announce]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async () => {
    try {
      await api.post(`/help-requests/${requestId}/cancel`);
      trigger("success");
      announce("已取消求助");
      load();
    } catch {
      trigger("error");
      announce("取消失败");
    }
  };

  const handleFeedback = async (resolved: boolean) => {
    try {
      await api.post(`/help-requests/${requestId}/feedback`, { resolved });
      trigger("success");
      announce(resolved ? "已标记为解决" : "已标记为未解决");
      load();
    } catch {
      trigger("error");
      announce("提交反馈失败");
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-accessible-base text-gray-500">加载中…</Text>
      </SafeAreaView>
    );
  }

  const canCancel: RequestStatus[] = ["open", "claimed", "replied"];
  const canFeedback = request.status === "replied";

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-4">
        {/* Status */}
        <View className="flex-row items-center justify-between mb-4">
          <StatusBadge status={request.status} />
          <Text className="text-sm text-gray-400">
            {new Date(request.created_at).toLocaleString("zh-CN")}
          </Text>
        </View>

        {/* Content */}
        <View className="bg-gray-50 rounded-2xl p-5 mb-6">
          <Text
            className="text-accessible-base text-gray-900 leading-7"
            accessibilityLabel="求助内容"
          >
            {request.transcribed_text || request.raw_text || "（语音求助）"}
          </Text>
        </View>

        {/* Replies */}
        <Text
          className="text-accessible-lg font-bold text-gray-900 mb-3"
          accessibilityRole="header"
        >
          回复 ({replies.length})
        </Text>

        {replies.length === 0 ? (
          <Text className="text-accessible-sm text-gray-400 mb-6">
            暂无回复，请耐心等待志愿者响应
          </Text>
        ) : (
          replies.map((reply) => (
            <View
              key={reply.id}
              className="bg-primary-50 rounded-2xl p-4 mb-3"
              accessibilityLabel={`志愿者回复：${reply.text || "语音回复"}`}
            >
              <Text className="text-sm text-primary-600 font-semibold mb-1">
                志愿者回复 · {reply.reply_type === "voice" ? "🎙️ 语音" : "📝 文字"}
              </Text>
              <Text className="text-accessible-base text-gray-900">
                {reply.text || "（语音回复，点击播放）"}
              </Text>
            </View>
          ))
        )}

        {/* Action buttons */}
        <View className="gap-3 mt-4 mb-8">
          {canFeedback && (
            <>
              <AccessibleButton
                title="✅ 已解决"
                announceText="标记此求助为已解决"
                onPress={() => handleFeedback(true)}
              />
              <AccessibleButton
                title="❌ 未解决"
                announceText="标记此求助为未解决"
                variant="danger"
                onPress={() => handleFeedback(false)}
              />
            </>
          )}

          {canCancel.includes(request.status) && (
            <AccessibleButton
              title="取消求助"
              variant="ghost"
              announceText="取消此求助"
              onPress={() =>
                Alert.alert("确认取消", "确定要取消这条求助吗？", [
                  { text: "不取消", style: "cancel" },
                  { text: "确定取消", onPress: handleCancel, style: "destructive" },
                ])
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
