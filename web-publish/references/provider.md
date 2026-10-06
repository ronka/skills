# Vercel operations

Command flags checked with Vercel CLI 59.1.4 on 2026-09-17. Recheck `--help` if the installed version differs. Examples assume the project working directory. With no CLI installed, use `npx --yes vercel@<checked-version>`; record the version rather than silently changing it during a release.

## Account and target

Use `vercel whoami`, inspect `.vercel/project.json`, and check the intended account/project. Use `vercel login` when authentication is missing and `vercel link --scope <scope> --project <name>` to link the chosen project. Preserve existing valid linkage. A different product must get its own project rather than inheriting the template author's project.

## Environment variables

Before deploying:

1. Inspect code, configuration and `.env.example` for required names. Resolve dynamic accesses and optional integrations manually. Inspect local values programmatically without printing them. Decide which values belong to production versus preview; do not copy localhost URLs or development credentials into production by default.
2. List target names with `vercel env ls production` or `vercel env ls preview`. Existing correct remote values need not be replaced. Missing values require the appropriate provider/account step.
3. Use the bundled transfer helper with explicit names, environment, and expected linked IDs:

   ```bash
   node <skill-directory>/scripts/env.mjs --project <project-directory> --file <literal-env-file> --names DATABASE_URL,RESEND_API_KEY --environment production --project-id <project-id> --org-id <org-id>
   ```

   This first call is read-only and prints names and target only. Add `--apply` to transfer. Use `--replace` with `--apply` only for selected existing values intended to be replaced. The helper checks both IDs against `.vercel/project.json`, feeds values through stdin to `vercel env add`, and suppresses raw provider output. A failed transfer reports names already completed so a retry need not overwrite them. Use `--public-names NEXT_PUBLIC_SITE_URL` for selected browser-visible values; this must match all selected `NEXT_PUBLIC_` names. Review those values as public configuration before transferring them.

4. The input is a dedicated literal dotenv file parsed with Node's `util.parseEnv` (Node 20.12+). It does not implement Next.js's file precedence, `$VAR` expansion, or backslash escaping. Prepare exact final values programmatically in an ignored private file when local configuration uses those features; unescaped interpolation-like values are refused. `--literal-dollar` explicitly allows dollar characters when they are part of the final literal value. Real multiline quoted values are supported. Never shell-source dotenv files. If creating a temporary transfer file, use mode 0600, keep it outside deployment input, and delete it after use.
5. The helper uses an installed `vercel` executable. With a local CLI install, pass `--cli <path-to-vercel/dist/index.js>` to invoke it with Node; use this on Windows instead of a `.cmd` shim. No token or secret belongs in command arguments. The helper refuses missing/empty values before any upload and stops at the first provider failure. It does not verify that a value is correct for production; that comes from service/app verification.
6. Confirm target names, then deploy again. Variables apply to subsequent deployments. Test the actual service action without logging its credentials. Keep server secrets out of `NEXT_PUBLIC_*` and `next.config`'s `env`, which can bundle values into client JavaScript. Browser-visible values are frozen at build time.

For cases the helper does not cover (branch-specific preview values, custom environments, file expansion), use the provider's documented scoped API/CLI with argument arrays and stdin. Never upload a whole local environment without selecting the app's required variables.

## Deployment and recovery

- Use `vercel deploy --target=preview` for a requested preview or `vercel deploy --prod` for production after checking project settings. The documented first-deployment behavior can still assign production; inspect the result and do not promise isolation based solely on a missing `--prod` flag.
- Save the returned URL. `vercel inspect <url-or-id> --json` reports the actual deployment. `--wait --timeout 45s` allows bounded waits; recheck the same ID if it is still building.
- Inspect the specific attempt's logs when it fails. Summarize relevant errors without copying secrets. Correct the cause, then create a new attempt only when needed.
- A deployment-protection login page is not the app. Verify intended access and the product's core action in a browser. Preserve protection unless the user authorized making that deployment public.
- Handle service-dependent deployment order explicitly: migrations before the code that requires them, stable callback/base URLs, and webhook registration before claiming payment fulfillment works. Use test accounts or sandbox flows where appropriate; deployment authorization alone does not authorize charging a customer.

Sources: [link](https://vercel.com/docs/cli/link), [environment variables](https://vercel.com/docs/cli/env), [deploy](https://vercel.com/docs/cli/deploy), [inspect](https://vercel.com/docs/cli/inspect), [deployment protection](https://vercel.com/docs/deployment-protection). Check the project's installed Next.js environment-variable guide for framework-specific behavior.
