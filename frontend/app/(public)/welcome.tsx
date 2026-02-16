/**
 * Welcome screen — first screen for new / unauthenticated users.
 */

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import { useAnnounce } from "@/lib/accessibility";

export default function WelcomeScreen() {
  const router = useRouter();
  const { announce } = useAnnounce();

  useEffect(() => {
    announce("欢迎来到为你所见。请选择开始使用。");
  }, [announce]);

  return (
    <SafeAreaView className="flex-1 bg-primary-800">
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo area */}
        <View className="mb-12 items-center">
          <Text className="text-6xl mb-4">👁️</Text>
          <Text
            className="text-accessible-xl font-bold text-white text-center"
            accessibilityRole="header"
          >
            为你所见
          </Text>
          <Text className="text-accessible-base text-primary-200 text-center mt-2">
            SeeForMe — 让每个人看见世界
          </Text>
        </View>

        {/* Description */}
        <Text className="text-accessible-sm text-primary-100 text-center mb-12 leading-7">
          面向视障人群的公益协作平台{"\n"}
          语音发布需求，志愿者即时响应
        </Text>

        {/* CTA */}
        <View className="w-full gap-4">
          <AccessibleButton
            title="开始使用"
            announceText="开始使用，前往角色选择"
            variant="secondary"
            onPress={() => router.push("/(public)/role-select")}
          />
          <AccessibleButton
            title="已有账号？登录"
            announceText="前往登录页"
            variant="ghost"
            textClassName="text-white"
            onPress={() => router.push("/(public)/login")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
