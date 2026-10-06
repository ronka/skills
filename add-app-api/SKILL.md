---
name: add-app-api
description: Give this Expo app its own backend with Expo Router API routes deployed to EAS Hosting. One server action is one `src/app/<action>+api.ts` route that holds the keys and calls the provider, plus a typed client in `src/lib/<action>.ts` that screens call. Use for a server action, API route, endpoint, backend, secret API key, calling a paid API (AI, TTS, SMS), deploying the API, EAS Hosting, or the server origin.
---

# Add the app's API

Wire API routes with tested reference code from `assets/mobile/`. Copy the files, then adapt only what the steps say. Match the user's conversation language, and keep keys out of chat, logs, and Git.

Keys and provider calls stay on the server. The app knows only relative paths such as `/summarize`: in development Expo sends them to the dev server, and release builds send them to the deployed `origin`.

## 1. Inspect

Read `package.json`, `app.json`, `app.config.js`, `eslint.config.js`, `PRODUCT.md`, `.env.local`, and `.env.example` when present. Classify each item as present or missing:

- `app.json` has `"web": { "output": "server" }`, and `app.config.js` adds `web` to `platforms` only when `EXPO_EXPORT_API_ROUTES=1`
- `react-dom`, `react-native-web`, and `zod` are installed
- `src/server/http.ts`, `src/lib/api-client.ts`, `src/app/health+api.ts`, and `scripts/deploy-api.mjs`
- the `export:api` and `deploy:api` scripts
- the `no-restricted-imports` rule for `@/server` in `eslint.config.js`
- an `expo-router` plugin `origin` in `app.json`, and an EAS project ID in `extra.eas.projectId`

When everything is present, skip to step 3 to add an action. Change only what fails.

## 2. Enable API routes

1. In `app.json`, set `"web": { "output": "server" }`. Keep `platforms` as `["ios", "android"]`.
2. In `app.config.js`, add `web` only while exporting routes, so app builds stay native-only:

   ```js
   // The client is native-only. `web` is added only while exporting API routes,
   // because Expo exports API routes for the web platform.
   const exportingApiRoutes = process.env.EXPO_EXPORT_API_ROUTES === '1';

   module.exports = ({ config }) => ({
     ...config,
     platforms: exportingApiRoutes ? [...(config.platforms ?? []), 'web'] : config.platforms,
     // keep the existing plugins and settings
   });
   ```

3. Run `npx expo install react-dom react-native-web` (the export fails without them) and `npm install zod`.
4. Copy from `assets/mobile/`: `src/server/http.ts`, `src/lib/api-client.ts`, `src/app/health+api.ts`, and `scripts/deploy-api.mjs`. Translate the user-visible messages into the primary product locale: the three `messages` in `api-client.ts`, and the strings in `readJson` and `fail` in `http.ts`.
5. Add these scripts to `package.json`:

   ```json
   "export:api": "rm -rf dist && EXPO_NO_DOTENV=1 EXPO_EXPORT_API_ROUTES=1 EXPO_NO_WEB_SETUP=1 expo export --platform web",
   "deploy:api": "node scripts/deploy-api.mjs"
   ```

   `EXPO_NO_DOTENV=1` matters: without it, Expo uploads values that exist only in `.env.local`, so development keys would reach production.

6. Add this block after `expoConfig` in `eslint.config.js`, so server code can't end up in the app bundle:

   ```js
   {
     // Server code holds keys and provider calls. Only API routes may import it,
     // so it never ends up in the app bundle.
     files: ['src/**/*.{ts,tsx}'],
     ignores: ['src/app/**/*+api.ts', 'src/server/**'],
     rules: {
       'no-restricted-imports': [
         'error',
         {
           patterns: [
             {
               group: ['@/server', '@/server/*', '**/server/*'],
               message: 'Import server code only from API routes (src/app/**/*+api.ts).',
             },
           ],
         },
       ],
     },
   },
   ```

## 3. Add a server action

Copy `assets/mobile/src/app/example+api.ts` to `src/app/<action>+api.ts` and `assets/mobile/src/lib/example.ts` to `src/lib/<action>.ts`, with `<action>` a short kebab-case verb phrase (`summarize-note`). Rename the types and function, replace the example body with the real provider call, and update the path in the client. When this skill runs from setup with no feature yet, add no action: keep only the health route.

