/**
 * Legacy welcome route redirected to unified auth page.
 */

import { Redirect } from "expo-router";

export default function WelcomeScreen() {
  return <Redirect href="/(public)/login" />;
}

