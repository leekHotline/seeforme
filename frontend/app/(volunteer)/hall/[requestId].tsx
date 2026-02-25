/**
 * Volunteer request detail with guest-safe fallback and animated feedback.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import AttachmentAudioPlayer from "@/components/AttachmentAudioPlayer";
import AccessibleInput from "@/components/AccessibleInput";
import FeedbackModal from "@/components/FeedbackModal";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import SecureImage from "@/components/SecureImage";
import StatusBadge from "@/components/StatusBadge";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  demoRepliesByRequest,
  demoVolunteerRequests,
  getDemoRequestById,
} from "@/lib/demo-data";
import type { HelpRequest, Reply, ReplyListResponse } from "@/lib/types";

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  tone: "info" | "error" | "success";
}

const initialModal: ModalState = {
  visible: false,
  title: "",
  message: "",
  tone: "info",
};

export default function VolunteerRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId?: string | string[] }>();
  const resolvedRequestId = Array.isArray(requestId) ? requestId[0] : requestId;

  const router = useRouter();
  const { isAuthenticated, isGuest } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>(initialModal);

  const isDemo = useMemo(
    () => isGuest || !isAuthenticated,
    [isAuthenticated, isGuest]
  );

  const closeModal = () => setModal(initialModal);

  const showModal = (
    tone: "info" | "error" | "success",
    title: string,
    message: string
  ) => {
    setModal({ visible: true, title, message, tone });
    announce(`${title}。${message}`);
  };

  const load = useCallback(async () => {
    if (!resolvedRequestId) {
      setLoading(false);
      return;
    }

    if (isDemo) {
      const demo = getDemoRequestById(resolvedRequestId) ?? demoVolunteerRequests[0] ?? null;
      setRequest(demo);
      setReplies(demoRepliesByRequest[resolvedRequestId] ?? []);
      setLoading(false);
      return;
    }

    try {
      const [req, reps] = await Promise.all([
        api.get<HelpRequest>(`/help-requests/${resolvedRequestId}`),
        api.get<ReplyListResponse>(`/help-requests/${resolvedRequestId}/replies`),
      ]);
      setRequest(req);
      setReplies(Array.isArray(reps.items) ? reps.items : []);
    } catch {
      trigger("error");
      showModal("error", "加载失败", "请求详情暂时不可用，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }, [isDemo, resolvedRequestId, announce, trigger]);

  useEffect(() => {
    load();
  }, [load]);

  const guardedAction = (action: () => Promise<void>) => {
    if (isDemo) {
      trigger("warning");
      showModal("info", "游客只读模式", "该操作需要登录后才能提交。你仍可完整浏览流程。");
      return;
    }
    action().catch(() => {
      trigger("error");
      showModal("error", "提交失败", "请稍后重试。");
    });
  };

  const handleClaim = async () => {
    if (!resolvedRequestId) return;
    try {
      await api.post(`/help-requests/${resolvedRequestId}/claim`);
      trigger("success");
      showModal("success", "接单成功", "你现在可以开始回复该求助。");
      await load();
    } catch (error) {
      trigger("error");
      if (error instanceof ApiError && error.status === 409) {
        showModal("info", "请求已被接单", "该请求已由其他志愿者处理。");
        return;
      }
      showModal("error", "接单失败", "请稍后重试。");
    }
  };

  const handleReply = async () => {
    if (!resolvedRequestId) return;
    if (!replyText.trim()) {
      trigger("warning");
      showModal("info", "内容为空", "请输入回复内容后再发送。");
      return;
    }

    if (isDemo) {
      trigger("success");
      showModal("success", "演示发送成功", "游客模式下不会写入服务器。登录后可发送真实回复。");
      setReplyText("");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/help-requests/${resolvedRequestId}/replies`, {
        reply_type: "text",
        text: replyText.trim(),
      });
      trigger("success");
      showModal("success", "回复已发送", "你的回复已同步给求助者。");
      setReplyText("");
      await load();
    } catch {
      trigger("error");
      showModal("error", "发送失败", "请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <GlassBackground>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-accessible-sm text-slate-200">加载中...</Text>
        </SafeAreaView>
      </GlassBackground>
    );
  }

  if (!request) {
    return (
      <GlassBackground>
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Text className="text-accessible-base font-semibold text-white">未找到该任务</Text>
          <View className="mt-4 w-full">
            <AccessibleButton title="返回大厅" onPress={() => router.replace("/(volunteer)/hall")} />
          </View>
        </SafeAreaView>
      </GlassBackground>
    );
  }

  const canClaim = request.status === "open";
  const canReply = request.status === "claimed" || request.status === "replied";
  const imageAttachments = (request.attachments || []).filter(
    (media) => media.file_type === "image" && media.file_url
  );
  const voiceAttachments = (request.attachments || []).filter(
    (media) => media.file_type === "voice" && media.file_url
  );
  const mediaTypes = Array.from(
    new Set((request.attachments || []).map((media) => media.file_type))
  );
  if (
    mediaTypes.length === 0 &&
    request.voice_file_id &&
    request.voice_file_id !== "text-only-placeholder"
  ) {
    mediaTypes.push("voice");
  }

  return (
    <GlassBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 px-4 pt-3">
        <GlassCard contentClassName="p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <StatusBadge status={request.status} />
            <Text className="text-sm text-slate-300">
              {new Date(request.created_at).toLocaleString("zh-CN")}
            </Text>
          </View>

          <Text className="text-accessible-sm leading-7 text-slate-100">
            {request.transcribed_text || request.raw_text || "（语音求助）"}
          </Text>

          {imageAttachments.length > 0 ? (
            <View className="mt-3 gap-2">
              {imageAttachments.map((media) =>
                media.file_url ? (
                  <SecureImage
                    key={media.id}
                    endpoint={media.file_url}
                    className="h-40 w-full rounded-2xl"
                  />
                ) : null
              )}
            </View>
          ) : null}

          {voiceAttachments.length > 0 ? (
            <View className="mt-3 gap-2">
              {voiceAttachments.map((media, index) =>
                media.file_url ? (
                  <AttachmentAudioPlayer
                    key={media.id}
                    endpoint={media.file_url}
                    label={`语音 ${index + 1}`}
                  />
                ) : null
              )}
            </View>
          ) : null}

          <View className="mt-3 flex-row flex-wrap gap-2">
            {mediaTypes.map((type) => (
              <View key={type} className="rounded-full bg-white/15 px-3 py-1">
                <Text className="text-xs font-semibold text-slate-100">
                  {type === "image" ? "图文" : type === "video" ? "视频" : "语音"}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard className="mt-3" contentClassName="p-5">
          <Text className="text-accessible-base font-semibold text-white">回复记录 ({replies.length})</Text>
          {replies.length === 0 ? (
            <Text className="mt-2 text-sm text-slate-300">还没有回复，点击下方可先发送第一条。</Text>
          ) : (
            <View className="mt-3 gap-2">
              {replies.map((reply) => (
                <View key={reply.id} className="rounded-2xl bg-slate-800/60 p-3">
                  <Text className="text-sm text-cyan-200">
                    {reply.reply_type === "voice" ? "语音回复" : "文本回复"}
                  </Text>
                  <Text className="mt-1 text-accessible-sm text-slate-100">
                    {reply.text || "（语音内容）"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        <View className="mt-4 gap-3">
          {canClaim ? (
            <AccessibleButton
              title="接单"
              onPress={() => guardedAction(handleClaim)}
            />
          ) : null}

          {canReply ? (
            <GlassCard contentClassName="p-4">
              <AccessibleInput
                label="回复内容"
                placeholder="输入你要发送给求助者的内容"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={4}
                labelClassName="text-slate-100"
                inputClassName="min-h-[120px] bg-white/95 text-slate-950"
                textAlignVertical="top"
              />
              <AccessibleButton
                title={isDemo ? "演示发送" : "发送回复"}
                loading={submitting}
                onPress={handleReply}
              />
            </GlassCard>
          ) : null}

          <AccessibleButton
            title="返回大厅"
            variant="secondary"
            onPress={() => router.replace("/(volunteer)/hall")}
          />
        </View>
      </SafeAreaView>

      <FeedbackModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        tone={modal.tone}
        onClose={closeModal}
        primaryAction={{ label: "知道了", onPress: closeModal }}
        secondaryAction={
          modal.tone !== "success"
            ? {
                label: "去登录",
                variant: "secondary",
                onPress: () => {
                  closeModal();
                  router.push("/(public)/login");
                },
              }
            : undefined
        }
      />
    </GlassBackground>
  );
}
