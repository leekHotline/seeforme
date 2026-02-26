/**
 * Volunteer tab layout.
 */

import React, { useCallback, useState } from "react";
import { Tabs } from "expo-router";

import AnimatedTabIcon from "@/components/AnimatedTabIcon";

export default function VolunteerLayout() {
  const [pulses, setPulses] = useState<Record<string, number>>({});

  const bumpPulse = useCallback((name: string) => {
    setPulses((prev) => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f1f5f9",
        headerTitleStyle: { fontWeight: "700", color: "#f1f5f9" },
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          minHeight: 76,
          paddingTop: 6,
          paddingBottom: 12,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIconStyle: { marginTop: 1, marginBottom: 1 },
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "600",
          marginTop: 0,
          paddingBottom: 2,
        },
        tabBarLabelPosition: "below-icon",
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: "#06b6d4",
        tabBarInactiveTintColor: "#64748b",
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="hall"
        listeners={{ tabPress: () => bumpPulse("hall") }}
        options={{
          title: "大厅",
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="hall"
              focused={focused}
              pulseSeed={pulses.hall}
            />
          ),
          tabBarAccessibilityLabel: "求助大厅",
          headerTitle: "任务大厅",
        }}
      />
      <Tabs.Screen
        name="tasks"
        listeners={{ tabPress: () => bumpPulse("tasks") }}
        options={{
          title: "任务",
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="tasks"
              focused={focused}
              pulseSeed={pulses.tasks}
            />
          ),
          tabBarAccessibilityLabel: "我的任务",
          headerTitle: "我的任务",
        }}
      />
      <Tabs.Screen
        name="messages"
        listeners={{ tabPress: () => bumpPulse("messages") }}
        options={{
          title: "消息",
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="messages"
              focused={focused}
              pulseSeed={pulses.messages}
            />
          ),
          tabBarAccessibilityLabel: "消息",
          headerTitle: "消息",
        }}
      />
      <Tabs.Screen
        name="me"
        listeners={{ tabPress: () => bumpPulse("profile") }}
        options={{
          title: "我的",
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              name="profile"
              focused={focused}
              pulseSeed={pulses.profile}
            />
          ),
          tabBarAccessibilityLabel: "个人中心",
          headerTitle: "个人中心",
        }}
      />
    </Tabs>
  );
}
