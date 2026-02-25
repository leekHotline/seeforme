/**
 * Status badge for help request status.
 */

import React from "react";
import { Text, View } from "react-native";

import type { RequestStatus } from "@/lib/types";

const statusConfig: Record<
  RequestStatus,
  { badge: string; text: string; dot: string; label: string }
> = {
  open: {
    badge: "bg-cyan-50 border border-cyan-200/80",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
    label: "待接单",
  },
  claimed: {
    badge: "bg-amber-50 border border-amber-200/80",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "已接单",
  },
  replied: {
    badge: "bg-violet-50 border border-violet-200/80",
    text: "text-violet-700",
    dot: "bg-violet-500",
    label: "已回复",
  },
  resolved: {
    badge: "bg-emerald-50 border border-emerald-200/80",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "已解决",
  },
  unresolved: {
    badge: "bg-rose-50 border border-rose-200/80",
    text: "text-rose-700",
    dot: "bg-rose-500",
    label: "未解决",
  },
  cancelled: {
    badge: "bg-slate-100 border border-slate-200/80",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "已取消",
  },
};

interface StatusBadgeProps {
  status: RequestStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${config.badge}`}
      accessibilityLabel={`状态：${config.label}`}
    >
      <View className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <Text className={`text-xs font-semibold ${config.text}`}>{config.label}</Text>
    </View>
  );
}
