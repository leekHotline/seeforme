/**
 * Registration screen — creates a new account with the chosen role.
 */

import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import AccessibleInput from "@/components/AccessibleInput";
import { useAuth } from "@/lib/auth";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import type { UserRole } from "@/lib/types";
import { ApiError } from "@/lib/api";

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const router = useRouter();
  const { register } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.includes("@")) errs.email = "请输入有效的邮箱地址";
    if (password.length < 6) errs.password = "密码至少需要6位";
    if (password !== confirmPassword)
      errs.confirmPassword = "两次密码输入不一致";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      trigger("error");
      announce("请检查输入信息");
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, role: role as UserRole });
      trigger("success");
      announce("注册成功");
    } catch (e) {
      trigger("error");
      if (e instanceof ApiError && e.status === 409) {
        announce("该邮箱已被注册");
        Alert.alert("注册失败", "该邮箱已被注册");
      } else {
        announce("注册失败，请稍后重试");
        Alert.alert("注册失败", "请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-8" keyboardShouldPersistTaps="handled">
        <Text
          className="text-accessible-xl font-bold text-gray-900 text-center mb-2"
          accessibilityRole="header"
        >
          创建账号
        </Text>
        <Text className="text-accessible-sm text-gray-500 text-center mb-8">
          {role === "seeker" ? "求助者" : "志愿者"}注册
        </Text>

        <AccessibleInput
          label="邮箱"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <AccessibleInput
          label="密码"
          placeholder="至少6位"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <AccessibleInput
          label="确认密码"
          placeholder="再次输入密码"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <View className="mt-4 gap-4">
          <AccessibleButton
            title="注册"
            loading={loading}
            onPress={handleRegister}
          />
          <AccessibleButton
            title="已有账号？去登录"
            variant="ghost"
            onPress={() => router.replace("/(public)/login")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
