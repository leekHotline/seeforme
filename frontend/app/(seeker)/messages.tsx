/**
 * Seeker Messages — placeholder for messaging threads.
 */

import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SeekerMessagesScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-5xl mb-4">💬</Text>
        <Text className="text-accessible-lg font-bold text-gray-900 text-center">
          消息功能
        </Text>
        <Text className="text-accessible-sm text-gray-500 text-center mt-2">
          消息通知功能即将上线
        </Text>
      </View>
    </SafeAreaView>
  );
}
