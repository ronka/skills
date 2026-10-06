---
name: web-publish
description: Publish this Next.js app on Vercel, configure its environment variables, verify the deployment, or resume a failed publishing attempt.
---

# Publish the web app

Use the existing product and Vercel project. Match the user's conversation language and give one next action at a time. Read `AGENTS.md`, `PRODUCT.md`, `SETUP.md`, and `LAUNCH.md` when present. Setup and publishing are separate workflows; resume publishing without rerunning initialization.

## Prepare

1. Establish the requested outcome: a test deployment or a public release. Infer it from the request when clear. Read [provider.md](references/provider.md) for the Vercel commands and environment-transfer procedure, and [launch-state.md](references/launch-state.md) before recording progress.
2. Run `node <skill-directory>/scripts/check.mjs --project <project-directory>`. This is a read-only local check; `ready` does not prove authentication, environment completeness, a successful build, or a working app. Resolve reported prerequisites, inspect actual package scripts/Node requirements, then run the project's lint and production build.
3. Inspect existing Vercel linkage and authenticated account. Reuse the intended project; resolve ambiguous team/project choices before linking. Record target and project IDs. Authenticate through the user's account flow when required.
4. Inventory environment names required by the implemented app. Transfer the selected values to the exact target using the provider reference. Keep values out of chat, logs, Git and LAUNCH.md. Verify existing services' deployment prerequisites (migrations, callback URLs, email domains, webhook URLs) when relevant. A configured MCP server is not runtime integration. Record unresolved product infrastructure as a dependency instead of silently adding features.

## Deploy and verify

5. Record the source revision, uncommitted changes and intended environment. Issue the appropriate Vercel deployment command and save its URL immediately. Inspect the actual deployment state/target before claiming success; the first deployment can be production even without `--prod`. A lost connection is a reason to inspect the existing attempt, not blindly deploy again.
6. Verify the exact deployment in a browser: expected product identity/screen, navigation, and one core action supported by the app. For a plain landing page, identity and navigation are the relevant checks. For a product with sign-in or data saving, test that flow. A provider-ready deployment or HTTP 200 is not sufficient application evidence.
7. For a public release, check access signed out of Vercel. Distinguish deployment protection, app authentication, and actual failures. A protected preview can be verified for its intended audience; it is not a public launch. Change existing protection only within the user's authorization. Never use `vercel --public` to make the app accessible: it exposes source code.
8. Update LAUNCH.md with the precise evidence, remaining blocker and next action. Return the URL and what was verified. Missing browser access leaves application verification pending; do not invent a result.

Publishing authorization applies to the requested target. Continue routine configuration and fixes without repeated approval questions; account selection, unrelated services, or a broader release still need a resolved user intent. Custom-domain purchasing and DNS automation are outside this initial workflow.

## Resume

Read the recorded project and deployment IDs and inspect remote state first. If the build failed, diagnose that attempt before replacing it. Rerun affected checks when source or environment changes. Environment changes require a new deployment to take effect. Preserve previous attempts and leave failed application checks unverified even when the deployment is ready.
