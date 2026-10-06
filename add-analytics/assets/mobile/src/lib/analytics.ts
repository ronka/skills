import PostHog from 'posthog-react-native';

type AnalyticsProperties = Record<string, boolean | number | string | null | undefined>;

const token = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;

// The project token is public by design: it can only send events, not read them.
export const posthog = token
  ? new PostHog(token, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
      captureAppLifecycleEvents: true,
    })
  : null;

/**
 * Records a product event. Never put email, names, or other personal data in
 * properties.
 */
export function track(event: string, properties?: AnalyticsProperties) {
  if (__DEV__) {
    console.info(`[analytics] ${event}`, properties ?? {});
  }
  if (!posthog) return;
  // PostHog accepts JSON values only, so drop properties that are undefined.
  const defined: Record<string, boolean | number | string | null> = {};
  for (const [key, value] of Object.entries(properties ?? {})) {
    if (value !== undefined) defined[key] = value;
  }
  posthog.capture(event, defined);
}

/** Links later events to the signed-in user. Pass the user ID, never an email. */
export function identifyUser(userId: string) {
  posthog?.identify(userId);
}

/** Call on sign-out so the next person on this device starts anonymous. */
export function resetAnalytics() {
  posthog?.reset();
}

/** Records a screen view. Called from the root layout on every route change. */
export function trackScreen(pathname: string) {
  posthog?.screen(pathname);
}
