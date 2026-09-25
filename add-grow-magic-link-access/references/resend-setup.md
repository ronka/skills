# Resend setup through the Resend MCP server

Read this before touching Resend. The goal is a verified sending domain, a least-privilege API key, and a proven delivery path — provisioned by the agent, with the human doing only what the MCP server cannot (DNS records at their registrar, secrets in production).

This works in any agent harness that supports MCP. Tool names below are the official `resend-mcp` server's base names (hyphenated); harnesses may expose them with a prefix or different separator (for example `resend.list-domains` or `mcp__resend__list-domains`). Match on the base name.

## 1. Preflight

If the repository already has a Resend API key and sender configured, go to [Already configured](#already-configured) first. The MCP server is optional on that path; request it only when a check fails and the fix needs it.

Otherwise, check that the Resend MCP tools are available (for example, call `list-domains`). If they are missing, ask the user to add the Resend MCP server to their agent's MCP configuration, then wait. Give them the server details, not a harness-specific command, and point to <https://resend.com/docs/mcp-server> for per-client instructions:

- Hosted (preferred): streamable HTTP at `https://mcp.resend.com/mcp`, authenticated with OAuth or an `Authorization: Bearer re_...` header.
- Local: stdio command `npx -y resend-mcp` with the `RESEND_API_KEY` environment variable.

Domain and API-key management needs a full-access connection; a `sending_access` key is not enough. If the harness has no MCP support or the user declines to connect the server, fall back to listing every step below as a manual handoff in the Resend dashboard.

## 2. Discover existing state

Before creating anything:

- `list-domains` — find domains already on the account and their status.
- `list-api-keys` — find existing keys by name (permissions are not shown).
- Read the repository's env files, env schema, and deployment config for an existing `RESEND_API_KEY`, sender address, or app domain.

Reuse a verified domain that clearly belongs to this app. Never remove or modify domains, keys, or webhooks that this setup did not create without explicit user confirmation.

## Already configured

Use this path when the repository has a Resend API key and sender. Run every check yourself before asking the user anything. Load the key from the env file into the request without printing, echoing, or logging it.

1. **Key permission.** Request `GET https://api.resend.com/domains` with the existing key. A success response means a full-access key; a `401` restricted-key error means `sending_access`. Any other failure means the key is invalid: treat Resend as absent and take the normal path from step 1.
2. **Sender domain.** Take the domain from the sender env var. With the MCP server or a full-access key, read that domain's verification status and its click and open tracking settings. With only a `sending_access` key and no MCP server, the settings cannot be read; step 6's delivery test is the tracking check instead.
3. **Other mail on the domain.** Search the repository for other Resend send calls, templates, and broadcast or marketing code that uses the same sender domain.

Then act on the results:

| Finding | Action |
| --- | --- |
| Verified domain, tracking off, `sending_access` key | Provision nothing. Go to step 6. |
| Tracking on; magic-link and transactional mail are the only senders | Turn click and open tracking off, then report the change. |
| Tracking on; other mail relies on it | Ask once. Recommend a dedicated sending subdomain (for example `auth.<domain>`) for magic links through steps 3–5, or turning tracking off on the shared domain. |
| Full-access key used by the application | Create a `sending_access` key per step 5 under a new name. Ask before replacing the existing value; leave revoking the old key to the user. |
| Domain missing or unverified | Keep the existing key if it works and continue from step 3 for the domain. |

Never overwrite an existing env value, disable a working key, or change a domain other mail depends on without confirmation. Batch every question from this path into one prompt.

## 3. Choose the sending domain

Pick without asking when the answer is evident: exactly one verified domain matching the app's production domain, or an app domain in config with no Resend domain yet (use a sending subdomain such as `mail.<app-domain>` unless the root is already used for Resend).

Ask the user only when it is genuinely unclear, such as:

- no production domain is discoverable;
- several plausible domains exist on the account;
- the domain belongs to another Resend account (`create-domain` fails as already registered) — confirm before starting the `create-domain-claim` → `verify-domain-claim` flow.

Ask once, with a recommended option, and batch any other open Resend questions into the same prompt.

## 4. Create and verify the domain

Call `create-domain` with:

- `capabilities`: sending enabled, receiving disabled;
- `clickTracking: false` and `openTracking: false` — click tracking rewrites links, which breaks or pre-consumes single-use magic links, and neither is needed for transactional access email;
- default region unless the repository or user indicates otherwise.

If reusing an existing domain, `get-domain` it and `update-domain` to turn click and open tracking off; tell the user you did so.

Show the returned DNS records to the user as a table (type, name, value, priority) and ask them to add the records at their DNS host. If the agent has a DNS-management tool for that host, offer to add them, and do so only after the user agrees.

Then call `verify-domain` and check `get-domain` for status. DNS propagation can take a while: continue implementing the rest of the skill and re-check before the delivery test instead of blocking. If verification fails, show which records are still unverified.

## 5. Create the API key

Create one key per environment with `create-api-key`:

- `name`: `<app>-<environment>-magic-link`;
- `permission: "sending_access"`;
- `domainId`: the sending domain's ID.

The token is returned once. Write it straight into the repository's gitignored local env file (verify the ignore rule first) instead of repeating it in messages or summaries. If the variable already has a value, ask before replacing it. Never commit it. For production, set it with the deployment platform's env tooling when available and the user confirms; otherwise list it in the handoff. Never pass a full-access key to the application.

Also set the sender, following the repository's env conventions — for example `EMAIL_FROM="<App name> <access@<sending domain>>"`. Infer the display name from the app; ask only if no name is discoverable.

## 6. Prove delivery

Once the domain is verified:

1. Ask the user which inbox to test with, unless they already named one. Never email an address the user did not provide.
2. Send one plain test with `send-email` from the configured sender to confirm the domain and sender work.
3. Run the application's real magic-link path against that inbox (local dev server or test script) and confirm with `list-emails` / `get-email` that the email reached `delivered`, that the link is not rewritten by tracking, and that redeeming it signs in.

If the domain is still unverified when implementation is done, skip this step and put verification plus this test at the top of the handoff.

## 7. Optional: delivery webhooks

Skip by default; the send response is enough to record delivery state. Add a Resend webhook only if the product needs bounce or complaint handling. Then call `create-webhook` for `email.bounced`, `email.complained`, `email.failed`, and `email.suppressed`, store the returned signing secret like the API key, verify signatures in the handler, and handle events idempotently.

## Report back

Summarize: domain name, ID, and verification status; tracking settings; key names created (never the token); env vars written and where; test result; and what the human still must do.
