/**
 * Seeker tab layout — bottom tabs for hall, create, messages, profile.
 */

import { Tabs } from "expo-router";
import { Text } from "react-native";

import {
  NAV_HEADER_STYLE,
  NAV_HEADER_TINT_COLOR,
  NAV_HEADER_TITLE_STYLE,
} from "@/lib/theme";

export default function SeekerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: NAV_HEADER_STYLE,
        headerTintColor: NAV_HEADER_TINT_COLOR,
        headerTitleStyle: NAV_HEADER_TITLE_STYLE,
        tabBarStyle: { minHeight: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      <Tabs.Screen
        name="hall"
        options={{
          title: "求助大厅",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
          ),
          tabBarAccessibilityLabel: "求助大厅",
          headerTitle: "我的求助",
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "发布求助",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🎙️</Text>
          ),
          tabBarAccessibilityLabel: "发布新求助",
          headerTitle: "发布求助",
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "消息",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>💬</Text>
          ),
          tabBarAccessibilityLabel: "消息列表",
          headerTitle: "消息",
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "我的",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
          tabBarAccessibilityLabel: "个人中心",
          headerTitle: "个人中心",
        }}
      />
    </Tabs>
  );
}
