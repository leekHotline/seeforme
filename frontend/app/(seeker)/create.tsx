/**
 * Seeker create request screen with media capture/upload actions.
 */

import React, { useMemo, useState } from "react";
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
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function buildMedia(filenamePrefix: string, uri: string, mimeType: string, size?: number): PickedMedia {
  const extension = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : mimeType.includes("quicktime")
        ? "mov"
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
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(initialModal);

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
    () =>
      Boolean(
        text.trim() ||
          images.length > 0 ||
          videos.length > 0 ||
          audioFile
      ),
    [audioFile, images.length, text, videos.length]
  );

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      trigger("warning");
      showModal("info", "权限被拒绝", "请先允许访问相册。");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
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
      showModal("info", "权限被拒绝", "请先允许访问相机。");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
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
      showModal("info", "权限被拒绝", "请先允许访问相册。");
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
      buildMedia(
        "video",
        asset.uri,
        asset.mimeType || "video/mp4",
        asset.fileSize
      ),
    ]);
    trigger("light");
  };

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      trigger("warning");
      showModal("info", "权限被拒绝", "请先允许访问麦克风。");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const created = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(created.recording);
    trigger("medium");
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    setRecording(null);

    if (uri) {
      const durationMillis =
        "durationMillis" in status && typeof status.durationMillis === "number"
          ? status.durationMillis
          : 0;
      setAudioFile(
        buildMedia("voice", uri, "audio/x-m4a")
      );
      setAudioDuration(durationMillis);
      trigger("success");
    }
  };

  const createUploadRecord = async (media: PickedMedia) => {
    const result = await api.post<UploadPresignResponse>("/uploads/presign", {
      filename: media.fileName,
      mime_type: media.mimeType,
      size: media.size,
    });

    const formData = new FormData();
    if (Platform.OS === "web") {
      const localResponse = await fetch(media.uri);
      const blob = await localResponse.blob();
      formData.append("content", blob, media.fileName);
    } else {
      formData.append("content", {
        uri: media.uri,
        name: media.fileName,
        type: media.mimeType,
      } as unknown as Blob);
    }

    const uploaded = await api.put<UploadContentResponse>(result.upload_url, formData);
    return uploaded.file_id;
  };

  const handleSubmit = async () => {
    if (!hasContent) {
      trigger("warning");
      showModal("info", "内容为空", "请至少填写文字或添加一种媒体。");
      return;
    }

    if (!isAuthenticated) {
      showModal("info", "请先登录", "当前版本已关闭游客发布，请先登录。");
      return;
    }

    setLoading(true);
    try {
      const imageIds = await Promise.all(images.map(createUploadRecord));
      const videoIds = await Promise.all(videos.map(createUploadRecord));
      const voiceId = audioFile ? await createUploadRecord(audioFile) : undefined;

      const payload: HelpRequestCreate = {
        mode: "hall",
      };
      if (text.trim()) payload.text = text.trim();
      if (imageIds.length > 0) payload.image_file_ids = imageIds;
      if (videoIds.length > 0) payload.video_file_ids = videoIds;
      if (voiceId) {
        payload.voice_file_id = voiceId;
        payload.voice_file_ids = [voiceId];
      }

      await api.post("/help-requests", payload);
      trigger("success");
      showModal("success", "发布成功", "求助已进入大厅，正在等待志愿者响应。");
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
        >
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360 }}
          >
            <GlassCard contentClassName="p-6">
              <Text className="text-accessible-lg font-semibold text-white">发布求助</Text>
              <Text className="mt-2 text-accessible-sm text-slate-200">
                支持文字、图片、视频与语音。你也可以直接调用相机和麦克风输入。
              </Text>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 22 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 380, delay: 90 }}
          >
            <GlassCard contentClassName="p-6">
              <AccessibleInput
                label="求助内容"
                placeholder="例如：请帮我识别药盒上的用法与剂量"
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={5}
                labelClassName="text-slate-100"
                inputClassName="min-h-[120px] bg-white/95 text-slate-950"
                textAlignVertical="top"
              />

              <View className="mt-2 gap-3">
                <AccessibleButton title="从相册选择图片" variant="secondary" onPress={pickImages} />
                <AccessibleButton title="拍照上传" variant="secondary" onPress={captureImage} />
                <AccessibleButton title="选择视频" variant="secondary" onPress={pickVideo} />
                {recording ? (
                  <AccessibleButton title="停止录音" variant="danger" onPress={stopRecording} />
                ) : (
                  <AccessibleButton title="开始录音" variant="secondary" onPress={startRecording} />
                )}
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 26 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 130 }}
          >
            <GlassCard contentClassName="p-5">
              <Text className="text-accessible-sm font-semibold text-slate-100">已选择内容</Text>

              {images.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {images.map((item) => (
                    <View key={item.uri} className="relative">
                      <Image source={{ uri: item.uri }} className="h-20 w-20 rounded-xl" />
                      <Pressable
                        onPress={() =>
                          setImages((prev) => prev.filter((entry) => entry.uri !== item.uri))
                        }
                        className="absolute -right-1 -top-1 rounded-full bg-slate-950/70 px-1.5 py-0.5"
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
                      className="rounded-xl border border-white/20 bg-white/10 px-3 py-2"
                    >
                      <Text className="text-sm text-slate-100">视频: {item.fileName}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {audioFile ? (
                <View className="mt-3 rounded-xl border border-cyan-300/40 bg-cyan-200/15 px-3 py-2">
                  <Text className="text-sm font-medium text-cyan-100">
                    语音已录制 · 时长 {formatSeconds(audioDuration)}
                  </Text>
                </View>
              ) : null}

              {!images.length && !videos.length && !audioFile ? (
                <Text className="mt-3 text-sm text-slate-300">尚未添加媒体文件。</Text>
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
