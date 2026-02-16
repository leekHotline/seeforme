/**
 * App index — redirects to the appropriate screen based on auth state.
 */

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/welcome" />;
  }

  if (role === "seeker") {
    return <Redirect href="/(seeker)/hall" />;
  }

  return <Redirect href="/(volunteer)/hall" />;
}
