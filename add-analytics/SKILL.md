---
name: add-analytics
description: Add PostHog product analytics with one `track(event, properties)` function, on the web (Next.js) or in the mobile app (Expo). Use when the product needs analytics, events, tracking, funnels, or PostHog, or when setup recorded PostHog as the analytics provider.
---

# Add analytics

Wire PostHog with tested reference code from `assets/`. Copy the files, then adapt only what the steps say. Match the user's conversation language.

Pick the platform from `package.json`: `next` means **Web**, `expo` means **Mobile**. Follow the common steps and that platform's section only.

## 1. Inspect

Read `package.json`, `PRODUCT.md`, `.env.local`, and `.env.example` when present. Classify as present or missing: the PostHog packages, the analytics module (web `lib/analytics.ts`, mobile `src/lib/analytics.ts` that imports `posthog-react-native`), and the token and host variables in `.env.local` (check names only).

When everything is present, skip to step 5 and verify. Change only what fails.

## 2. Get the project token and region

The PostHog project token is public by design: it can send events but cannot read data. That is why it uses the `NEXT_PUBLIC_` or `EXPO_PUBLIC_` prefix, unlike every other key in this project.

1. If PostHog MCP tools are available in this session, read the current project's token and its region (US or EU) from them.
2. Otherwise ask the user to open PostHog → Settings → Project and paste the **Project token** (starts with `phc_`), and say whether the project is on US or EU cloud.

If neither is possible yet, copy the code anyway with the token left blank, record the blocker and next action in `SETUP.md` `Resume notes` (or tell the user outside setup), and stop before step 5. Without a token the app runs and only logs events in development.

Hosts by region:

| Region | Ingest host | UI host | Assets host |
| --- | --- | --- | --- |
| US | `https://us.i.posthog.com` | `https://us.posthog.com` | `https://us-assets.i.posthog.com` |
| EU | `https://eu.i.posthog.com` | `https://eu.posthog.com` | `https://eu-assets.i.posthog.com` |

## 3. Web (Next.js)

1. Run `npm install posthog-js posthog-node`.
2. Copy `assets/web/instrumentation-client.ts` to the project root (next to `app/`, or into `src/` when the app lives in `src/app`). Copy `assets/web/lib/analytics.ts` and `assets/web/lib/analytics-server.ts` to `lib/`.
3. Merge this into `next.config.ts`, using the region's hosts. The `/ingest` rewrite sends events through the site's own domain so ad blockers don't drop them:

   ```ts
   const nextConfig: NextConfig = {
     async rewrites() {
       return [
         { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
         { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
         { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
       ];
     },
     // PostHog's API paths end in a slash; don't redirect them.
     skipTrailingSlashRedirect: true,
   };
   ```

4. Write to `.env.local`, and the same names with empty values to `.env.example`:

   ```bash
   NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com
   ```

   When `.gitignore` ignores `.env*`, add `!.env.example` on the line after it.

- Client components call `track()` from `@/lib/analytics`. Server actions, route handlers, and webhooks call `await trackServer(userId, event, properties)` from `@/lib/analytics-server`.
- `NEXT_PUBLIC_` values are inlined at build time. After changing them, restart the dev server; in production, redeploy. `web-publish` transfers all three to Vercel.

## 4. Mobile (Expo)

1. Run `npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization`. Let `expo install` pick the versions.
2. Replace `src/lib/analytics.ts` with `assets/mobile/src/lib/analytics.ts`. The `track(event, properties)` signature and the development log stay the same, so existing callers don't change.
3. Record screen views in the root layout `src/app/_layout.tsx`:

   ```tsx
   import { usePathname } from 'expo-router';
   import { useEffect } from 'react';

   import { trackScreen } from '@/lib/analytics';

   // Inside the root layout component:
   const pathname = usePathname();
   useEffect(() => {
     trackScreen(pathname);
   }, [pathname]);
   ```

4. Write to `.env.local`, and the same names with empty values to `.env.example`:

   ```bash
   EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
   EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

- Restart Expo with `npx expo start --clear` after changing `EXPO_PUBLIC_` values.
- The new packages include native code. Expo Go already has it, but an existing development or store build does not: the next release needs a new build, not an OTA update.
- `mobile-release` sets both variables in the EAS `preview` and `production` environments with `plaintext` visibility, because they are public.

## Events

Use these names for the standard moments, so funnels work across web and mobile:

| Event | When |
| --- | --- |
| `signed_up` | An account was created |
| `signed_in` | A returning user signed in |
| `purchase_completed` | A one-time payment succeeded |
| `subscription_started` | A subscription became active |

Name product events `object_verb` in English, lowercase with underscores (`report_created`, `invite_sent`), whatever the UI language.

- Never put email, names, phone numbers, or free text the user typed into properties. Use IDs and categories.
- When the app has sign-in, call `identifyUser(user.id)` right after sign-in and `resetAnalytics()` on sign-out.
- Track payments and subscriptions from the server (webhook) on web, so a closed tab can't lose them.
- When this skill runs from setup with no feature yet, add no events beyond the automatic page or screen views.

## 5. Verify

1. Web: `npm run lint` and `npm run build`. Mobile: `npm run lint` and `npx tsc --noEmit`.
2. Trigger one event. Web: open the dev server, load a page, and confirm a request to `/ingest/...` returns 2xx in the browser's network log. Mobile: open the app in Expo Go or the iOS simulator and change screens.
3. Confirm the event in PostHog: through the PostHog MCP when available, otherwise ask the user to check Activity in PostHog. Events can take a minute to appear.

## Handoff

Tell the user, in one sentence, that analytics is connected and where to see events, plus any remaining action.
