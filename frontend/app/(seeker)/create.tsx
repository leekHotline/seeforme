/**
 * Seeker Create — voice-first help request creation.
 */

import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import AccessibleInput from "@/components/AccessibleInput";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { api } from "@/lib/api";

export default function SeekerCreateScreen() {
  const router = useRouter();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: Implement actual voice recording with expo-av
  // For MVP, we use a placeholder voice_file_id and text input
  const handleSubmit = async () => {
    if (!text.trim()) {
      trigger("error");
      announce("请输入或录制你的求助内容");
      return;
    }

    setLoading(true);
    try {
      await api.post("/help-requests", {
        voice_file_id: "placeholder-voice-id",
        text: text.trim(),
        mode: "hall",
      });
      trigger("success");
      announce("求助已发布，正在等待志愿者响应");
      router.replace("/(seeker)/hall");
    } catch {
      trigger("error");
      announce("发布失败，请稍后重试");
      Alert.alert("发布失败", "请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
        <Text
          className="text-accessible-lg font-bold text-gray-900 mb-2"
          accessibilityRole="header"
        >
          发布求助
        </Text>
        <Text className="text-accessible-sm text-gray-500 mb-6">
          描述你需要的帮助，志愿者会尽快响应
        </Text>

        {/* Voice recording placeholder */}
        <View className="bg-primary-50 rounded-2xl p-6 items-center mb-6">
          <Text className="text-5xl mb-3">🎙️</Text>
          <AccessibleButton
            title="按住录音"
            announceText="长按开始录音"
            variant="primary"
            className="w-full"
            onPress={() => announce("语音录制功能即将上线")}
          />
          <Text className="text-sm text-gray-400 mt-2">
            语音录制功能开发中，请先使用文字描述
          </Text>
        </View>

        {/* Text input */}
        <AccessibleInput
          label="文字描述（可选）"
          placeholder="描述你需要帮助看清的内容…"
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={4}
          className="min-h-[120px]"
        />

        {/* Image upload placeholder */}
        <View className="bg-gray-50 rounded-2xl p-5 items-center mb-6">
          <Text className="text-3xl mb-2">📷</Text>
          <Text className="text-accessible-sm text-gray-500">
            拍照或选择图片（最多3张）
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            图片上传功能开发中
          </Text>
        </View>

        <AccessibleButton
          title="发布求助"
          loading={loading}
          announceText="发布你的求助"
          onPress={handleSubmit}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
