/**
 * App index - routes user to auth or role workspace.
 */

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617",
        }}
      >
        <ActivityIndicator size="large" color="#67E8F9" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  if (role === "seeker") {
    return <Redirect href="/(seeker)/hall" />;
  }

  if (role === "volunteer") {
    return <Redirect href="/(volunteer)/hall" />;
  }

  return <Redirect href="/(public)/login" />;
}
