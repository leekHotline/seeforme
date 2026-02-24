/**
 * Legacy role-select route redirected to unified auth page.
 */

import { Redirect, useLocalSearchParams } from "expo-router";

import type { UserRole } from "@/lib/types";

export default function RoleSelectScreen() {
  const { role } = useLocalSearchParams<{ role?: UserRole }>();
  const resolvedRole = role === "volunteer" ? "volunteer" : "seeker";

  return (
    <Redirect
      href={{
        pathname: "/(public)/login",
        params: { mode: "register", role: resolvedRole },
      }}
    />
  );
}

