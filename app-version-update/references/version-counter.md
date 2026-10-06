# Version Counter

The version string answers one question: **which exact JS bundle is this device running?** It is
built from two halves.

| Half | Source | Changes when |
| --- | --- | --- |
| `1.0.3` | `expo.version` in `app.json`, read via `Constants.expoConfig?.version` | a production build is cut (`bump-app-version.js`) |
| `14` | an `UPDATE_VERSION` integer in source | an OTA is published (`increment-update-version.js`) |

Composed: `1.0.3-14`. Both halves are bumped by a script that also commits the change, so the
displayed value is always traceable to a commit.

## The counter

Declare it as a plain module constant in the screen that displays it, with a comment naming the
script that owns it:

```tsx
/**
 * OTA update counter, bumped by `scripts/increment-update-version.js` before
 * each `eas update`. Combined with the semver `version` from app.json, it
 * gives a unique build+update stamp (e.g. `1.0.3-14`) so we can tell exactly
 * which JS bundle a device is running.
 */
const UPDATE_VERSION = 1;
```

A new project starts at `1` — the first `npm run update` publishes `1`. (The `14` in the examples
elsewhere in this skill is only there to show the composed format.)

Compose the display string where it is rendered:

```tsx
import Constants from 'expo-constants';

const appVersion = (Constants.expoConfig?.version ?? '1.0.0') + '-' + UPDATE_VERSION;
```

The `?? '1.0.0'` fallback keeps development and test environments from rendering `undefined` when
the Expo config is unavailable.

### Where to put it

Next to the row that renders it, in the settings screen. It is not shared state; a second consumer
(a drawer footer, an about screen) should import the composed string from the settings module or a
small `constants/version.ts` — but if you move the constant, pass the *new* file path to
`increment-update-version.js` in the `update` npm script. **The script's path argument and the
declaration site must stay in sync, or every publish silently ships a stale counter.**

The script accepts the path as its first CLI argument and falls back to searching a few conventional
settings-screen locations. Always pass the path explicitly — the fallback is a convenience, not a
contract.

## Why a counter and not a runtime value

`expo-updates` exposes `updateId` and `createdAt` at runtime, which describe the bundle precisely
without any bookkeeping. The counter is preferred anyway because:

- It is **readable over the phone**. A user reads back `1.0.3-14`; nobody reads back a UUID prefix
  or a publish timestamp reliably.
- It is **monotonic and comparable**. "Are you on 14 or 12?" is answerable instantly; comparing two
  ISO timestamps in a support thread is not.
- It exists **before the publish**, so the number in the commit log, the number in the release note,
  and the number on the device are the same number.
- Runtime values are `null` in exactly the situations you debug most: `updateId` and `createdAt` are
  null on every fresh install running the embedded bundle, and `channel` is null in Expo Go and
  development builds.

The counter's one failure mode — drift, when someone runs `eas update` directly instead of
`npm run update` — is what the commit step below is designed to make visible.

## The commit step

Both bump scripts call `commitFile()` from `scripts/commit-file.js`, which does a pathspec-limited
commit of just the file it changed:

```js
git(['add', '--', filePath]);
git(['commit', '-m', message, '--', filePath]);
```

Two properties make this worth having, and both should survive any rewrite of these scripts:

1. **Pathspec-limited.** Only the version file is committed. Unrelated work-in-progress in the
   working tree stays uncommitted, so publishing an OTA is safe mid-task.
2. **Exits non-zero on failure.** The npm script is `node scripts/increment-update-version.js <path>
   && npx eas update` — the `&&` means a failed commit aborts before anything is published. An
   uncommitted version bump can never reach users, so the number on a device always maps to a commit
   you can check out.

Not being in a git repo is not a failure — it logs and returns, leaving the bump in place.

## Publishing OTAs and cutting builds

The npm scripts that drive both bumps are in SKILL.md step 4. `increment-update-version.js`,
`bump-app-version.js`, and `commit-file.js` are copied as a set — the two bump scripts
`require('./commit-file')`.

Neither bump script resets the other's number. The counter keeps climbing across builds
(`1.0.3-14` → build → `1.0.4-15`), which is intentional: a strictly increasing counter is easier to
reason about in a support thread than one that restarts per version.

## Dependencies

`expo-constants` only, for `Constants.expoConfig?.version`. Install with `npx expo install`, never a
bare `npm install`, so the version matches the SDK.
