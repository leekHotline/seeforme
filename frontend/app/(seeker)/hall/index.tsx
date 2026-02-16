/**
 * Seeker Hall list — shows the seeker's own help requests.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import StatusBadge from "@/components/StatusBadge";
import { useAnnounce } from "@/lib/accessibility";
import { api } from "@/lib/api";
import type { HelpRequest } from "@/lib/types";

export default function SeekerHallScreen() {
  const router = useRouter();
  const { announce } = useAnnounce();

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      // Seeker sees their own requests via the hall endpoint
      // (backend filters by role automatically)
      const data = await api.get<HelpRequest[]>("/help-requests/hall");
      setRequests(data);
    } catch {
      announce("加载失败，请下拉刷新重试");
    }
  }, [announce]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: HelpRequest }) => (
    <Pressable
      onPress={() => router.push(`/(seeker)/hall/${item.id}`)}
      accessibilityLabel={`求助请求，状态${item.status}，点击查看详情`}
      className="bg-white rounded-2xl p-5 mb-3 border border-gray-100"
    >
      <View className="flex-row items-center justify-between mb-2">
        <StatusBadge status={item.status} />
        <Text className="text-sm text-gray-400">
          {new Date(item.created_at).toLocaleDateString("zh-CN")}
        </Text>
      </View>
      <Text className="text-accessible-base text-gray-900" numberOfLines={2}>
        {item.transcribed_text || item.raw_text || "语音求助"}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-6xl mb-4">📭</Text>
            <Text className="text-accessible-base text-gray-500">
              还没有求助记录
            </Text>
            <Text className="text-accessible-sm text-gray-400 mt-1">
              点击底部"发布求助"开始
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
