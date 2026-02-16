/**
 * Login screen — email/phone + password.
 */

import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import AccessibleInput from "@/components/AccessibleInput";
import { useAuth } from "@/lib/auth";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!account || !password) {
      trigger("error");
      announce("请输入账号和密码");
      return;
    }

    setLoading(true);
    try {
      await login({ account, password });
      trigger("success");
      announce("登录成功");
    } catch (e) {
      trigger("error");
      if (e instanceof ApiError && e.status === 401) {
        announce("账号或密码错误");
        Alert.alert("登录失败", "账号或密码错误");
      } else {
        announce("登录失败，请稍后重试");
        Alert.alert("登录失败", "请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-12" keyboardShouldPersistTaps="handled">
        <Text
          className="text-accessible-xl font-bold text-gray-900 text-center mb-2"
          accessibilityRole="header"
        >
          欢迎回来
        </Text>
        <Text className="text-accessible-sm text-gray-500 text-center mb-10">
          登录你的 SeeForMe 账号
        </Text>

        <AccessibleInput
          label="邮箱或手机号"
          placeholder="your@email.com"
          value={account}
          onChangeText={setAccount}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AccessibleInput
          label="密码"
          placeholder="输入密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View className="mt-4 gap-4">
          <AccessibleButton
            title="登录"
            loading={loading}
            onPress={handleLogin}
          />
          <AccessibleButton
            title="没有账号？去注册"
            variant="ghost"
            onPress={() => router.replace("/(public)/role-select")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
