---
name: add-grow-magic-link-access
description: Add paid digital access where a successful Grow purchase creates email-based entitlements and Better Auth sends Resend magic links that create or sign in the buyer. Use for purchase-to-account flows, paid courses/downloads, or porting the Grow + Better Auth + Resend mechanism between projects.
---

# Grow magic-link access

Build the lifecycle as **fulfillment first, notification second**:

`Grow payment -> verified webhook -> durable purchase + entitlement -> access email -> verified magic link -> Better Auth user/session -> entitlement gate`

The purchase may exist before the user. Use the normalized payer email as the initial claim key. Let Better Auth create the user only when the buyer verifies the magic link; do not manufacture Better Auth users in the payment webhook.

## Workflow

1. Inspect the target repository's framework, database/ORM, Better Auth setup, email system, product model, protected routes, migrations, jobs, and tests. Identify:

   - each Grow payment link, process ID, and expected product set;
   - the entitlement each product grants;
   - the thank-you, login, success, and error destinations;
   - whether authentication is buyer-only or the site also permits open signup;
   - the production domain and any existing Resend API key or sender address.

   Detect existing auth and email setup yourself instead of asking whether it exists:

   - Better Auth: whether the `magicLink` plugin is registered, where `sendMagicLink` lives, and its `expiresIn`, `disableSignUp`, and email template;
   - Resend: `RESEND_API_KEY` and sender env vars in env files, env schema, and deployment config, and every existing Resend send call.

   Read [references/architecture.md](references/architecture.md) before choosing persistence or retry behavior. The step is complete when every product maps to an explicit entitlement and callback path, every external setup dependency is known, and Better Auth magic links and Resend are each classified as absent or already configured.

2. Add configuration and a single product registry. Keep Grow identifiers as strings and keep secrets server-only. Prefer the repository's existing env validation. Fetch current official documentation before relying on provider-specific fields or SDK APIs; the stable links are in [references/provider-notes.md](references/provider-notes.md).

3. Provision Resend with the Resend MCP server, following [references/resend-setup.md](references/resend-setup.md). If step 1 found Resend already configured, take that reference's already-configured path: verify the existing setup and change only what fails a check. Otherwise start provisioning early, because DNS verification takes time: discover existing domains and keys, create or reuse the sending domain with click and open tracking off, give the user the DNS records, and create a `sending_access` API key restricted to that domain, written straight to the gitignored local env file. Ask the user only for decisions the repository and Resend account cannot answer, batched into one question. The step is complete when the domain is verified or awaiting the user's DNS change, and the key and sender env vars are configured locally.

4. Implement the Grow webhook at the framework's normal server boundary. Accept the encodings Grow actually sends. Before fulfillment, authenticate or verify the notification using the strongest mechanism available to the merchant, then require a successful paid status, registered process ID, allowed product IDs and quantities, required payer email, and a stable transaction identifier. Select callback and entitlement values from the server registry, never from webhook input.

5. Normalize email once with `trim().toLowerCase()`. In one database transaction:

   - insert or find a purchase keyed by provider + transaction ID;
   - create the mapped entitlement rows idempotently;
   - create or retain an access-email delivery record.

   Fixed bundles require the exact expected product set and grant all entitlements atomically. Selectable carts fulfill only validated purchased items. Duplicate webhook delivery returns success without duplicating access or unrelated side effects. Retain the minimum payment data needed by the product.

6. After durable fulfillment, issue the initial Better Auth magic link to the payer through Resend. Use a server-selected, allowlisted callback into the purchased content. If a `magicLink` plugin already exists, extend its single `sendMagicLink` rather than adding a second sender: select the purchase-access copy from server-side state, such as the allowlisted callback path, and keep the existing login email unchanged for other callers. Keep the existing `expiresIn` unless the purchase flow needs a different lifetime, and make any change explicit because it also affects regular login. Configure the email's stated lifetime to equal Better Auth's actual `expiresIn`, check the Resend SDK's returned error as well as thrown errors, and record delivery success/failure without rolling back access. Email delivery is recoverable and may be at-least-once; entitlement creation must remain exactly-once.

7. Add a thank-you page with a fallback resend form. The resend boundary is server-controlled, rate-limited, bot-protected where supported, and returns a generic response that does not reveal whether an email or purchase exists. For buyer-only auth, require an entitlement before issuing a magic link so the public Better Auth route cannot become an open-signup bypass. For sites with open signup, keep access authorization separate from account creation.

8. Gate content server-side using a verified Better Auth session plus an active entitlement matching the session's normalized email. Client purchase checks may improve presentation but never authorize access. A logged-out buyer goes to login with an allowlisted callback; a logged-in non-buyer sees a useful recovery path. Handle webhook/redirect races with a bounded pending/retry state instead of immediately declaring that no purchase exists.

9. Test every invariant in [references/provider-notes.md](references/provider-notes.md). Run the repository's migrations and relevant checks. The implementation is complete only when first delivery, duplicate delivery, automatic email, fallback resend, first-user creation, existing-user login, redirect, and server-side denial all have observable coverage, and the Resend delivery test in step 6 of the setup reference has passed or is recorded as blocked on DNS.

10. Hand off the exact production setup still requiring a human: Grow webhook enablement and approval flow, payment-link success URLs, any Resend DNS records not yet verified, production environment variables not set through tooling, migration order, and a real low-value end-to-end purchase. Never claim production readiness from mocked webhooks alone.

## Guardrails

- Durable fulfillment never depends on email delivery, analytics, or another best-effort integration.
- Reject unpaid, failed, malformed, unknown, or identifier-less notifications before granting access.
- Treat transaction references as idempotency keys, not secrets.
- Do not trust payer-supplied callback URLs, entitlement names, prices, or product mappings.
- Do not store full raw payment/card payloads. Redact logs and avoid logging magic-link tokens.
- Preserve the purchased email for audit even if an entitlement is later claimed to a user ID.
- Keep click and open tracking off on the domain that sends magic links, and give the application only a domain-restricted `sending_access` Resend key.
- Keep purchase confirmation and authentication email responsibilities explicit. One email may contain both messages, but it must still be transactional, accurate, and recoverable.
