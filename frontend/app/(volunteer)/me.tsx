/**
 * Volunteer Profile — personal info and availability settings.
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AccessibleButton from "@/components/AccessibleButton";
import { useAuth } from "@/lib/auth";
import { useAnnounce, useHaptic } from "@/lib/accessibility";

export default function VolunteerProfileScreen() {
  const { user, logout } = useAuth();
  const { announce } = useAnnounce();
  const { trigger } = useHaptic();

  const [isAvailable, setIsAvailable] = useState(true);

  const toggleAvailability = (value: boolean) => {
    setIsAvailable(value);
    trigger("medium");
    announce(value ? "已设为可接单状态" : "已暂停接单");
  };

  const handleLogout = async () => {
    await logout();
    trigger("success");
    announce("已退出登录");
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-4">
        {/* Profile card */}
        <View className="bg-white rounded-2xl p-5 mb-6">
          <Text className="text-accessible-lg font-bold text-gray-900">
            {user?.email || user?.phone || "志愿者"}
          </Text>
          <Text className="text-accessible-sm text-primary-600 mt-1">
            志愿者
          </Text>
        </View>

        {/* Availability */}
        <Text
          className="text-accessible-base font-bold text-gray-900 mb-3"
          accessibilityRole="header"
        >
          接单状态
        </Text>

        <View className="bg-white rounded-2xl p-5 mb-6">
          <View className="flex-row items-center justify-between min-h-touch">
            <View>
              <Text className="text-accessible-sm text-gray-900">
                {isAvailable ? "🟢 可接单" : "🔴 暂停接单"}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                {isAvailable ? "你会收到新的求助通知" : "你不会收到新的求助通知"}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              accessibilityLabel="接单状态开关"
            />
          </View>
        </View>

        {/* Stats placeholder */}
        <Text
          className="text-accessible-base font-bold text-gray-900 mb-3"
          accessibilityRole="header"
        >
          我的贡献
        </Text>

        <View className="bg-white rounded-2xl p-5 mb-6 flex-row justify-around">
          <View className="items-center">
            <Text className="text-accessible-xl font-bold text-primary-600">
              0
            </Text>
            <Text className="text-sm text-gray-500">已帮助</Text>
          </View>
          <View className="items-center">
            <Text className="text-accessible-xl font-bold text-success">
              0
            </Text>
            <Text className="text-sm text-gray-500">已解决</Text>
          </View>
        </View>

        {/* Logout */}
        <AccessibleButton
          title="退出登录"
          variant="danger"
          announceText="退出登录"
          onPress={handleLogout}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
