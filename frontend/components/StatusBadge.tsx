/**
 * Status badge for help request status.
 */

import React from "react";
import { View, Text } from "react-native";
import type { RequestStatus } from "@/lib/types";

const statusConfig: Record<
  RequestStatus,
  { bg: string; text: string; label: string }
> = {
  open: { bg: "bg-blue-100", text: "text-blue-800", label: "等待接单" },
  claimed: { bg: "bg-yellow-100", text: "text-yellow-800", label: "已接单" },
  replied: { bg: "bg-purple-100", text: "text-purple-800", label: "已回复" },
  resolved: { bg: "bg-green-100", text: "text-green-800", label: "已解决" },
  unresolved: { bg: "bg-red-100", text: "text-red-800", label: "未解决" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600", label: "已取消" },
};

interface StatusBadgeProps {
  status: RequestStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <View
      className={`rounded-full px-3 py-1 ${config.bg}`}
      accessibilityLabel={`状态：${config.label}`}
    >
      <Text className={`text-sm font-semibold ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
