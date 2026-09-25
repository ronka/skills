---
name: add-polar-magic-link-access
description: Add paid digital access where a Polar checkout link purchase creates email-based entitlements and Better Auth sends Resend magic links that create or sign in the buyer. Use when given a buy.polar.sh checkout link, or for Polar purchase-to-account flows, paid courses/downloads/templates, or porting the Polar + Better Auth + Resend mechanism between projects.
---

# Polar magic-link access

Build the lifecycle as **fulfillment first, notification second**:

`Polar order.paid -> verified webhook -> durable purchase + entitlement -> access email -> verified magic link -> Better Auth user/session -> entitlement gate`

The purchase may exist before the user. Use the normalized customer email as the initial claim key. Let Better Auth create the user only when the buyer verifies the magic link; do not manufacture Better Auth users in the payment webhook.

This skill covers one-time products. If a checkout link sells a recurring product, stop and tell the user that subscription lifecycles are out of scope.

## Workflow

1. Inspect the target repository's framework, database/ORM, Better Auth setup, email system, product model, protected routes, migrations, jobs, and tests. Identify:

   - each Polar checkout link, its environment (sandbox or production), organization ID, and product IDs;
   - the entitlement each product grants;
   - the thank-you, login, success, and error destinations;
   - whether authentication is buyer-only or the site also permits open signup;
   - the production domain and any existing Resend API key or sender address.

   Resolve checkout links following step 2 of [references/polar-setup.md](references/polar-setup.md). Detect existing auth, email, and Polar setup yourself instead of asking whether it exists:

   - Better Auth: whether the `magicLink` plugin is registered, where `sendMagicLink` lives, and its `expiresIn`, `disableSignUp`, and email template;
   - Resend: `RESEND_API_KEY` and sender env vars in env files, env schema, and deployment config, and every existing Resend send call;
   - Polar: `@polar-sh/*` packages, the `@polar-sh/better-auth` plugin and its `webhooks()` handlers, existing webhook routes, and `POLAR_*` env vars.

   Read [references/architecture.md](references/architecture.md) before choosing persistence or retry behavior. The step is complete when every product maps to an explicit entitlement and callback path, every checkout link is resolved to an organization and one-time product IDs, and Better Auth magic links, Resend, and Polar are each classified as absent or already configured.

2. Add configuration and a single product registry. Polar IDs differ between sandbox and production, so read the organization ID and product IDs from environment configuration rather than hard-coding one environment's values. Keep secrets server-only and prefer the repository's existing env validation. Fetch current official documentation before relying on provider-specific fields or SDK APIs; the stable links are in [references/provider-notes.md](references/provider-notes.md).

3. Provision Resend with the Resend MCP server, following [references/resend-setup.md](references/resend-setup.md). If step 1 found Resend already configured, take that reference's already-configured path: verify the existing setup and change only what fails a check. Otherwise start provisioning early, because DNS verification takes time: discover existing domains and keys, create or reuse the sending domain with click and open tracking off, give the user the DNS records, and create a `sending_access` API key restricted to that domain, written straight to the gitignored local env file. Ask the user only for decisions the repository and Resend account cannot answer, batched into one question. The step is complete when the domain is verified or awaiting the user's DNS change, and the key and sender env vars are configured locally.

