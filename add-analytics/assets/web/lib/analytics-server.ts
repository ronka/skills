import { PostHog } from "posthog-node";

type AnalyticsProperties = Record<string, boolean | number | string | null | undefined>;

const globalForAnalytics = globalThis as typeof globalThis & {
  posthogServer?: PostHog | null;
};

function client() {
  if (globalForAnalytics.posthogServer !== undefined) return globalForAnalytics.posthogServer;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  globalForAnalytics.posthogServer = token
    ? new PostHog(token, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST })
    : null;
  return globalForAnalytics.posthogServer;
}

/**
 * Records a product event from server code, such as a webhook or server action.
 * `distinctId` is the user ID, matching `identifyUser` on the client.
 * Sends before resolving, so it is safe in serverless functions.
 */
export async function trackServer(
  distinctId: string,
  event: string,
  properties?: AnalyticsProperties,
) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[analytics] ${event}`, properties ?? {});
  }
  try {
    await client()?.captureImmediate({ distinctId, event, properties });
  } catch (error) {
    // Analytics must never break the action that triggered it.
    console.error("PostHog capture failed", error);
  }
}
