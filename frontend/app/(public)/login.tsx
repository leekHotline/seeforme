/**
 * Unified auth screen: role select + login/register.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";

import AccessibleButton from "@/components/AccessibleButton";
import AccessibleInput from "@/components/AccessibleInput";
import FeedbackModal from "@/components/FeedbackModal";
import GlassBackground from "@/components/GlassBackground";
import GlassCard from "@/components/GlassCard";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

type AuthMode = "login" | "register";

type ModalState = {
  visible: boolean;
  title: string;
  message: string;
  tone: "error" | "success" | "info";
};

const roleMeta: Record<UserRole, { title: string; desc: string; icon: string }> = {
  seeker: {
    title: "求助者",
    desc: "发布求助并接收帮助",
    icon: "S",
  },
  volunteer: {
    title: "志愿者",
    desc: "接单协助并快速响应",
    icon: "V",
  },
};

const initialModal: ModalState = {
  visible: false,
  title: "",
  message: "",
  tone: "info",
};

export default function LoginScreen() {
  const { role: initialRole, mode: initialMode } = useLocalSearchParams<{
    role?: UserRole;
    mode?: string;
  }>();
  const { login, register } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [role, setRole] = useState<UserRole>("seeker");
  const [mode, setMode] = useState<AuthMode>("login");
  const [account, setAccount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(initialModal);

  useEffect(() => {
    if (initialRole === "volunteer" || initialRole === "seeker") {
      setRole(initialRole);
    }
    if (initialMode === "register") {
      setMode("register");
    }
  }, [initialMode, initialRole]);

  const closeModal = () => setModal(initialModal);

  const showModal = (
    tone: "error" | "success" | "info",
    title: string,
    message: string
  ) => {
    setModal({ visible: true, tone, title, message });
    announce(`${title}。${message}`);
  };

  const canSubmit = useMemo(() => {
    if (mode === "login") {
      return account.trim().length > 0 && password.trim().length > 0;
    }
    return (
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      confirmPassword.trim().length > 0
    );
  }, [account, confirmPassword, email, mode, password]);

  const validateRegister = (): string | null => {
    if (!email.includes("@")) {
      return "请输入有效邮箱地址。";
    }
    if (password.length < 6) {
      return "密码至少 6 位。";
    }
    if (confirmPassword !== password) {
      return "两次密码输入不一致。";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      trigger("warning");
      showModal("info", "信息不完整", "请先补全账号信息。");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login({ account: account.trim(), password });
        trigger("success");
        showModal("success", "登录成功", "正在进入你的工作区。");
      } else {
        const registerError = validateRegister();
        if (registerError) {
          trigger("warning");
          showModal("info", "注册信息有误", registerError);
          return;
        }

        await register({
          email: email.trim(),
          password,
          role,
        });
        trigger("success");
        showModal("success", "注册成功", "账号已创建，正在进入工作区。");
      }
    } catch (error) {
      trigger("error");
      if (error instanceof ApiError) {
        if (error.status === 401) {
          showModal("error", "登录失败", "账号或密码错误，请重试。");
          return;
        }
        if (error.status === 409) {
          showModal("error", "注册失败", "该邮箱已被注册，请直接登录。");
          return;
        }
      }
      showModal("error", "请求失败", "网络异常或服务繁忙，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 px-4 pt-3">
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 420 }}
        >
          <GlassCard contentClassName="p-6">
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-cyan-200/90">
              SeeForMe Access
            </Text>
            <Text className="mt-3 text-accessible-lg font-semibold text-white">
              {mode === "login" ? "欢迎回来" : "创建账号"}
            </Text>
            <Text className="mt-2 text-accessible-sm text-slate-200">
              先选择角色，再{mode === "login" ? "登录" : "注册"}进入系统。
            </Text>
          </GlassCard>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 22 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 430, delay: 90 }}
        >
          <GlassCard className="mt-3" contentClassName="p-5">
            <Text className="text-accessible-sm font-semibold text-slate-100">身份</Text>
            <View className="mt-3 flex-row gap-2">
              {(["seeker", "volunteer"] as UserRole[]).map((item) => {
                const selected = role === item;
                const meta = roleMeta[item];
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setRole(item);
                      trigger("light");
                    }}
                    className="flex-1"
                    accessibilityRole="radio"
                    accessibilityLabel={meta.title}
                    accessibilityState={{ selected }}
                  >
                    <MotiView
                      animate={{ scale: selected ? 1.02 : 1 }}
                      transition={{ type: "timing", duration: 160 }}
                    >
                      <View
                        className={`rounded-2xl border px-3 py-4 ${
                          selected
                            ? "border-cyan-300/90 bg-cyan-300/15"
                            : "border-white/20 bg-white/5"
                        }`}
                      >
                        <Text className="text-base font-semibold text-white">{meta.title}</Text>
                        <Text className="mt-1 text-xs text-slate-300">{meta.desc}</Text>
                      </View>
                    </MotiView>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 26 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 440, delay: 160 }}
        >
          <GlassCard className="mt-3" contentClassName="p-6">
            <View className="mb-4 flex-row rounded-2xl bg-slate-900/45 p-1">
              <Pressable
                className={`flex-1 rounded-xl px-4 py-2.5 ${
                  mode === "login" ? "bg-white/90" : "bg-transparent"
                }`}
                onPress={() => setMode("login")}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    mode === "login" ? "text-slate-900" : "text-slate-200"
                  }`}
                >
                  登录
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-xl px-4 py-2.5 ${
                  mode === "register" ? "bg-white/90" : "bg-transparent"
                }`}
                onPress={() => setMode("register")}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    mode === "register" ? "text-slate-900" : "text-slate-200"
                  }`}
                >
                  注册
                </Text>
              </Pressable>
            </View>

            <MotiView
              key={mode}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 220 }}
            >
              {mode === "login" ? (
                <>
                  <AccessibleInput
                    label="邮箱 / 手机号"
                    placeholder="name@example.com"
                    value={account}
                    onChangeText={setAccount}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    labelClassName="text-slate-100"
                    inputClassName="bg-white/95 text-slate-950"
                    returnKeyType="next"
                  />
                  <AccessibleInput
                    label="密码"
                    placeholder="请输入密码"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    labelClassName="text-slate-100"
                    inputClassName="bg-white/95 text-slate-950"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </>
              ) : (
                <>
                  <AccessibleInput
                    label="邮箱"
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    labelClassName="text-slate-100"
                    inputClassName="bg-white/95 text-slate-950"
                    returnKeyType="next"
                  />
                  <AccessibleInput
                    label="密码"
                    placeholder="至少6位"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    labelClassName="text-slate-100"
                    inputClassName="bg-white/95 text-slate-950"
                    returnKeyType="next"
                  />
                  <AccessibleInput
                    label="确认密码"
                    placeholder="再次输入密码"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    labelClassName="text-slate-100"
                    inputClassName="bg-white/95 text-slate-950"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </>
              )}
            </MotiView>

            <View className="mt-2 gap-3">
              <AccessibleButton
                title={mode === "login" ? "登录" : "创建账号"}
                loading={loading}
                disabled={!canSubmit}
                onPress={handleSubmit}
              />
              <AccessibleButton
                title={mode === "login" ? "去注册新账号" : "已有账号，去登录"}
                variant="ghost"
                onPress={() => setMode(mode === "login" ? "register" : "login")}
              />
            </View>
          </GlassCard>
        </MotiView>
      </SafeAreaView>

      <FeedbackModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        tone={modal.tone}
        onClose={closeModal}
        primaryAction={{ label: "我知道了", onPress: closeModal }}
      />
    </GlassBackground>
  );
}