4. Implement the Polar webhook at the framework's normal server boundary. If the `@polar-sh/better-auth` plugin already registers `webhooks()`, add the handlers there instead of creating a second endpoint. Verify the signature over the raw request body with an SDK or adapter version that supports Standard Webhooks secrets. Then fulfill only an `order.paid` event whose organization, `billing_reason`, product, paid status, and customer email pass the checks in [references/provider-notes.md](references/provider-notes.md), using `order.id` as the idempotency key. Handle `order.refunded` in the same route. Select callback and entitlement values from the server registry, never from webhook input.

   Status codes keep Polar delivering: respond `403` only when verification fails, and `2xx` for every verified event, including ones ignored as irrelevant. Commit fulfillment and respond within about two seconds; never wait on Resend or Better Auth before responding. Put validation and fulfillment in one function that the webhook and any reconciliation job share.

   Ask the user once whether missed purchases justify the optional reconciliation job in [references/architecture.md](references/architecture.md#endpoint-health-and-reconciliation); add it only on a yes.

5. Normalize email once with `trim().toLowerCase()`. In one database transaction:

   - insert or find a purchase keyed by provider + order ID, storing the checkout ID;
   - create the mapped entitlement rows idempotently;
   - create or retain an access-email delivery record.

   Duplicate webhook delivery returns success without duplicating access or unrelated side effects. On `order.refunded`, revoke the purchase's entitlements only when the order status is fully `refunded`, unless the user chose another policy. Retain the minimum payment data needed by the product.

6. Create the Polar webhook endpoint for `order.paid` and `order.refunded` following steps 3–4 of [references/polar-setup.md](references/polar-setup.md), and write its signing secret straight to the gitignored local env file. This changes live Polar resources, so confirm with the user first. The step is complete when the endpoint exists with a Standard Webhooks secret configured locally, or it is listed in the handoff.

7. After durable fulfillment, issue the initial Better Auth magic link to the customer through Resend, dispatched after the webhook response (a transactional outbox or job, or the framework's post-response hook such as `after()` or `waitUntil`). Use a server-selected, allowlisted callback into the purchased content. If a `magicLink` plugin already exists, extend its single `sendMagicLink` rather than adding a second sender: select the purchase-access copy from server-side state, such as the allowlisted callback path, and keep the existing login email unchanged for other callers. Keep the existing `expiresIn` unless the purchase flow needs a different lifetime, and make any change explicit because it also affects regular login. Configure the email's stated lifetime to equal Better Auth's actual `expiresIn`, check the Resend SDK's returned error as well as thrown errors, and record delivery success/failure without rolling back access. Email delivery is recoverable and may be at-least-once; entitlement creation must remain exactly-once.

8. Add a thank-you page that reads `checkout_id` from the query string and looks up the local purchase. It shows a bounded pending state until the webhook commits, then the delivery state, with a resend action for that purchase and a fallback resend-by-email form. Show at most a masked email. Both resend boundaries are server-controlled, rate-limited, bot-protected where supported, and return a generic response that does not reveal whether an email or purchase exists. For buyer-only auth, require an entitlement before issuing a magic link so the public Better Auth route cannot become an open-signup bypass. For sites with open signup, keep access authorization separate from account creation.

   Once the page is deployed at the target origin, point each checkout link's success URL at it with `checkout_id={CHECKOUT_ID}`, following step 5 of [references/polar-setup.md](references/polar-setup.md) and confirming with the user first. Until then, leave live links unchanged. The step is complete when every checkout link in the tested environment redirects to the deployed thank-you page, or the change is listed in the handoff.

9. Gate content server-side using a verified Better Auth session plus an active entitlement matching the session's normalized email. Client purchase checks may improve presentation but never authorize access. A logged-out buyer goes to login with an allowlisted callback; a logged-in non-buyer sees a useful recovery path.

10. Test every invariant in [references/provider-notes.md](references/provider-notes.md). Run the repository's migrations and relevant checks. Then run the sandbox purchase in step 6 of [references/polar-setup.md](references/polar-setup.md) against a publicly reachable deployment. The implementation is complete only when first delivery, duplicate delivery, refund revocation, automatic email, fallback resend, first-user creation, existing-user login, redirect, and server-side denial all have observable coverage, the sandbox purchase has passed, and the delivery test in step 6 of [references/resend-setup.md](references/resend-setup.md) has passed or is recorded as blocked on DNS.

11. Hand off the exact production setup still requiring a human: production Polar webhook endpoint and checkout link success URLs if created only in sandbox, any Resend DNS records not yet verified, production environment variables not set through tooling, migration order, and a real low-value production purchase. Include the endpoint-disabled runbook: Polar emails organization members when it disables the endpoint; fix the cause, re-enable the endpoint, and redeliver failed events from its delivery log. Never claim production readiness from mocked webhooks or sandbox alone.

## Guardrails

- Durable fulfillment never depends on email delivery, analytics, or another best-effort integration.
- Grant access only for verified, paid, one-time `order.paid` events for a registered product in the configured organization, with a customer email and an order ID.
- Return `2xx` for verified events you ignore. Polar disables an endpoint after repeated non-`2xx` responses, which would stop fulfillment for every product.
- Treat order and checkout IDs as idempotency and lookup keys, not secrets.
- Do not trust checkout metadata, custom fields, or query parameters for callback URLs, entitlement names, prices, or product mappings.
- Do not store full raw webhook payloads. Redact logs and avoid logging magic-link tokens or webhook secrets.
- Preserve the purchased email for audit even if an entitlement is later claimed to a user ID.
- Keep click and open tracking off on the domain that sends magic links, and give the application only a domain-restricted `sending_access` Resend key.
- Polar sends its own receipt. Keep the access email focused on access, and keep it transactional, accurate, and recoverable.
