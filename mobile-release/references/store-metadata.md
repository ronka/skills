# App Store Connect metadata and screenshots

Checked on 2026-10-06 against published EAS CLI 24.11.0 and Expo's CLI source. EAS Metadata is beta and currently Apple-only. The CLI supports screenshot upload, deletion, and ordering even though the documentation overview does not fully describe it. Recheck the installed version's help/schema when upgrading.

## Target and preserve

Run commands from the Expo app root, using the intended iOS **submit** profile. Verify the Expo account/project, Apple team, bundle identifier, App Store Connect app ID, and editable store version. Metadata operates on an existing Apple app record; it does not create the app record. For first submission, use the verified build upload and wait for processing before completing the listing. For later listing edits, reuse the existing editable version without rebuilding. If Apple locks the requested fields, resolve the version/state prerequisite rather than promising an edit to a live version.

Use existing EAS/App Store Connect credentials with appropriate permissions. The CLI accepts stored or configured App Store Connect API keys and interactive Apple authentication. Keep key files and review-login secrets out of Git, chat, and LAUNCH.md.

1. Inspect `eas.json`'s selected submit profile and its `metadataPath`; default is `store.config.json`. Snapshot the existing local config/assets outside the repository before pulling: pull can overwrite the local config. Treat a pulled config as the remote baseline, then merge intended local changes with JSON tooling. Preserve unrelated locales, review details, categories, age ratings, and release settings. After dashboard edits, refresh this baseline before another push.

   ```bash
   npx --yes eas-cli@24.11.0 metadata:pull --profile production
   ```

2. Set `apple.version` to the intended editable marketing version. This selects, and can create or rename, a store version: inspect the existing version before setting it. Merge requested localized title, subtitle, description, keywords, promotional text, release notes, marketing/support/privacy URLs under `apple.info`. Use Apple locale codes, explicitly mapping product locales such as `en` to `en-US`; verify supported codes for each target locale. Omit release notes for a first version. Retain existing release strategy when editing copy or screenshots. Use the dashboard for fields the current schema does not support, then reconcile supported values locally.

## Attach the finished screenshots

Run the bundled `app-store-screenshots` skill if the exports are missing. Its editor lives at `tools/app-store-screenshots/` and its export bundles under `exports/`. Extract the actual PNGs before upload; EAS takes file paths, not zip bundles or editor project JSON.

Under each `apple.info[locale].screenshots`, map an App Store Connect screenshot display type to an **ordered array** of PNG paths relative to the Expo app root. Choose the exported size matching the actual Apple slot; include iPad sets when required. Inspect every file for dimensions, locale, RGB/alpha requirements, and intended order. Use unique basenames within each set. For changed images, use new content-versioned filenames: the CLI may retain an existing image with the same filename and byte size.

Illustrative shape only; replace the version, locale, display type and paths with verified project values, and merge into the existing config:

```json
{
  "configVersion": 0,
  "apple": {
    "version": "1.0.0",
    "info": {
      "en-US": {
        "title": "Your app name",
        "screenshots": {
          "APP_IPHONE_67": [
            "./store/screenshots/en-US/01-hero-v1.png",
            "./store/screenshots/en-US/02-feature-v1.png"
          ]
        }
      }
    }
  }
}
```

For each configured set, the CLI synchronizes the entire array and can delete remote images omitted from it. Keep baseline paths for retained images and verify all local files exist before pushing. Empty arrays are skipped; use a supported dashboard/API action for intentionally clearing a set. A screenshot-only request must preserve text and other listing settings.

## Validate, push, verify

```bash
npx --yes eas-cli@24.11.0 metadata:lint --profile production --json
npx --yes eas-cli@24.11.0 metadata:push --profile production
```

Inspect lint's JSON and proceed only when it is `[]`; validation errors may still produce exit code zero. Review the intended field/set diff before pushing within the user's listing/publishing authorization. Resolve an ambiguous app/version before external changes. Do not bypass validation warnings.

Open the returned App Store Connect URL and verify the target version, localized text/URLs, screenshot count, order, dimensions, and completed image processing for every changed set. A push may skip missing files or locales; inspect warnings and remote contents even on exit code zero. Save evidence and unresolved items in LAUNCH.md. For partial failure, inspect remote state before retrying; preserve changes that already succeeded. Metadata push does not submit the app for review or prove public availability.

Google Play listing edits and screenshot uploads use Play Console or another verified supported integration; EAS Metadata does not handle them.

Sources: [Expo Metadata](https://docs.expo.dev/eas/metadata/), [getting started](https://docs.expo.dev/eas/metadata/getting-started/), [schema](https://docs.expo.dev/eas/metadata/schema/), [CLI command reference](https://github.com/expo/eas-cli/blob/v24.11.0/packages/eas-cli/README.md), [screenshot sync](https://github.com/expo/eas-cli/blob/v24.11.0/packages/eas-cli/src/metadata/apple/tasks/screenshots.ts), [version handling](https://github.com/expo/eas-cli/blob/v24.11.0/packages/eas-cli/src/metadata/apple/tasks/app-version.ts), [lint behavior](https://github.com/expo/eas-cli/blob/v24.11.0/packages/eas-cli/src/commands/metadata/lint.ts).
