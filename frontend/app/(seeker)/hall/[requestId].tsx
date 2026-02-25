/**
 * Seeker request detail with guest-safe fallback.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";

import AccessibleButton from "@/components/AccessibleButton";
import AttachmentAudioPlayer from "@/components/AttachmentAudioPlayer";
import FeedbackModal from "@/components/FeedbackModal";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import SecureImage from "@/components/SecureImage";
import StatusBadge from "@/components/StatusBadge";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  demoRepliesByRequest,
  demoSeekerRequests,
  getDemoRequestById,
} from "@/lib/demo-data";
import type { HelpRequest, Reply, ReplyListResponse, RequestStatus } from "@/lib/types";

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  tone: "info" | "success" | "error";
}

const initialModal: ModalState = {
  visible: false,
  title: "",
  message: "",
  tone: "info",
};

export default function SeekerRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId?: string | string[] }>();
  const resolvedRequestId = Array.isArray(requestId) ? requestId[0] : requestId;

  const router = useRouter();
  const { isAuthenticated, isGuest } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(initialModal);

  const isDemo = useMemo(
    () => isGuest || !isAuthenticated,
    [isAuthenticated, isGuest]
  );

  const closeModal = () => setModal(initialModal);

  const showModal = (
    tone: "info" | "success" | "error",
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
      const demo = getDemoRequestById(resolvedRequestId) ?? demoSeekerRequests[0] ?? null;
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
      showModal("info", "游客只读模式", "该操作需要登录后才能提交到服务器。");
      return;
    }
    action().catch(() => {
      trigger("error");
      showModal("error", "提交失败", "请稍后重试。");
    });
  };

  const handleCancel = async () => {
    if (!resolvedRequestId) return;
    await api.post(`/help-requests/${resolvedRequestId}/cancel`);
    trigger("success");
    showModal("success", "已取消", "本条求助已取消。");
    await load();
  };

  const handleFeedback = async (resolved: boolean) => {
    if (!resolvedRequestId) return;
    await api.post(`/help-requests/${resolvedRequestId}/feedback`, { resolved });
    trigger("success");
    showModal(
      "success",
      "反馈已提交",
      resolved ? "已标记为解决。" : "已标记为未解决。"
    );
    await load();
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
          <Text className="text-accessible-base font-semibold text-white">未找到该求助</Text>
          <View className="mt-4 w-full">
            <AccessibleButton title="返回大厅" onPress={() => router.replace("/(seeker)/hall")} />
          </View>
        </SafeAreaView>
      </GlassBackground>
    );
  }

  const canCancel: RequestStatus[] = ["open", "claimed", "replied"];
  const canFeedback = request.status === "replied";
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
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 30, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 320 }}
          >
            <GlassCard
              tone="light"
              className="border-slate-200/80 shadow-sm shadow-cyan-200/40"
              contentClassName="relative overflow-hidden p-5"
            >
              <View
                pointerEvents="none"
                className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-100/60"
              />

              <View className="mb-3 flex-row items-center justify-between">
                <StatusBadge status={request.status} />
                <Text className="text-sm text-slate-500">
                  {new Date(request.created_at).toLocaleString("zh-CN")}
                </Text>
              </View>

              <Text className="text-accessible-base font-semibold text-slate-900">
                求助详情
              </Text>
              <Text className="mt-1 text-accessible-sm leading-7 text-slate-700">
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
                <View className="mt-3 gap-2 rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-2.5">
                  {voiceAttachments.map((media, index) =>
                    media.file_url ? (
                      <AttachmentAudioPlayer
                        key={media.id}
                        endpoint={media.file_url}
                        label={`语音 ${index + 1}`}
                        speakerName="我"
                        subtitle={new Date(request.created_at).toLocaleString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        badge="voice"
                      />
                    ) : null
                  )}
                </View>
              ) : null}

              <View className="mt-3 flex-row flex-wrap gap-2">
                {mediaTypes.map((type) => (
                  <View
                    key={type}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1"
                  >
                    <Text className="text-xs font-semibold text-slate-700">
                      {type === "image" ? "图文" : type === "video" ? "视频" : "语音"}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 340, delay: 60 }}
          >
            <GlassCard
              tone="light"
              className="border-slate-200/80"
              contentClassName="p-5"
            >
              <Text className="text-accessible-base font-semibold text-slate-900">回复 ({replies.length})</Text>
              {replies.length === 0 ? (
                <Text className="mt-2 text-sm text-slate-600">暂时还没有回复，请稍后刷新。</Text>
              ) : (
                <View className="mt-3 gap-2">
                  {replies.map((reply) => (
                    <View
                      key={reply.id}
                      className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-3"
                    >
                      <Text className="text-sm font-semibold text-cyan-700">
                        {reply.reply_type === "voice" ? "语音回复" : "文本回复"}
                      </Text>
                      <Text className="mt-1 text-accessible-sm text-slate-700">
                        {reply.text || "（语音内容）"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 120 }}
          >
            <View className="mt-1 gap-3">
              {canFeedback ? (
                <>
                  <AccessibleButton
                    title="标记为已解决"
                    onPress={() => guardedAction(() => handleFeedback(true))}
                  />
                  <AccessibleButton
                    title="标记为未解决"
                    variant="danger"
                    onPress={() => guardedAction(() => handleFeedback(false))}
                  />
                </>
              ) : null}

              {canCancel.includes(request.status) ? (
                <AccessibleButton
                  title="取消求助"
                  variant="ghost"
                  onPress={() => guardedAction(handleCancel)}
                />
              ) : null}

              <AccessibleButton
                title="返回大厅"
                variant="secondary"
                onPress={() => router.replace("/(seeker)/hall")}
              />
            </View>
          </MotiView>
        </ScrollView>
      </SafeAreaView>

      <FeedbackModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        tone={modal.tone}
        onClose={closeModal}
        primaryAction={{
          label: "知道了",
          onPress: closeModal,
        }}
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
