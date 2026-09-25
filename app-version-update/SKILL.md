---
name: app-version-update
description: Add or update app version display and hidden debug menu in Expo/React Native settings screens. Use when adding a settings screen with version info, setting up version bump scripts for EAS builds and OTA updates, adding a hidden debug menu (triple-tap to reveal), or when the user asks to add debug options, version display, or OTA update version tracking to their app. Triggers on settings screen, version display, debug menu, hidden menu, app version, UPDATE_VERSION, bump version.
---

# App Version & Debug Menu

Add version display and a hidden debug menu to Expo React Native apps.

The version string is `<app.json version>-<UPDATE_VERSION>`, e.g. `1.0.3-14`. Both numbers are owned
by scripts that bump **and commit** them as part of publishing, so any version a user reads off a
screen maps to a commit you can check out.

## Workflow

### 1. Check existing state

Search the project for:

- an `UPDATE_VERSION` constant (usually inline in the settings screen, sometimes `constants/version.ts`)
- `increment-update-version` / `bump-app-version` / `commit-file` in `scripts/` or `package.json`
- a settings screen displaying the app version
- the `update` and `build:production:*` npm scripts

If `UPDATE_VERSION` already exists the pattern is in place, but still check the parts that rot
silently: all three scripts present, **both** bump scripts calling `commitFile` from
`./commit-file`, and the path passed to `increment-update-version.js` still pointing at the file
that declares the constant. Fix any of those in step 2, then go to step 5. If `UPDATE_VERSION` does
not exist, start at step 2.

### 2. Scripts

Copy all three from this skill's `scripts/` directory — they are a set, since both bump scripts
`require('./commit-file')`:

- `scripts/commit-file.js` — pathspec-limited commit helper, exits non-zero on failure
- `scripts/increment-update-version.js` — `+1` on `UPDATE_VERSION`, run before every OTA publish
- `scripts/bump-app-version.js` — `+1` on the patch of `app.json`'s `version`, run before every
  production build

Why the commit helper is not optional: it commits only the file it changed, so unrelated
work-in-progress stays uncommitted, and it exits non-zero on failure so the `&&` in the npm script
aborts before anything is published. An uncommitted bump can never reach users. Details in
[version-counter.md](references/version-counter.md).

### 3. The counter

Declare `UPDATE_VERSION` as a module constant in the screen that displays it and compose the string
at the render site — see [version-counter.md](references/version-counter.md) for the constant, its
doc comment, and the `Constants.expoConfig?.version` fallback.

Requires `expo-constants`. Install anything missing with `npx expo install`, never a bare
`npm install`, so versions match the SDK.

### 4. npm scripts

```json
{
  "update": "node scripts/increment-update-version.js '<path/to/settings-screen>' && npx eas update",
  "build:production:ios": "node scripts/bump-app-version.js && npx eas build --platform ios --profile production",
  "build:production:android": "node scripts/bump-app-version.js && npx eas build --platform android --profile production"
}
```

Pass the settings-screen path explicitly. The script does fall back to searching conventional
locations, but a project whose settings screen lives anywhere unusual (a route group, a feature
folder) will silently fail the search, and the failure surfaces at publish time.

Publishing must go through `npm run update`. Running `npx eas update` directly ships a bundle whose
displayed counter is one behind — the single way this scheme drifts.

### 5. Settings screen version display

Show the composed string in a "Version" row under an About section. If a second surface shows the
version (drawer footer, about screen), import one composed string rather than recomposing it.

### 6. Hidden debug menu

Triple-tap the version row to open an `Alert` of debug options. See
[debug-menu-pattern.md](references/debug-menu-pattern.md) for the full pattern: ref-based tap counter
with a 500ms timeout, timer cleanup in a `useEffect` return, `Pressable` with `accessibilityRole`.

Options are project-specific. Two conventions to keep:

- **Labels carry current state** — `Dev mode: turn OFF`, `Grant 20 credits (have 3)` — so the menu
  reads out values as well as changing them, and no separate diagnostics screen is needed.
- **Track the menu opening** with one analytics event, so accidental discovery by real users is
  visible.

Typical options: toggle a dev/free-play mode, grant a consumable or entitlement, reset onboarding or
first-run hints, force a review prompt, force a failure state to exercise a recovery flow. Mark
destructive ones `style: 'destructive'`.

## Update-delivery posture

The version string tells you which bundle is running; these two settings decide how a new one
arrives. They are one decision, not two — set them as a pair in `app.json`:

- **Blocking launch** — `updates.checkAutomatically: "ON_LOAD"` with a non-zero
  `updates.fallbackToCacheTimeout` (10000 is a reasonable budget), and no auto-reload hook in the
  app. Cold start waits up to that budget for a new bundle, then falls back to cache. Simple, the
  default recommendation, and it needs no `expo-updates` code in the app at all. Cost: the delay is
  budgeted on *every* cold start, including when no update exists, because the window covers the
  server check and not just the download.
- **Instant launch** — `fallbackToCacheTimeout: 0` plus a reload gated on a foreground transition
  (`Updates.useUpdates()` → `isUpdatePending` → `reloadAsync`). Launches never wait. Requires a
  deliberate answer to "when may we restart the app under the user" — never mid-interaction.

Never ship `fallbackToCacheTimeout: 0` with no auto-reload: that is the slowest possible adoption
path — a bundle downloads on one launch and only takes effect on the next, every time.

## Runtime version and OTA reach

With `runtimeVersion.policy: "appVersion"`, an update only reaches installed builds whose `app.json`
`version` matches the one it was published under. Because `bump-app-version.js` runs *before* a
production build, every build starts a new OTA lineage: updates published afterwards cannot reach
the previously shipped version. To hotfix users still on the old build, publish while `expo.version`
is temporarily set back to that version. Mention this whenever setting up the bump script.

## Adding new debug options

Add an entry to the `Alert` buttons array in `showDebugOptions()`, before the cancel button, and add
its dependencies to the `useCallback` dependency array.
