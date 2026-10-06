# Mobile release record

Maintain `LAUNCH.md` in the buyer's project, outside generated files. Preserve existing web/other launch sections.

```markdown
# Launch

## Mobile

- Requested outcome and platforms:
- EAS account/project ID:
- CLI version:
- Source revision and uncommitted-change summary:
- Prepared marketing version / OTA counter:
- Runtime, channel and environment:
- Last updated:

| Platform | Build ID / URL | Build number | Build state | Device verification | Submission ID / state | Store publication |
| --- | --- | --- | --- | --- | --- | --- |
| iOS | | | pending | pending | pending | pending |
| Android | | | pending | pending | pending | pending |

### Legal pages

- Privacy policy URL:
- Support URL:
- Terms of service URL:
- Website URL / EAS Hosting subdomain:
- Preview and production deployment IDs:
- Content last reviewed:

### Store listing

- App Store Connect app ID / bundle ID / team:
- Target editable version and submit profile:
- Metadata config path and pre-edit snapshot:
- Locales and changed metadata fields:
- Screenshot export paths, display types, and ordered filenames per locale:
- Last metadata push timestamp / result / App Store Connect URL:
- Verified remote metadata and screenshot counts/order/processing:
- Remaining listing or review actions:

### OTA attempts

- Timestamp, source, prepared counter, group ID, runtime/channel/environment, observed receipt.

### Continue

- Last successful stage:
- Blocker:
- Next action:
```

Use pending/verified/failed/needs-user-action with evidence and timestamps. Distinguish agent device observations from user reports. Exclude signing secrets, sensitive environment values and raw logs.

Resume by querying provider IDs and matching source/version. If no ID was captured, inspect matching recent operations first. Build success is not installation; upload is not store approval. Preserve previous attempts. Changed source/configuration creates a new attempt with affected checks rerun. Retry a failed build at its already prepared marketing version; retry upload with its existing build; inspect uncertain OTA publication before repeating it.

For metadata or screenshot retries, inspect the saved App Store Connect version and assets first, reconcile with the pre-edit snapshot, and retry only the unresolved changes. A CLI success message is not verification of every locale or screenshot. Preserve unrelated fields, locales, release settings, and existing assets.
