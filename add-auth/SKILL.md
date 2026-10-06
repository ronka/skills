---
name: add-auth
description: Add user accounts with Better Auth and email magic-link sign-in (plus optional Google on the web), sign-out, account deletion, and protected pages or API routes, on the web (Next.js) or in the mobile app (Expo, session in SecureStore). Use for sign-in, sign-up, login, accounts, users, or protected pages or routes.
---

# Add accounts

Wire Better Auth with tested reference code from `assets/`. Copy the files, then adapt only what the steps say. Match the user's conversation language and keep secrets out of chat, logs, and Git.

Pick the platform from `package.json`: `next` means **Web**, `expo` means **Mobile**. Where a step differs, follow only that platform's part.

Sign-in is by email magic link: no passwords. Web can add Google. Mobile offers magic link only: Google on iOS also requires Sign in with Apple (App Store guideline 4.8) and a native ID-token flow, which this skill doesn't cover.

## 1. Inspect and run prerequisites

Read `package.json`, `PRODUCT.md`, `SETUP.md`, `.env.local`, and `.env.example`. This skill needs the database and email skills, and on mobile the API routes:

- No database module (web `lib/database.ts`, mobile `src/server/database.ts`): run `add-database` first.
- No `sendEmail()` (web `lib/email.ts`, mobile `src/server/email.ts`): run `add-email` first.
- Mobile only: `add-database` and `add-email` run `add-app-api` first when it is missing.

Open each skill's `SKILL.md` (`.claude/skills/<skill>/SKILL.md` in Claude Code, `.agents/skills/<skill>/SKILL.md` in Codex) and follow it, then continue here.

Then look for an existing Better Auth setup (`better-auth` in `package.json`, a `betterAuth(` call):

- None: continue with step 2.
- One from a purchase skill (`add-grow-magic-link-access`, `add-polar-magic-link-access`) that limits sign-in to buyers: ask the user once whether anyone may now create an account. Opening sign-up changes who can get in, so never do it silently. If yes, keep its single `sendMagicLink` and its purchase checks, and add only what this skill adds that is missing.
- One this skill already wired: skip to step 7 and verify.

## 2. Install

- Web: `npm install better-auth`.
- Mobile: `npm install better-auth @better-auth/expo`, then `npx expo install expo-secure-store expo-network expo-linking expo-web-browser expo-constants`. It installs the packages but ends with an error because it can't edit the starter's dynamic `app.config.js`: add `"expo-secure-store"` and `"expo-web-browser"` to the `plugins` array in `app.json` yourself.

## 3. Copy the code

**Web**, from `assets/web/`:

| Asset | Target |
| --- | --- |
| `lib/auth.ts`, `lib/auth-client.ts`, `lib/session.ts` | `lib/` |
| `app/api/auth/[...all]/route.ts` | same path |
| `app/login/page.tsx`, `app/login/sign-in-form.tsx` | `app/login/` |
| `app/app/layout.tsx`, `app/app/page.tsx`, `app/app/account-actions.tsx` | `app/app/` |

`/app` is the signed-in area. Build the product's signed-in pages under it, or move the guard (`requireUser()` in a layout) to where they live.

**Mobile**, from `assets/mobile/`:

| Asset | Target |
| --- | --- |
| `src/server/auth.ts`, `src/server/auth-cli.ts` | `src/server/` |
| `src/app/api/auth/[...auth]+api.ts`, `src/app/auth/open+api.ts` | same paths |
| `src/lib/auth-client.ts` | `src/lib/` |
| `src/app/sign-in.tsx`, `src/app/auth/magic-link.tsx` | same paths |
| `src/components/account-section.tsx` | `src/components/` |

Then, on mobile:

1. Set `APP_SCHEME` in `src/server/auth.ts` and `src/lib/auth-client.ts` to `scheme` from `app.json`.
2. Sign-in screens must open above the tabs, so the root becomes a Stack:
   - Move `src/app/index.tsx` and `src/app/settings.tsx` into `src/app/(tabs)/`, and copy `assets/mobile/src/app/(tabs)/_layout.tsx` there. URLs don't change.
   - In `src/app/_layout.tsx`, replace `<AppTabs />` with `<Stack screenOptions={{ headerShown: false }} />` (import `Stack` from `expo-router`) and remove the `AppTabs` import.
3. Render `<AccountSection />` in the settings screen, in its own section.
4. In `src/lib/api-client.ts`, make `authHeaders()` send the session:

   ```ts
   const cookie = await authClient.getCookie();
   return cookie ? { cookie } : {};
   ```

