/**
 * Seeker create request screen with media capture/upload actions.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { MotiView } from "moti";

import AccessibleButton from "@/components/AccessibleButton";
import AccessibleInput from "@/components/AccessibleInput";
import FeedbackModal from "@/components/FeedbackModal";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  HelpRequestCreate,
  UploadContentResponse,
  UploadPresignResponse,
} from "@/lib/types";

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  tone: "info" | "error" | "success";
}

interface PickedMedia {
  uri: string;
  fileName: string;
  mimeType: string;
  size: number;
}

const initialModal: ModalState = {
  visible: false,
  title: "",
  message: "",
  tone: "info",
};

function formatSeconds(durationMillis: number): string {
  const total = Math.floor(durationMillis / 1000);
  const minute = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const second = (total % 60).toString().padStart(2, "0");
  return `${minute}:${second}`;
}

function buildMedia(filenamePrefix: string, uri: string, mimeType: string, size?: number): PickedMedia {
  const extension = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : mimeType.includes("webm")
        ? "webm"
        : mimeType.includes("quicktime")
          ? "mov"
          : mimeType.includes("audio/mp4")
            ? "m4a"
            : mimeType.includes("mp4")
              ? "mp4"
              : mimeType.includes("mpeg")
                ? "mp3"
                : mimeType.includes("wav")
                  ? "wav"
                  : mimeType.includes("m4a")
                    ? "m4a"
                    : "jpg";

  return {
    uri,
    mimeType,
    size: size ?? 512 * 1024,
    fileName: `${filenamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${extension}`,
  };
}

function normalizeUploadMimeType(mimeType: string): string {
  const normalized = mimeType.split(";")[0].trim().toLowerCase();
  if (normalized === "audio/m4a") return "audio/x-m4a";
  if (normalized === "image/jpg") return "image/jpeg";
  if (normalized === "audio/x-wav") return "audio/wav";
  return normalized;
}

function extensionFromMimeType(mimeType: string): string {
  const normalized = normalizeUploadMimeType(mimeType);
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("webm")) return "webm";
  if (normalized.includes("quicktime")) return "mov";
  if (normalized.startsWith("audio/mp4")) return "m4a";
  if (normalized.includes("mp4")) return "mp4";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("wav")) return "wav";
  if (normalized.includes("m4a")) return "m4a";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  return "bin";
}

function ensureFileNameExtension(fileName: string, mimeType: string): string {
  const extension = extensionFromMimeType(mimeType);
  const lastDot = fileName.lastIndexOf(".");
  const stem = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  return `${stem}.${extension}`;
}

export default function SeekerCreateScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [text, setText] = useState("");
  const [images, setImages] = useState<PickedMedia[]>([]);
  const [videos, setVideos] = useState<PickedMedia[]>([]);
  const [audioFile, setAudioFile] = useState<PickedMedia | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(initialModal);

  useEffect(() => {
    if (!recording) {
      setRecordingSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [recording]);

  const closeModal = () => setModal(initialModal);

  const showModal = (
    tone: "info" | "error" | "success",
    title: string,
    message: string
  ) => {
    setModal({ visible: true, tone, title, message });
    announce(`${title}。${message}`);
  };

  const hasContent = useMemo(
    () => Boolean(text.trim() || images.length > 0 || videos.length > 0 || audioFile),
    [audioFile, images.length, text, videos.length]
  );

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      trigger("warning");
      showModal("info", "需要相册权限", "请先允许访问相册，才能上传图片。");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.82,
      selectionLimit: 3,
    });

    if (result.canceled) return;

    const next = result.assets
      .slice(0, 3)
      .map((asset) =>
        buildMedia(
          "image",
          asset.uri,
          asset.mimeType || "image/jpeg",
          asset.fileSize
        )
      );

    setImages(next);
    trigger("light");
  };

  const captureImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      trigger("warning");
      showModal("info", "需要相机权限", "请先允许访问相机，才能拍照上传。");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setImages([
      buildMedia("camera", asset.uri, asset.mimeType || "image/jpeg", asset.fileSize),
    ]);
    trigger("light");
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      trigger("warning");
      showModal("info", "需要相册权限", "请先允许访问相册，才能选择视频。");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setVideos([
      buildMedia("video", asset.uri, asset.mimeType || "video/mp4", asset.fileSize),
    ]);
    trigger("light");
  };

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      trigger("warning");
      showModal("info", "需要麦克风权限", "请先允许使用麦克风，才能录制语音。");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(created.recording);
    setAudioFile(null);
    setAudioDuration(0);
    trigger("medium");
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    setRecording(null);

    if (!uri) return;

    const durationMillis =
      "durationMillis" in status && typeof status.durationMillis === "number"
        ? status.durationMillis
        : recordingSeconds * 1000;

    const recordedMimeType = Platform.OS === "web" ? "audio/webm" : "audio/mp4";
    setAudioFile(buildMedia("voice", uri, recordedMimeType));
    setAudioDuration(durationMillis);
    trigger("success");
  };

  const createUploadRecord = async (media: PickedMedia) => {
    const formData = new FormData();
    let uploadMimeType = normalizeUploadMimeType(media.mimeType);
    let uploadFileName = ensureFileNameExtension(media.fileName, uploadMimeType);
    let uploadSize = media.size;

    if (Platform.OS === "web") {
      const localResponse = await fetch(media.uri);
      const blob = await localResponse.blob();
      if (blob.type) {
        uploadMimeType = normalizeUploadMimeType(blob.type);
        uploadFileName = ensureFileNameExtension(uploadFileName, uploadMimeType);
      }
      uploadSize = blob.size;
      formData.append("content", blob, uploadFileName);
    } else {
      formData.append(
        "content",
        {
          uri: media.uri,
          name: uploadFileName,
          type: uploadMimeType,
        } as unknown as Blob
      );
    }

    const result = await api.post<UploadPresignResponse>("/uploads/presign", {
      filename: uploadFileName,
      mime_type: uploadMimeType,
      size: uploadSize,
    });

    const uploaded = await api.put<UploadContentResponse>(result.upload_url, formData);
    return uploaded.file_id;
  };

  const handleSubmit = async () => {
    if (!hasContent) {
      trigger("warning");
      showModal("info", "内容为空", "请至少输入文字或添加一种素材。");
      return;
    }

    if (!isAuthenticated) {
      showModal("info", "请先登录", "当前版本需要登录后才能发布真实求助。");
      return;
    }

    setLoading(true);
    try {
      const imageIds = await Promise.all(images.map(createUploadRecord));
      const videoIds = await Promise.all(videos.map(createUploadRecord));
      const voiceId = audioFile ? await createUploadRecord(audioFile) : undefined;

      const payload: HelpRequestCreate = { mode: "hall" };
      if (text.trim()) payload.text = text.trim();
      if (imageIds.length > 0) payload.image_file_ids = imageIds;
      if (videoIds.length > 0) payload.video_file_ids = videoIds;
      if (voiceId) {
        payload.voice_file_id = voiceId;
        payload.voice_file_ids = [voiceId];
      }

      await api.post("/help-requests", payload);
      trigger("success");
      showModal("success", "发布成功", "你的求助已发布到大厅，正在等待志愿者响应。");
    } catch {
      trigger("error");
      showModal("error", "发布失败", "网络异常或服务繁忙，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 px-4 pt-3">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 12, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 280 }}
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
              <Text className="text-accessible-lg font-semibold text-slate-900">发布求助</Text>
              <Text className="mt-2 text-sm leading-6 text-slate-600">
                支持文字、图片、视频和语音。信息越完整，志愿者响应越快。
              </Text>

              <View className="mt-4 flex-row flex-wrap gap-2">
                <Text className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                  最多 3 张图片
                </Text>
                <Text className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                  最多 1 个视频
                </Text>
                <Text className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                  语音优先识别
                </Text>
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 320, delay: 60 }}
          >
            <GlassCard tone="light" className="border-slate-200/80" contentClassName="p-5">
              <AccessibleInput
                label="求助内容"
                placeholder="例如：请帮我识别药盒上的用法和剂量，顺便确认窗口位置。"
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={5}
                labelClassName="text-slate-800"
                inputClassName="min-h-[120px] border-slate-200 bg-white text-slate-900"
                textAlignVertical="top"
              />

              <View className="gap-2">
                <View className="flex-row gap-2">
                  <AccessibleButton
                    title="选择图片"
                    variant="secondary"
                    className="flex-1 border border-slate-200 bg-white"
                    onPress={pickImages}
                  />
                  <AccessibleButton
                    title="拍照上传"
                    variant="secondary"
                    className="flex-1 border border-slate-200 bg-white"
                    onPress={captureImage}
                  />
                </View>

                <View className="flex-row gap-2">
                  <AccessibleButton
                    title="选择视频"
                    variant="secondary"
                    className="flex-1 border border-slate-200 bg-white"
                    onPress={pickVideo}
                  />
                  {recording ? (
                    <AccessibleButton
                      title="结束录音"
                      variant="danger"
                      className="flex-1"
                      onPress={stopRecording}
                    />
                  ) : (
                    <AccessibleButton
                      title="开始录音"
                      variant="secondary"
                      className="flex-1 border border-slate-200 bg-white"
                      onPress={startRecording}
                    />
                  )}
                </View>
              </View>

              {recording ? (
                <View className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                  <Text className="text-sm font-semibold text-cyan-800">录音中</Text>
                  <Text className="mt-1 text-xs text-cyan-700">时长 {formatSeconds(recordingSeconds * 1000)}</Text>
                </View>
              ) : null}
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 22 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 340, delay: 100 }}
          >
            <GlassCard tone="light" className="border-slate-200/80" contentClassName="p-5">
              <Text className="text-accessible-base font-semibold text-slate-900">已添加素材</Text>

              {images.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {images.map((item) => (
                    <View key={item.uri} className="relative">
                      <Image source={{ uri: item.uri }} className="h-20 w-20 rounded-xl" />
                      <Pressable
                        onPress={() => setImages((prev) => prev.filter((entry) => entry.uri !== item.uri))}
                        className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-slate-900/70"
                      >
                        <Text className="text-xs text-white">×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              {videos.length > 0 ? (
                <View className="mt-3 gap-2">
                  {videos.map((item) => (
                    <View
                      key={item.uri}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <Text className="text-sm text-slate-700">视频：{item.fileName}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {audioFile ? (
                <View className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3">
                  <Text className="text-sm font-semibold text-cyan-800">语音已录制</Text>
                  <Text className="mt-1 text-xs text-cyan-700">时长 {formatSeconds(audioDuration)}</Text>
                  <View className="mt-2 flex-row items-end gap-1">
                    {[10, 16, 12, 18, 14, 17, 11, 15].map((height, index) => (
                      <View
                        // eslint-disable-next-line react/no-array-index-key
                        key={`${height}-${index}`}
                        className="w-1 rounded-full bg-cyan-500"
                        style={{ height }}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {!images.length && !videos.length && !audioFile ? (
                <Text className="mt-3 text-sm text-slate-500">还没有添加素材，建议至少补充一段语音或一张图片。</Text>
              ) : null}
            </GlassCard>
          </MotiView>

          <View className="gap-3">
            <AccessibleButton
              title="发布求助"
              loading={loading}
              disabled={!hasContent}
              onPress={handleSubmit}
            />
            <AccessibleButton
              title="返回大厅"
              variant="ghost"
              className="border border-slate-200 bg-white/90"
              onPress={() => router.replace("/(seeker)/hall")}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <FeedbackModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        tone={modal.tone}
        onClose={closeModal}
        primaryAction={{
          label: modal.tone === "success" ? "回到大厅" : "我知道了",
          onPress: () => {
            closeModal();
            if (modal.tone === "success") {
              router.replace("/(seeker)/hall");
            }
          },
        }}
      />
    </GlassBackground>
  );
}
