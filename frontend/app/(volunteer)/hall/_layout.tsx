/**
 * Volunteer Hall — stack navigator for browsing and claiming requests.
 */

import { Stack } from "expo-router";

export default function VolunteerHallLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[requestId]" />
    </Stack>
  );
}
