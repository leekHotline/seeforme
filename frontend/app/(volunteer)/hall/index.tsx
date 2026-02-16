/**
 * Volunteer Hall list — browse open help requests to claim.
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

export default function VolunteerHallScreen() {
  const router = useRouter();
  const { announce } = useAnnounce();

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<HelpRequest[]>("/help-requests/hall");
      setRequests(data);
      announce(`大厅共${data.length}条求助`);
    } catch {
      announce("加载失败，请下拉刷新");
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
      onPress={() => router.push(`/(volunteer)/hall/${item.id}`)}
      accessibilityLabel={`求助请求，状态${item.status}，点击查看详情并接单`}
      className="bg-white rounded-2xl p-5 mb-3 border border-gray-100"
    >
      <View className="flex-row items-center justify-between mb-2">
        <StatusBadge status={item.status} />
        <Text className="text-sm text-gray-400">
          {new Date(item.created_at).toLocaleDateString("zh-CN")}
        </Text>
      </View>
      <Text className="text-accessible-base text-gray-900" numberOfLines={2}>
        {item.transcribed_text || item.raw_text || "语音求助（点击查看）"}
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
            <Text className="text-6xl mb-4">🕐</Text>
            <Text className="text-accessible-base text-gray-500">
              暂无求助请求
            </Text>
            <Text className="text-accessible-sm text-gray-400 mt-1">
              下拉刷新查看最新求助
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