Copy is Hebrew. When the primary locale in `PRODUCT.md` isn't `he`, translate every visible string, including the email in `sendMagicLink` and the hand-off page in `open+api.ts`.

## 4. Environment

Generate a secret with `openssl rand -base64 32` and write it to `.env.local` without printing it. Add each name below to `.env.example` with an empty value.

| Variable | Web `.env.local` | Mobile `.env.local` | Production |
| --- | --- | --- | --- |
| `BETTER_AUTH_SECRET` | generated | generated | a new value per environment |
| `BETTER_AUTH_URL` | `http://localhost:3000` | empty | the production URL |

On mobile, keep `BETTER_AUTH_URL` empty locally, so development uses the dev server's own address and links open on a phone in Expo Go. Better Auth then logs "Base URL is not set" in development; that warning is expected. In EAS production it must be the API's `https://<slug>.expo.app`: EAS Hosting rewrites every request's `Origin` to that URL, and without a matching `baseURL` every sign-in fails with `INVALID_ORIGIN`.

- Web production: `web-publish` transfers both to Vercel.
- Mobile production: push `BETTER_AUTH_SECRET` with `sensitive` visibility and `BETTER_AUTH_URL` as described in `add-app-api` step 4, then `npm run deploy:api`. It refuses to deploy while either is missing.

## 5. Create the tables

Better Auth needs `user`, `session`, `account`, `verification`, and `rateLimit` tables. Generate them as a migration with the env loaded:

- Web: `npx --yes auth@1.7.7 generate --config lib/auth.ts --output db/migrations/NNN_auth.sql --yes`
- Mobile: `npx --yes auth@1.7.7 generate --config src/server/auth-cli.ts --output db/migrations/NNN_auth.sql --yes`

Load `.env.local` first, for example `set -a; . ./.env.local; set +a` (quote values that contain spaces or `<>`). The CLI compares the config with the live database and writes only what is missing; an empty file means nothing is missing, so delete it. Check the SQL, then run `npm run db:migrate`.

## 6. Protect pages and routes

**Web:** call `requireUser()` from `@/lib/session` at the top of every protected page and every server action that reads or changes user data. A layout check alone doesn't protect server actions. Use `getUser()` where signed-out visitors are allowed.

**Mobile:** screens read `authClient.useSession()` and link to `/sign-in` when signed out. The server enforces access: every route that reads user data or spends money starts with

```ts
const user = await requireUser(request);
if (!user) return json({ error: 'התחברו כדי להמשיך.' }, 401);
```

Filter queries by `user.id`; never trust an ID sent by the app. This closes the guard step in `add-app-api` for paid routes.

**Both:** product tables that hold a user's data reference `"user"(id) on delete cascade`, so deleting the account deletes the data too. App Store review expects it, and so do privacy rules.

**Both:** keep Better Auth's cookie defaults (`HttpOnly`, `SameSite=Lax`, `Secure` in production), make every state change a POST, and never disable its origin check. On mobile the session never lives in a browser: the email links to `/auth/open`, which only forwards the token to the app's own scheme, and the app verifies it.

**Google (web, optional):** the button appears only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. The user creates an OAuth client (Web application) in Google Cloud Console with the redirect URI `<BETTER_AUTH_URL>/api/auth/callback/google` for each environment. List this as a handoff step; don't block on it.

With `add-analytics`, call `identifyUser(user.id)` after sign-in and `resetAnalytics()` on sign-out, and track `signed_up` for a new account and `signed_in` otherwise.

## 7. Verify

**Web:**

1. `npm run lint` and `npm run build`.
2. In the browser on the dev server: `/app` signed out redirects to `/login`; request a link, open it, land on `/app`; opening the same link again shows the expired-link message.
3. Delete the account from `/app` and confirm the `user` row is gone.

**Mobile:**

1. Start `npx expo start` once so Expo regenerates its typed routes with the new screens, then run `npm run lint` and `npx tsc --noEmit`.
2. In Expo Go or a simulator: open `/sign-in`, request a link, open the email link on the same device, confirm iOS's prompt to open the app, and land signed in. A protected route returns 200 signed in and 401 signed out. Close and reopen the app: still signed in.
3. `npm run deploy:api`, then repeat the sign-in once against production in a release build or after the next `mobile-release` tester build.

Without a verified Resend domain, links reach only the Resend account owner's address. Use that address for the test, or record the test as blocked on DNS.

## Handoff

Tell the user, in one or two sentences, that accounts work, where users sign in, and any remaining action: Google OAuth client setup, production environment values, or a sending domain.
