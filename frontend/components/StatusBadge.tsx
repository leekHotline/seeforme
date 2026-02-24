/**
 * Status badge for help request status.
 */

import React from "react";
import { Text, View } from "react-native";

import type { RequestStatus } from "@/lib/types";

const statusConfig: Record<
  RequestStatus,
  { badge: string; text: string; label: string }
> = {
  open: {
    badge: "bg-cyan-50 border border-cyan-200",
    text: "text-cyan-700",
    label: "待接单",
  },
  claimed: {
    badge: "bg-amber-50 border border-amber-200",
    text: "text-amber-700",
    label: "已接单",
  },
  replied: {
    badge: "bg-violet-50 border border-violet-200",
    text: "text-violet-700",
    label: "已回复",
  },
  resolved: {
    badge: "bg-emerald-50 border border-emerald-200",
    text: "text-emerald-700",
    label: "已解决",
  },
  unresolved: {
    badge: "bg-rose-50 border border-rose-200",
    text: "text-rose-700",
    label: "未解决",
  },
  cancelled: {
    badge: "bg-slate-100 border border-slate-200",
    text: "text-slate-600",
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
      className={`rounded-full px-3 py-1 ${config.badge}`}
      accessibilityLabel={`状态：${config.label}`}
    >
      <Text className={`text-sm font-semibold ${config.text}`}>{config.label}</Text>
    </View>
  );
}
