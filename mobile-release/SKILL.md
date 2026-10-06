---
name: mobile-release
description: Publish an Expo app through EAS tester builds, store submission, hosted store-listing links, App Store Connect metadata and screenshot uploads, or compatible OTA updates. Configure missing release profiles and environment settings, verify results, and resume failed attempts.
---

# Publish the mobile app

Read `AGENTS.md`, `PRODUCT.md`, `SETUP.md` and `LAUNCH.md` when present. Match the conversation language and give one next action at a time. Infer the requested stage/platform; ask only when it is unclear whether the user wants a tester build, store submission, or an update.

Read [first-release.md](references/first-release.md) for commands, environments and device/store prerequisites. Use [launch-state.md](references/launch-state.md) before the first external operation.

For a request only to edit App Store Connect metadata or upload store screenshots, follow [store-metadata.md](references/store-metadata.md) directly. Reuse the existing app record and editable version; do not bump versions, build a binary, or publish OTA for a listing-only change. If the record or editable version is missing, resolve that prerequisite first.

## Prepare

1. Inspect actual npm scripts, resolved Expo config and existing EAS linkage. Run `node <skill-directory>/scripts/configure.mjs --project <project-directory> --check`. With no conflicts, `--apply` adds the supported profiles/commands while preserving unrelated fields. Inspect named conflicts and reconcile intended settings; never overwrite custom configuration silently.
2. Run `node <skill-directory>/scripts/check.mjs --project <project-directory> --platform <ios|android|all>`. Add `--update` for OTA. This checks local readiness, including rejection of leftover Expo web configuration, not authentication, signing, installation or store status. Run lint, TypeScript checks, Expo diagnostics, and the local native bundle preflight from [first-release.md](references/first-release.md); fix release-relevant failures before spending an EAS build.
3. Verify the intended account/project. Link an unlinked initialized app and configure updates when needed, then rerun readiness. Guide owner login/account actions. Configure the app's required environment values for the selected EAS environment. Private backend credentials must stay in a backend.
   When `src/app` has `+api` routes (`add-app-api`), the build depends on its deployed API: run `npm run deploy:api` before any tester or store build and continue only when it exits 0, which means production serves the current routes and `app.json` sets the matching `expo-router` `origin`. Release builds read `origin` at build time, and `check.mjs` reports `api-origin` until it is set. Server keys go to the EAS `production` environment with `sensitive` visibility (never `secret`, which Hosting can't read); `EXPO_PUBLIC_` values go to every build environment.
4. Before a store submission, prepare public privacy, support, and terms links. Run `node <skill-directory>/scripts/generate-legal-pages.mjs --project <project-directory> --check`. With no conflicts, `--apply --app-name <name> --support-email <email> [--company-name <name>]` writes a standalone static site under `legal-site/` without changing Expo Router, `app.json`, or native dependencies. Audit the app and its SDKs, replace every `REVIEW_REQUIRED` section with accurate policy text, and rerun `--check` until ready. Preview, deploy, and verify the URLs using [first-release.md](references/first-release.md).

## Publish and verify

5. For first distribution, build for testers, save the build ID immediately, and verify installation/core behavior on a physical device. Record the actual build/version; an Expo Go session does not verify native purchases or OTA behavior.
6. For a new production release, prepare the marketing version once, then build requested platforms using that version. Each existing single-platform production wrapper bumps and commits: do not chain them for a two-platform release. Use the separate prepare/build commands in the reference. Store build numbers are distinct from marketing version.
7. Submit the exact verified build ID for the chosen platform. Save and inspect the submission receipt. Report uploaded, processing/testing, awaiting review, and publicly available separately. Once the App Store Connect app record exists, upload the finished screenshots and edit supported listing metadata using [store-metadata.md](references/store-metadata.md). Run the bundled `app-store-screenshots` skill when captures or exports are missing. Verify saved listing contents before reporting them complete. Give the owner the remaining store action, including the verified privacy and support URLs plus terms when applicable; submission does not imply publication.
8. For OTA, verify the installed runtime, native-change compatibility, channel and environment before preparing the counter once. Preserve `runtimeVersion.policy: "appVersion"` and the counter in `src/components/version-debug-row.tsx`. Confirm receipt on the intended binary; native changes require a new binary/runtime.

## Recover

Query recorded build/submission/update IDs before retrying. A timeout can leave a successful remote operation. Without an ID, inspect recent operations matching project, source, platform, version and target before issuing another.

The app version or OTA counter may already have been committed before EAS failed. Reuse that prepared version for the same attempt using raw build/update commands, not bump wrappers. A failed submission can reuse its successful build. A store build-number conflict or changed native source requires a deliberate new build decision. Keep the starter's existing root version helpers; the legacy scripts bundled here target another layout and must not be copied over them.

Record observed results in LAUNCH.md. End with the relevant link, exactly what was verified, and one next action. Continue within existing publishing authorization; resolve ambiguous destinations before external changes. Unavailable account, store-review or device actions remain explicit pending milestones.
