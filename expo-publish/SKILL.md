---
name: expo-publish
description: Guides publishing an Expo/EAS app — OTA updates, production builds (iOS/Android), store submission, and simulator builds. Use when the user says "publish", "release", "submit to store", "OTA update", "build for production", "build simulator", or runs any EAS build/submit/update workflow. Knows the project's npm scripts, version-bump logic, and correct command order.
---

# Expo Publish

## Workflows

### 1. OTA Update (no store review needed)

Bumps `UPDATE_VERSION` in `constants/version.ts`, commits that bump, then pushes the update to all users on the current channel.

```bash
npm run update
```

The commit is automatic — the script commits `constants/version.ts` before `eas update` runs, and aborts the update if the commit fails.

---

### 2. Production Build

The build scripts auto-bump the patch version in `app.json` and commit it before building.

**iOS only:**
```bash
npm run build:production:ios
```

**Android only:**
```bash
npm run build:production:android
```

**Both platforms:**
```bash
npm run build:production:ios && npm run build:production:android
```

---

### 3. Store Submission

Submit the latest build to the App Store / Play Store. Run **after** a successful production build.

**iOS:**
```bash
npm run submit:production:ios
```

**Android:**
```bash
npm run submit:production:android
```

---

### 4. Full Release (Build + Submit)

**iOS:**
```bash
npm run build:production:ios && npm run submit:production:ios
```

**Android:**
```bash
npm run build:production:android && npm run submit:production:android
```

---

### 5. Simulator Build

For local development/testing — not for store submission.

**iOS simulator:**
```bash
npm run build:simulator:ios
```

**Android simulator:**
```bash
npm run build:simulator:android
```

---

## Setup in a New Project

Copy the bundled scripts into the project:
```bash
cp <skill-path>/scripts/bump-app-version.js scripts/
cp <skill-path>/scripts/increment-update-version.js scripts/
cp <skill-path>/scripts/commit-file.js scripts/
```

Add these npm scripts to `package.json`:
```json
"update": "node scripts/increment-update-version.js && npx eas update",
"build:production:ios": "node scripts/bump-app-version.js && npx eas build --platform ios --profile production",
"build:production:android": "node scripts/bump-app-version.js && npx eas build --platform android --profile production",
"submit:production:ios": "npx eas submit --platform ios --profile production",
"submit:production:android": "npx eas submit --platform android --profile production",
"build:simulator:ios": "npx eas build --platform ios --profile development-simulator",
"build:simulator:android": "npx eas build -p android --profile development-simulator"
```

Ensure `constants/version.ts` exports `UPDATE_VERSION`:
```ts
export const UPDATE_VERSION = 1;
```

---

## Version Bump Logic

| Script | What gets bumped | File |
|--------|-----------------|------|
| `npm run update` | `UPDATE_VERSION` (integer, +1) | `constants/version.ts` |
| `npm run build:production:*` | `version` patch (semver x.y.z+1) | `app.json` |

Both scripts commit their own bump automatically, so git history tracks releases accurately. The commit is pathspec-limited to the version file, so unrelated working-tree changes stay uncommitted; if the commit fails the script exits non-zero and the `&& eas ...` step never runs. Outside a git repo the commit is skipped with a log line.

## Checklist Before Releasing

- [ ] All changes committed and pushed
- [ ] Tested on a physical device or simulator
- [ ] `eas.json` profiles are correct for the target environment
