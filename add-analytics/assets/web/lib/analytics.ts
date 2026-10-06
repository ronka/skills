"use client";

import posthog from "posthog-js";

type AnalyticsProperties = Record<string, boolean | number | string | null | undefined>;

/**
 * Records a product event from client code. Never put email, names, or other
 * personal data in properties. Server code uses `trackServer` instead.
 */
export function track(event: string, properties?: AnalyticsProperties) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[analytics] ${event}`, properties ?? {});
  }
  if (posthog.__loaded) posthog.capture(event, properties);
}

/** Links later events to the signed-in user. Pass the user ID, never an email. */
export function identifyUser(userId: string) {
  if (posthog.__loaded) posthog.identify(userId);
}

/** Call on sign-out so the next person on this browser starts anonymous. */
export function resetAnalytics() {
  if (posthog.__loaded) posthog.reset();
}
