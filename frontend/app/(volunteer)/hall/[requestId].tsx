/**
 * Volunteer request detail — view request, claim it, and reply.
 */

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import AccessibleInput from "@/components/AccessibleInput";
import StatusBadge from "@/components/StatusBadge";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api, ApiError } from "@/lib/api";
import type { HelpRequest, Reply } from "@/lib/types";

export default function VolunteerRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [req, reps] = await Promise.all([
        api.get<HelpRequest>(`/help-requests/${requestId}`),
        api.get<Reply[]>(`/help-requests/${requestId}/replies`),
      ]);
      setRequest(req);
      setReplies(reps);
    } catch {
      announce("加载失败");
    } finally {
      setLoading(false);
    }
  }, [requestId, announce]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaim = async () => {
    try {
      await api.post(`/help-requests/${requestId}/claim`);
      trigger("success");
      announce("接单成功！你可以开始回复了");
      load();
    } catch (e) {
      trigger("error");
      if (e instanceof ApiError && e.status === 409) {
        announce("该请求已被其他志愿者接单");
      } else {
        announce("接单失败");
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      trigger("error");
      announce("请输入回复内容");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/help-requests/${requestId}/replies`, {
        reply_type: "text",
        text: replyText.trim(),
      });
      trigger("success");
      announce("回复已发送");
      setReplyText("");
      load();
    } catch {
      trigger("error");
      announce("回复失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-accessible-base text-gray-500">加载中…</Text>
      </SafeAreaView>
    );
  }

  const canClaim = request.status === "open";
  const canReply = request.status === "claimed" || request.status === "replied";

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
        {/* Status */}
        <View className="flex-row items-center justify-between mb-4">
          <StatusBadge status={request.status} />
          <Text className="text-sm text-gray-400">
            {new Date(request.created_at).toLocaleString("zh-CN")}
          </Text>
        </View>

        {/* Request content */}
        <View className="bg-gray-50 rounded-2xl p-5 mb-6">
          <Text className="text-sm text-gray-500 mb-2">求助内容</Text>
          <Text
            className="text-accessible-base text-gray-900 leading-7"
            accessibilityLabel="求助内容"
          >
            {request.transcribed_text || request.raw_text || "（语音求助）"}
          </Text>
        </View>

        {/* Claim button */}
        {canClaim && (
          <AccessibleButton
            title="🤝 接单"
            announceText="接单，开始帮助这位求助者"
            onPress={handleClaim}
            className="mb-6"
          />
        )}

        {/* Replies */}
        <Text
          className="text-accessible-lg font-bold text-gray-900 mb-3"
          accessibilityRole="header"
        >
          回复记录 ({replies.length})
        </Text>

        {replies.map((reply) => (
          <View
            key={reply.id}
            className="bg-primary-50 rounded-2xl p-4 mb-3"
          >
            <Text className="text-sm text-primary-600 font-semibold mb-1">
              {reply.reply_type === "voice" ? "🎙️ 语音回复" : "📝 文字回复"}
            </Text>
            <Text className="text-accessible-base text-gray-900">
              {reply.text || "（语音回复）"}
            </Text>
          </View>
        ))}

        {/* Reply input */}
        {canReply && (
          <View className="mt-4 mb-8">
            <AccessibleInput
              label="文字回复"
              placeholder="输入你的回复…"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={3}
            />
            <AccessibleButton
              title="发送回复"
              loading={submitting}
              announceText="发送回复给求助者"
              onPress={handleReply}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
