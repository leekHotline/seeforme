/**
 * Shared bottom-tab visual options for seeker/volunteer layouts.
 * Keeps icon-label spacing consistent and avoids label baseline clipping.
 */

import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

export const sharedTabScreenOptions: BottomTabNavigationOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#0F172A",
  headerTitleStyle: { fontWeight: "700", color: "#0F172A" },
  tabBarStyle: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E2E8F0",
    minHeight: 94,
    height: 94,
    paddingTop: 6,
    paddingBottom: 13,
    overflow: "visible",
  },
  tabBarItemStyle: {
    paddingTop: 2,
    paddingBottom: 8,
    overflow: "visible",
  },
  tabBarIconStyle: {
    marginTop: 0,
    marginBottom: 3,
    overflow: "visible",
  },
  tabBarLabelStyle: {
    width: 52,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 4,
    top: -1,
    includeFontPadding: true,
  },
  tabBarLabelPosition: "below-icon",
  tabBarAllowFontScaling: false,
  tabBarActiveTintColor: "#0F172A",
  tabBarInactiveTintColor: "#475569",
  tabBarHideOnKeyboard: true,
};
