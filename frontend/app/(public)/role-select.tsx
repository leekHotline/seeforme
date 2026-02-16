/**
 * Role selection screen — user picks seeker or volunteer before registration.
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import AccessibleButton from "@/components/AccessibleButton";
import { useAnnounce, useHaptic } from "@/lib/accessibility";
import type { UserRole } from "@/lib/types";

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
    trigger("medium");
    announce(role === "seeker" ? "已选择求助者" : "已选择志愿者");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12">
        <Text
          className="text-accessible-xl font-bold text-gray-900 text-center mb-4"
          accessibilityRole="header"
        >
          选择你的角色
        </Text>
        <Text className="text-accessible-sm text-gray-500 text-center mb-10">
          注册后角色不可更改
        </Text>

        <View className="gap-4 mb-12">
          {/* Seeker card */}
          <Pressable
            onPress={() => selectRole("seeker")}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedRole === "seeker" }}
            accessibilityLabel="求助者：我需要帮助看清事物"
            className={`
              min-h-touch rounded-2xl border-2 p-6
              ${selectedRole === "seeker" ? "border-primary-600 bg-primary-50" : "border-gray-200 bg-white"}
            `}
          >
            <Text className="text-4xl mb-3">🙋</Text>
            <Text className="text-accessible-lg font-bold text-gray-900">
              求助者
            </Text>
            <Text className="text-accessible-sm text-gray-500 mt-1">
              我需要帮助看清事物
            </Text>
          </Pressable>

          {/* Volunteer card */}
          <Pressable
            onPress={() => selectRole("volunteer")}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedRole === "volunteer" }}
            accessibilityLabel="志愿者：我愿意帮助他人"
            className={`
              min-h-touch rounded-2xl border-2 p-6
              ${selectedRole === "volunteer" ? "border-primary-600 bg-primary-50" : "border-gray-200 bg-white"}
            `}
          >
            <Text className="text-4xl mb-3">🤝</Text>
            <Text className="text-accessible-lg font-bold text-gray-900">
              志愿者
            </Text>
            <Text className="text-accessible-sm text-gray-500 mt-1">
              我愿意帮助他人看清世界
            </Text>
          </Pressable>
        </View>

        <AccessibleButton
          title="下一步"
          disabled={!selectedRole}
          announceText="前往注册页"
          onPress={() =>
            router.push({
              pathname: "/(public)/register",
              params: { role: selectedRole! },
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}
