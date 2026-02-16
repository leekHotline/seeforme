/**
 * Seeker Hall — stack navigator for hall list + detail pages.
 */

import { Stack } from "expo-router";

export default function HallLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[requestId]" />
    </Stack>
  );
}