- **Validate on the server** with zod, and cap every string and list length. Share types and constants with the app, not schemas.
- **Keys** come from `process.env` inside the route. Never give a key the `EXPO_PUBLIC_` prefix: those are inlined into the app.
- **Errors:** wrap the route body in `try`/`catch` and return `fail(error, '<action>')`. Throw `HttpError(status, message)` for errors the user should see, written in the primary product locale.
- **Screens** call the typed client and show `ApiError.message`. They never call `fetch` for these routes.
- **Binary responses** (audio, images) return `new Response(bytes, { headers: { 'Content-Type': type } })`, and their client calls `fetch` directly instead of `callApi`, checks `response.ok`, and reads the body as bytes.

The routes run on EAS Hosting, which is Cloudflare Workers, not Node:

- Nothing that holds a connection may live at module level. Create database pools, auth instances, and similar clients inside the request and close them before returning. A shared one hangs the Worker.
- No native modules (`sharp`), no `pg` over TCP, and no dynamic `import()`. Use fetch-based SDKs. For the database, `add-database` provides a Workers-safe module.
- On the Free plan each request gets **10 ms of CPU** and **10 subrequests** (each outbound `fetch` or HTTP database query is one). Keep heavy work such as image processing off these routes, and batch database work into one pool.

## 4. Secrets

1. Development: put each key in `.env.local` and its name with an empty value in `.env.example` (an optional key goes in commented out, `# NAME=`), with a comment naming the route that reads it. Restart `npx expo start` after changes.
2. Production: set each key in the EAS `production` environment with `sensitive` visibility. Write the reviewed names and values to a temporary mode-600 file, run `npx --yes eas-cli@24.7.0 env:push production --path <file>`, then delete the file. Never use `secret` visibility: EAS Hosting can't read it.
3. A changed value takes effect only after the next `npm run deploy:api`.

## 5. Deploy and set the origin

Deploying needs an EAS project. If `app.json` has no `extra.eas.projectId`, run `npx --yes eas-cli@24.7.0 init` (the user may need to sign in with `eas login` first).

1. The first deploy picks the URL: `npm run deploy:api -- --dev-domain <slug>` gives `https://<slug>.expo.app`. Later deploys are `npm run deploy:api`.
2. The script stops if a server variable listed in `.env.example` is missing from EAS production (push it as step 4 describes), exports without `.env` files, deploys to production, and waits until production's `/health` answers from the new deployment. If it reports that production still serves the old one, run it again.
3. Set the origin: in `app.json` `plugins`, replace the `"expo-router"` string with `["expo-router", { "origin": "https://<slug>.expo.app" }]`. The script exits with code 2 and prints the exact line while it's missing or different.

Development builds and Expo Go always call the local dev server, so `origin` only affects release builds, and they read it at build time: rebuild after changing it. Never set `EXPO_UNSTABLE_DEPLOY_SERVER`. `mobile-release` refuses a tester or store build while routes exist and `origin` doesn't match.

The deployment also serves a web copy of the app's screens at the same URL. That is expected.

On the Free plan Expo keeps deployments for 30 days. Until it's confirmed that the production deployment is exempt, redeploy at least every 30 days, or move a launched app to a paid plan.

## 6. Guard routes that spend money

A route that calls a paid provider (AI, TTS, SMS, email) must check who is calling before spending.

- With sign-in, return 401 for signed-out callers using the helper `add-auth` provides.
- Until sign-in exists, keep the strict input caps from step 3, and say in the handoff that the route is public and that adding sign-in is the next step.

## 7. Verify

1. `npm run lint` and `npx tsc --noEmit`.
2. Development: start `npx expo start`, open the app in Expo Go or a simulator, and run the action from its screen. When there is no action yet, open `http://localhost:8081/health` instead.
3. `npm run deploy:api` passes its health check, then call the action on the production URL once with `curl`.
4. Run `npm run export:api`, then search `dist/client` for each key's value. No key may appear.

## Handoff

Tell the user, in one or two sentences, which actions exist, the production URL, whether `origin` is set, and any remaining step: signing in to EAS, a first deploy, a guard for a public paid route, or a new build after the origin change.
